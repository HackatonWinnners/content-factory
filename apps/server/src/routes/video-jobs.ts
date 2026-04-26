import { createReadStream, existsSync, statSync } from "node:fs";
import { copyFile, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import {
	BrandProfileSchema,
	fetchMarketContext,
	fetchRepoSnapshot,
	parseRepoUrl,
	type VideoScript,
	writeScriptFromRepo,
} from "@content-factory/agent";
import { renderVideo } from "@content-factory/composer";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { readWavDurationSeconds } from "../lib/audio";
import { pickVoiceForTone, synthesizeVoice } from "../lib/gradium";
import {
	createJob,
	getJob,
	type Job,
	type JobAssets,
	subscribe,
	updateJob,
	type VoiceAsset,
} from "../lib/jobs";

const CreateJobSchema = z.object({
	kind: z.enum(["git", "linear", "pdf"]),
	ref: z.string().min(1).max(500),
	brand: BrandProfileSchema,
});

// Composer's public/ folder. We write per-job audio files here before rendering
// so Remotion's bundler picks them up via staticFile(). Resolved relative to
// this source file at runtime.
const COMPOSER_PUBLIC_DIR = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../../../packages/composer/public",
);

// Music library lives OUTSIDE composer/public/ so it doesn't get bundled into
// the Remotion serve bundle (each render copies only the chosen track in).
const MUSIC_LIBRARY_DIR = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../../../packages/composer/music-library",
);
const MUSIC_TRACKS = [
	"lofi.mp3",
	"cinematic.mp3",
	"ambient.mp3",
	"upbeat.mp3",
] as const;
type MusicTrack = (typeof MUSIC_TRACKS)[number];

function pickMusicTrack(tone: {
	formalCasual: number;
	seriousPlayful: number;
	directStorytelling: number;
}): MusicTrack {
	if (tone.formalCasual >= 65 && tone.seriousPlayful >= 60) return "upbeat.mp3";
	if (tone.formalCasual <= 35 && tone.seriousPlayful <= 40)
		return "cinematic.mp3";
	if (tone.directStorytelling >= 65) return "ambient.mp3";
	return "lofi.mp3";
}

export const videoJobRoutes = new Hono();

videoJobRoutes.post("/", async (c) => {
	const raw = await c.req.json().catch(() => null);
	const parsed = CreateJobSchema.safeParse(raw);
	if (!parsed.success) {
		return c.json({ error: "invalid body", issues: parsed.error.issues }, 400);
	}
	const { kind, ref, brand } = parsed.data;
	if (kind !== "git") {
		return c.json({ error: "coming soon" }, 400);
	}

	let parsedRepo: ReturnType<typeof parseRepoUrl>;
	try {
		parsedRepo = parseRepoUrl(ref);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return c.json({ error: msg }, 400);
	}

	const job = createJob({
		status: "pending",
		progress: 0,
		ref,
		owner: parsedRepo.owner,
		name: parsedRepo.name,
	});

	void runPipeline(job.id, ref, parsedRepo, brand).catch((e) => {
		const msg = e instanceof Error ? e.message : String(e);
		console.error(`pipeline ${job.id} failed:`, e);
		updateJob(job.id, { status: "failed", error: msg });
	});

	return c.json({ jobId: job.id });
});

videoJobRoutes.get("/:id", (c) => {
	const job = getJob(c.req.param("id"));
	if (!job) return c.json({ error: "not found" }, 404);
	return c.json(toPublicJob(job));
});

videoJobRoutes.get("/:id/events", (c) => {
	const id = c.req.param("id");
	const initial = getJob(id);
	if (!initial) return c.json({ error: "not found" }, 404);

	return streamSSE(c, async (stream) => {
		let closed = false;
		let lastSent: string | null = null;

		const send = async (job: Job) => {
			if (closed) return;
			const data = JSON.stringify(toPublicJob(job));
			if (data === lastSent) return;
			lastSent = data;
			try {
				await stream.writeSSE({ event: "status", data });
			} catch {
				closed = true;
			}
		};

		await send(initial);
		if (initial.status === "done" || initial.status === "failed") {
			closed = true;
			return;
		}

		await new Promise<void>((resolve) => {
			const finish = () => {
				unsubscribe();
				closed = true;
				resolve();
			};

			const unsubscribe = subscribe(id, (job) => {
				send(job)
					.then(() => {
						if (closed || job.status === "done" || job.status === "failed") {
							finish();
						}
					})
					.catch(() => finish());
			});

			const post = getJob(id);
			if (post) {
				send(post)
					.then(() => {
						if (closed || post.status === "done" || post.status === "failed") {
							finish();
						}
					})
					.catch(() => finish());
			}

			stream.onAbort(finish);
		});
	});
});

videoJobRoutes.get("/:id/video", (c) => {
	const job = getJob(c.req.param("id"));
	if (!job?.videoPath || !existsSync(job.videoPath)) {
		return c.json({ error: "not found" }, 404);
	}
	const size = statSync(job.videoPath).size;
	const nodeStream = createReadStream(job.videoPath);
	const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
	return new Response(webStream, {
		headers: {
			"content-type": "video/mp4",
			"content-length": String(size),
			"cache-control": "no-store",
		},
	});
});

// Public job snapshot — strip filesystem paths and the heavy script object.
function toPublicJob(job: Job) {
	const { videoPath, audioPath, script, assets, ...rest } = job;
	return {
		...rest,
		hasVideo: Boolean(videoPath),
		hasAudio: Boolean(audioPath),
		hasScript: Boolean(script),
		hasAssets: Boolean(assets),
	};
}

async function runPipeline(
	jobId: string,
	ref: string,
	parsedRepo: ReturnType<typeof parseRepoUrl>,
	brand: z.infer<typeof BrandProfileSchema>,
): Promise<void> {
	updateJob(jobId, {
		status: "extracting",
		progress: 8,
		owner: parsedRepo.owner,
		name: parsedRepo.name,
	});
	const snapshot = await fetchRepoSnapshot(ref);
	updateJob(jobId, {
		stars: snapshot.stars,
		primaryLanguage: snapshot.primaryLanguage ?? undefined,
	});

	updateJob(jobId, { status: "researching", progress: 22 });
	const market = await fetchMarketContext({
		topic: `${snapshot.owner}/${snapshot.name} ${
			snapshot.description ?? snapshot.primaryLanguage ?? ""
		}`.trim(),
	});

	updateJob(jobId, { status: "scripting", progress: 38 });
	const script = await writeScriptFromRepo({ snapshot, brand, market });
	updateJob(jobId, { script });

	updateJob(jobId, { status: "voicing", progress: 55 });
	const assets = await synthesizeAllVoiceovers(jobId, script, brand.tone);
	updateJob(jobId, { assets });

	updateJob(jobId, { status: "rendering", progress: 70 });
	const videoPath = path.join(os.tmpdir(), `cf-${jobId}.mp4`);
	let lastProgressTick = 70;
	await renderVideo({
		compositionId: "script-video",
		inputProps: {
			script,
			brand: { name: brand.name, tone: brand.tone },
			assets: assetsToInputProps(jobId, assets),
			repo: {
				owner: snapshot.owner,
				name: snapshot.name,
				stars: snapshot.stars,
				primaryLanguage: snapshot.primaryLanguage ?? undefined,
			},
		},
		outputLocation: videoPath,
		onProgress: (p) => {
			const next = 70 + Math.round(p * 28);
			if (next !== lastProgressTick) {
				lastProgressTick = next;
				updateJob(jobId, { progress: next });
			}
		},
	});

	updateJob(jobId, {
		status: "done",
		progress: 100,
		videoPath,
	});

	// Best-effort cleanup of per-job audio dir from public/. The MP4 already
	// has them embedded so we don't need them on disk anymore.
	void cleanupJobAssets(jobId);
}

async function synthesizeAllVoiceovers(
	jobId: string,
	script: VideoScript,
	tone: z.infer<typeof BrandProfileSchema>["tone"],
): Promise<JobAssets> {
	const jobDir = path.join(COMPOSER_PUBLIC_DIR, "jobs", jobId);
	await mkdir(jobDir, { recursive: true });

	const voiceId = pickVoiceForTone(tone);

	// Build TTS jobs for hook + every scene + cta. Gradium caps concurrency at
	// 3 active sessions, so we run with a small pool to stay safely under that.
	type TtsJob = { text: string; outputPath: string; voiceId: string };
	const jobs: TtsJob[] = [];
	jobs.push({
		text: script.hook.voiceover,
		outputPath: path.join(jobDir, "hook.wav"),
		voiceId,
	});
	for (let i = 0; i < script.scenes.length; i++) {
		const scene = script.scenes[i];
		if (!scene) continue;
		jobs.push({
			text: scene.voiceover,
			outputPath: path.join(jobDir, `scene-${i}.wav`),
			voiceId,
		});
	}
	jobs.push({
		text: script.cta.voiceover,
		outputPath: path.join(jobDir, "cta.wav"),
		voiceId,
	});

	const results = await runWithLimit(jobs, 2, ttsToAsset);

	// Pick a single music track for this job and copy it into the bundle's
	// public/music/ folder. Keeping only one file in there avoids bundling the
	// whole 35MB library on every render.
	const musicDir = path.join(COMPOSER_PUBLIC_DIR, "music");
	await mkdir(musicDir, { recursive: true });
	const chosenTrack = pickMusicTrack(tone);
	const srcMusic = path.join(MUSIC_LIBRARY_DIR, chosenTrack);
	const dstMusic = path.join(musicDir, chosenTrack);
	let musicRel: string | undefined;
	if (existsSync(srcMusic)) {
		await copyFile(srcMusic, dstMusic);
		musicRel = `music/${chosenTrack}`;
	}
	const hook = results[0];
	if (!hook) throw new Error("missing hook tts result");
	const cta = results[results.length - 1];
	if (!cta) throw new Error("missing cta tts result");
	const scenes = results.slice(1, -1);

	return {
		hook,
		scenes,
		cta,
		musicPath: musicRel,
	};
}

async function ttsToAsset({
	text,
	outputPath,
	voiceId,
}: {
	text: string;
	outputPath: string;
	voiceId: string;
}): Promise<VoiceAsset> {
	await synthesizeVoice({ text, outputPath, voiceId });
	const durationSec = readWavDurationSeconds(outputPath);
	return { audioPath: outputPath, durationSec };
}

// Tiny concurrency-limited mapper. Resolves results in input order.
async function runWithLimit<T, R>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let cursor = 0;
	const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (true) {
			const i = cursor++;
			if (i >= items.length) return;
			const item = items[i];
			if (item === undefined) continue;
			results[i] = await worker(item);
		}
	});
	await Promise.all(runners);
	return results;
}

// Convert local filesystem paths to staticFile-relative paths the composer
// expects ("jobs/<id>/hook.wav", "music/lofi.mp3"). Remotion's bundler
// resolves these against the composer's public/ folder.
function assetsToInputProps(jobId: string, assets: JobAssets) {
	const rel = (p: string): string => `jobs/${jobId}/${path.basename(p)}`;
	return {
		hook: {
			audioPath: rel(assets.hook.audioPath),
			durationSec: assets.hook.durationSec,
		},
		scenes: assets.scenes.map((s) => ({
			audioPath: rel(s.audioPath),
			durationSec: s.durationSec,
		})),
		cta: {
			audioPath: rel(assets.cta.audioPath),
			durationSec: assets.cta.durationSec,
		},
		musicPath: assets.musicPath,
	};
}

async function cleanupJobAssets(jobId: string): Promise<void> {
	const jobDir = path.join(COMPOSER_PUBLIC_DIR, "jobs", jobId);
	try {
		await rm(jobDir, { recursive: true, force: true });
	} catch (e) {
		console.warn(`cleanup ${jobId} failed:`, e);
	}
	// Wipe the per-render music too so the next job picks fresh.
	const musicDir = path.join(COMPOSER_PUBLIC_DIR, "music");
	for (const t of MUSIC_TRACKS) {
		try {
			await rm(path.join(musicDir, t), { force: true });
		} catch {
			// ignore
		}
	}
}
