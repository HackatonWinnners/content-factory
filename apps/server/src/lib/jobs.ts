import { randomUUID } from "node:crypto";
import type { VideoScript } from "@content-factory/agent";

export type JobStatus =
	| "pending"
	| "extracting"
	| "researching"
	| "scripting"
	| "rendering"
	| "voicing"
	| "done"
	| "failed";

export interface VoiceAsset {
	audioPath: string;
	durationSec: number;
}

export interface JobAssets {
	hook: VoiceAsset;
	scenes: VoiceAsset[];
	cta: VoiceAsset;
	musicPath?: string;
}

export interface Job {
	id: string;
	status: JobStatus;
	progress: number;
	message?: string;
	script?: VideoScript;
	assets?: JobAssets;
	videoPath?: string;
	audioPath?: string;
	error?: string;
	ref?: string;
	owner?: string;
	name?: string;
	stars?: number;
	primaryLanguage?: string;
}

type Listener = (job: Job) => void;

const jobs = new Map<string, Job>();
const listeners = new Map<string, Set<Listener>>();

export function createJob(init: Partial<Job> = {}): Job {
	const id = init.id ?? randomUUID();
	const job: Job = {
		id,
		status: init.status ?? "pending",
		progress: init.progress ?? 0,
		message: init.message,
		script: init.script,
		assets: init.assets,
		videoPath: init.videoPath,
		audioPath: init.audioPath,
		error: init.error,
		ref: init.ref,
		owner: init.owner,
		name: init.name,
		stars: init.stars,
		primaryLanguage: init.primaryLanguage,
	};
	jobs.set(id, job);
	return job;
}

export function getJob(id: string): Job | undefined {
	return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
	const current = jobs.get(id);
	if (!current) return undefined;
	const next: Job = { ...current, ...patch };
	jobs.set(id, next);
	const set = listeners.get(id);
	if (set) {
		for (const cb of set) {
			try {
				cb(next);
			} catch (e) {
				console.warn("job listener threw", e);
			}
		}
	}
	return next;
}

export function subscribe(id: string, cb: Listener): () => void {
	let set = listeners.get(id);
	if (!set) {
		set = new Set();
		listeners.set(id, set);
	}
	set.add(cb);
	return () => {
		const s = listeners.get(id);
		if (!s) return;
		s.delete(cb);
		if (s.size === 0) listeners.delete(id);
	};
}
