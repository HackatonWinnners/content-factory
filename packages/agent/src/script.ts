import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { BrandProfile, MarketContext, RepoSnapshot } from "./schemas";
import { type VideoScript, VideoScriptSchema } from "./schemas";

// gemini-2.5-pro for higher script quality at the cost of some latency.
// Worth it for the demo; per-job cost is still cents.
const MODEL_ID = "gemini-2.5-pro";
const GEMINI_TIMEOUT_MS = 90_000;

type Args = {
	snapshot: RepoSnapshot;
	brand: BrandProfile;
	market: MarketContext;
};

export async function writeScriptFromRepo({
	snapshot,
	brand,
	market,
}: Args): Promise<VideoScript> {
	const system = systemPrompt(brand);
	const user = userPrompt({ snapshot, market });
	return runOnce({ system, user });
}

async function runOnce({
	system,
	user,
}: {
	system: string;
	user: string;
}): Promise<VideoScript> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
	try {
		const { object } = await generateObject({
			model: google(MODEL_ID),
			schema: VideoScriptSchema,
			schemaName: "VideoScript",
			schemaDescription:
				"Vertical short-form video script — TikTok/Reels format. Hook + 3-6 scenes + CTA. Each scene has a `type`, short on-screen `text`, and longer spoken `voiceover`.",
			system,
			prompt: user,
			abortSignal: controller.signal,
		});
		return object;
	} catch (e) {
		if (controller.signal.aborted) {
			throw new Error(
				`gemini script generation timed out after ${GEMINI_TIMEOUT_MS}ms`,
			);
		}
		throw e;
	} finally {
		clearTimeout(timer);
	}
}

function systemPrompt(brand: BrandProfile): string {
	const tone = describeTone(brand);
	return [
		`You are a senior short-form video scriptwriter for the brand "${brand.name}".`,
		`Brand voice: ${brand.voice}`,
		`Tone: ${tone}.`,
		brand.rules?.dos?.length ? `Do: ${brand.rules.dos.join("; ")}.` : "",
		brand.rules?.donts?.length ? `Avoid: ${brand.rules.donts.join("; ")}.` : "",
		"",
		"# Format",
		"You write 30-60 second vertical videos in the style of TikTok / Instagram Reels — fast, dense, every scene earns its time.",
		"",
		"Output a JSON object matching VideoScriptSchema with exactly these parts:",
		"- hook: { text, voiceover }",
		"- scenes: 3-6 scenes",
		"- cta: { text, voiceover }",
		"",
		"# Scene types — pick the right one for each beat",
		"- 'stat'       — one big number that creates curiosity (stars, perf gain, downloads, age). Provide stat.value (formatted, e.g. '47k', '6×', '99.9%') and stat.label.",
		"- 'fact'       — a single concrete factoid sentence about the project. Use sparingly — at most one per script.",
		"- 'feature'    — one capability of the project. Optionally 2-3 short bullets.",
		"- 'comparison' — vs the status quo. Provide comparison.them and comparison.us — same length, parallel structure.",
		"- 'quote'      — a punchy line pulled or paraphrased from the README / commits.",
		"",
		"# CRITICAL — text vs voiceover",
		"- `text` is what's BURNED ONTO THE VIDEO. Keep it under ~6 words. No full sentences. Caps are fine. This is a TikTok caption.",
		"- `voiceover` is what the NARRATOR SAYS. Natural spoken prose, 1-3 sentences. Can elaborate beyond the on-screen text.",
		"- Example — text: 'Built for the edge.' voiceover: 'Hono runs on Cloudflare Workers, Deno, Bun, and Node — write your API once, ship it anywhere with sub-millisecond cold starts.'",
		"",
		"# Hard rules",
		"- Every scene MUST cite a specific concrete detail from the source data — a number, a code symbol, a feature name, a commit. No filler. No 'leverages', 'empowers', 'unlocks'. No marketing bullshit.",
		"- Open with the strongest hook you have. Often a 'stat' scene works better as opener than a generic phrase.",
		"- Order scenes for momentum: hook → curiosity → meat → punch.",
		"- Close with a clear, specific CTA — what should the viewer do right now?",
		"",
		"# Reference example (for shape, not content)",
		"hook: { text: '47,000 stars. Why?', voiceover: 'Forty-seven thousand developers starred this repo last year. Here\\'s what makes it different.' }",
		"scenes: [",
		"  { type: 'stat', text: '14kB', voiceover: 'The entire framework is fourteen kilobytes — smaller than your average favicon.', stat: { value: '14kB', label: 'core, zero dependencies' } },",
		"  { type: 'feature', text: 'Runs anywhere JS runs.', voiceover: 'One codebase, four runtimes — Workers, Deno, Bun, Node. Write your handler once, deploy it anywhere.', bullets: ['Cloudflare Workers', 'Bun', 'Deno', 'Node 22+'] },",
		"  { type: 'comparison', text: 'Express vs Hono', voiceover: 'Express ships forty-five megabytes of dependencies. Hono ships zero. Same DX, fraction of the cold start.', comparison: { them: 'Express · 45 MB · 350ms cold start', us: 'Hono · 14 kB · 4ms cold start' } },",
		"  { type: 'quote', text: '\"Type-safe by default.\"', voiceover: 'Every route is fully typed end-to-end — request, response, params. No code generation, no runtime overhead.' }",
		"]",
		"cta: { text: 'Try Hono today.', voiceover: 'Run npm install hono and you\\'ve got an API in five lines.' }",
	]
		.filter(Boolean)
		.join("\n");
}

function userPrompt({
	snapshot,
	market,
}: {
	snapshot: RepoSnapshot;
	market: MarketContext;
}): string {
	const lines: string[] = [
		"# Source repository",
		`${snapshot.owner}/${snapshot.name} — ${snapshot.stars.toLocaleString()} stars`,
		snapshot.description ? `Description: ${snapshot.description}` : "",
		snapshot.primaryLanguage
			? `Primary language: ${snapshot.primaryLanguage}`
			: "",
		snapshot.topics.length ? `Topics: ${snapshot.topics.join(", ")}` : "",
		"",
		"## README excerpt",
		snapshot.readme.slice(0, 8_000),
	];

	if (snapshot.recentCommits.length > 0) {
		lines.push("", "## Recent user-facing commits");
		for (const c of snapshot.recentCommits.slice(0, 10)) {
			lines.push(`- ${c.message}`);
		}
	}

	if (market.results.length > 0) {
		lines.push("", "## Competitor / market context");
		for (const r of market.results) {
			lines.push(`- ${r.title} — ${r.snippet.slice(0, 200)}`);
		}
		lines.push(
			"",
			"Use the competitor context to identify a unique angle — what does THIS project do that the others don't?",
		);
	}

	lines.push(
		"",
		"# Your task",
		"Write the video script. Pick scene types deliberately. Cite specific facts. No filler.",
	);

	return lines.filter((l) => l !== undefined).join("\n");
}

function describeTone(brand: BrandProfile): string {
	const t = brand.tone;
	const parts: string[] = [];
	parts.push(t.formalCasual >= 50 ? "casual" : "formal");
	parts.push(t.seriousPlayful >= 50 ? "playful" : "serious");
	parts.push(t.directStorytelling >= 50 ? "story-driven" : "direct");
	return parts.join(", ");
}
