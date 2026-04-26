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
	ref: z.string().min(1),
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

	const job = createJob({
		status: "pending",
		progress: 0,
		ref,
	});

	void runPipeline(job.id, ref, brand).catch((e) => {
		const msg = e instanceof Error ? e.message : String(e);
		updateJob(job.id, { status: "failed", error: msg });
	});

	return c.json({ jobId: job.id });
});

videoJobRoutes.get("/:id", (c) => {
	const job = getJob(c.req.param("id"));
	if (!job) return c.json({ error: "not found" }, 404);
	return c.json(job);
});

videoJobRoutes.get("/:id/events", (c) => {
	const id = c.req.param("id");
	const initial = getJob(id);
	if (!initial) return c.json({ error: "not found" }, 404);

	return streamSSE(c, async (stream) => {
		let closed = false;

		const send = async (job: Job) => {
			if (closed) return;
			await stream.writeSSE({
				event: "status",
				data: JSON.stringify(job),
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

videoJobRoutes.post("/:id/voiceover", async (c) => {
	const id = c.req.param("id");
	const job = getJob(id);
	if (!job) return c.json({ error: "not found" }, 404);

	if (job.audioPath && existsSync(job.audioPath)) {
		return c.json({ audioUrl: `/api/v1/video-jobs/${id}/audio` });
	}
	if (!job.script) {
		return c.json({ error: "script not ready" }, 404);
	}

	const narration = [
		job.script.hook,
		...job.script.scenes.map((s) => s.text),
		job.script.closingCta,
	].join(" ");

	try {
		const { audioPath } = await synthesizeVoice({
			jobId: id,
			text: narration,
		});
		updateJob(id, { audioPath });
		return c.json({ audioUrl: `/api/v1/video-jobs/${id}/audio` });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return c.json({ error: msg }, 502);
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
		},
	});
});

async function runPipeline(
	jobId: string,
	ref: string,
	brand: z.infer<typeof BrandProfileSchema>,
): Promise<void> {
	const parsed = parseRepoUrl(ref);

	updateJob(jobId, {
		status: "extracting",
		progress: 10,
		owner: parsed.owner,
		name: parsed.name,
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
	await renderVideo({
		compositionId: "script-video",
		inputProps: { script, brand },
		outputLocation: videoPath,
		onProgress: (p) => {
			updateJob(jobId, { progress: 65 + Math.round(p * 25) });
		},
	});

	updateJob(jobId, {
		status: "done",
		progress: 100,
		videoPath,
	});
}
