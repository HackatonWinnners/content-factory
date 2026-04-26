import { createReadStream, existsSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import {
	BrandProfileSchema,
	fetchMarketContext,
	fetchRepoSnapshot,
	parseRepoUrl,
	writeScriptFromRepo,
} from "@content-factory/agent";
import { renderVideo } from "@content-factory/composer";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { synthesizeVoice } from "../lib/gradium";
import { createJob, getJob, type Job, subscribe, updateJob } from "../lib/jobs";

const CreateJobSchema = z.object({
	kind: z.enum(["git", "linear", "pdf"]),
	ref: z.string().min(1).max(500),
	brand: BrandProfileSchema,
});

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
		updateJob(job.id, { status: "failed", error: msg });
	});

	return c.json({ jobId: job.id });
});

videoJobRoutes.get("/:id", (c) => {
	const job = getJob(c.req.param("id"));
	if (!job) return c.json({ error: "not found" }, 404);
	const { videoPath, audioPath, script, ...publicJob } = job;
	return c.json({
		...publicJob,
		hasVideo: Boolean(videoPath),
		hasAudio: Boolean(audioPath),
		hasScript: Boolean(script),
	});
});

videoJobRoutes.get("/:id/events", (c) => {
	const id = c.req.param("id");
	const initial = getJob(id);
	if (!initial) return c.json({ error: "not found" }, 404);

	return streamSSE(c, async (stream) => {
		let closed = false;

		const toPublic = (job: Job) => {
			const { videoPath, audioPath, script, ...rest } = job;
			return {
				...rest,
				hasVideo: Boolean(videoPath),
				hasAudio: Boolean(audioPath),
				hasScript: Boolean(script),
			};
		};

		const send = async (job: Job) => {
			if (closed) return;
			await stream.writeSSE({
				event: "status",
				data: JSON.stringify(toPublic(job)),
			});
		};

		await send(initial);
		if (initial.status === "done" || initial.status === "failed") {
			closed = true;
			return;
		}

		await new Promise<void>((resolve) => {
			const unsubscribe = subscribe(id, (job) => {
				void send(job).then(() => {
					if (job.status === "done" || job.status === "failed") {
						unsubscribe();
						closed = true;
						resolve();
					}
				});
			});

			// Re-check status after subscribing in case the job transitioned
			// between the initial snapshot and listener registration.
			const post = getJob(id);
			if (post && (post.status === "done" || post.status === "failed")) {
				void send(post).then(() => {
					unsubscribe();
					closed = true;
					resolve();
				});
			}

			stream.onAbort(() => {
				unsubscribe();
				closed = true;
				resolve();
			});
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
		},
	});
});

const inflightVoiceover = new Map<string, Promise<string>>();

videoJobRoutes.post("/:id/voiceover", async (c) => {
	const id = c.req.param("id");
	const job = getJob(id);
	if (!job) return c.json({ error: "not found" }, 404);
	if (!job.script) {
		return c.json({ error: "script not ready" }, 404);
	}

	const narration = [
		job.script.hook,
		...job.script.scenes.map((s) => s.text),
		job.script.closingCta,
	].join(" ");

	let pending = inflightVoiceover.get(id);
	if (!pending) {
		pending = synthesizeVoice({ jobId: id, text: narration })
			.then(({ audioPath }) => {
				updateJob(id, { audioPath });
				return audioPath;
			})
			.finally(() => {
				inflightVoiceover.delete(id);
			});
		inflightVoiceover.set(id, pending);
	}

	try {
		await pending;
		return c.json({ audioUrl: `/api/v1/video-jobs/${id}/audio` });
	} catch (e) {
		console.error(`voiceover ${id} failed:`, e);
		return c.json({ error: "voiceover synthesis failed" }, 502);
	}
});

videoJobRoutes.get("/:id/audio", (c) => {
	const job = getJob(c.req.param("id"));
	if (!job?.audioPath || !existsSync(job.audioPath)) {
		return c.json({ error: "not found" }, 404);
	}
	const size = statSync(job.audioPath).size;
	const nodeStream = createReadStream(job.audioPath);
	const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
	return new Response(webStream, {
		headers: {
			"content-type": "audio/wav",
			"content-length": String(size),
			"cache-control": "no-store",
		},
	});
});

async function runPipeline(
	jobId: string,
	ref: string,
	parsedRepo: ReturnType<typeof parseRepoUrl>,
	brand: z.infer<typeof BrandProfileSchema>,
): Promise<void> {
	updateJob(jobId, {
		status: "extracting",
		progress: 10,
		owner: parsedRepo.owner,
		name: parsedRepo.name,
	});
	const snapshot = await fetchRepoSnapshot(ref);

	updateJob(jobId, { status: "researching", progress: 25 });
	const market = await fetchMarketContext({
		topic: `${snapshot.owner}/${snapshot.name} ${
			snapshot.description ?? snapshot.primaryLanguage ?? ""
		}`.trim(),
	});

	updateJob(jobId, { status: "scripting", progress: 45 });
	const script = await writeScriptFromRepo({ snapshot, brand, market });
	updateJob(jobId, { script });

	updateJob(jobId, { status: "rendering", progress: 65 });
	const videoPath = path.join(os.tmpdir(), `cf-${jobId}.mp4`);
	let lastProgressTick = 65;
	await renderVideo({
		compositionId: "script-video",
		inputProps: {
			script,
			brand,
			repo: { owner: snapshot.owner, name: snapshot.name },
		},
		outputLocation: videoPath,
		onProgress: (p) => {
			const next = 65 + Math.round(p * 25);
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
}
