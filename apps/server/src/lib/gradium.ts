import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { env } from "@content-factory/env/server";

// Gradium TTS POST endpoint per https://docs.gradium.ai/api-reference/openapi.json
// Auth header is `x-api-key` (not Bearer). Default voice "YTpq7expH9539ERJ" is
// Emma's voice from the public library. Output format wav (mp3 unsupported).
const GRADIUM_TTS_URL = "https://api.gradium.ai/api/post/speech/tts";
const DEFAULT_VOICE_ID = "YTpq7expH9539ERJ";
const TIMEOUT_MS = 60_000;

export interface SynthesizeArgs {
	jobId: string;
	text: string;
	voiceId?: string;
}

export interface SynthesizeResult {
	audioPath: string;
}

export async function synthesizeVoice({
	jobId,
	text,
	voiceId,
}: SynthesizeArgs): Promise<SynthesizeResult> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	let res: Response;
	try {
		res = await fetch(GRADIUM_TTS_URL, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-api-key": env.GRADIUM_API_KEY,
			},
			body: JSON.stringify({
				text,
				voice_id: voiceId ?? DEFAULT_VOICE_ID,
				output_format: "wav",
				only_audio: true,
			}),
			signal: controller.signal,
		});
	} catch (e) {
		clearTimeout(timer);
		const reason = e instanceof Error ? e.message : String(e);
		throw new Error(`voiceover failed: ${reason}`);
	}
	clearTimeout(timer);

	if (!res.ok) {
		const bodyText = await safeText(res);
		throw new Error(
			`voiceover failed: gradium ${res.status} ${res.statusText}${
				bodyText ? ` — ${bodyText.slice(0, 200)}` : ""
			}`,
		);
	}

	const buf = Buffer.from(await res.arrayBuffer());
	const audioPath = path.join(os.tmpdir(), `cf-${jobId}-voice.wav`);
	await writeFile(audioPath, buf);
	return { audioPath };
}

async function safeText(res: Response): Promise<string> {
	try {
		return await res.text();
	} catch {
		return "";
	}
}
