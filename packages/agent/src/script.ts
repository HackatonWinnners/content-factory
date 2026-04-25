import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { BrandProfile, MarketContext, RepoSnapshot } from "./schemas";
import { type VideoScript, VideoScriptSchema } from "./schemas";

const MODEL_ID = "gemini-2.5-flash";
const MIN_TOTAL_SEC = 30;
const MAX_TOTAL_SEC = 60;

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

	const first = await runOnce({ system, user });
	if (
		totalSeconds(first) >= MIN_TOTAL_SEC &&
		totalSeconds(first) <= MAX_TOTAL_SEC
	) {
		return first;
	}

	const retryUser = `${user}\n\nIMPORTANT: previous draft totalled ${totalSeconds(
		first,
	)}s. The sum of all scenes' durationSec MUST be between ${MIN_TOTAL_SEC} and ${MAX_TOTAL_SEC}.`;
	return runOnce({ system, user: retryUser });
}

async function runOnce({
	system,
	user,
}: {
	system: string;
	user: string;
}): Promise<VideoScript> {
	const { object } = await generateObject({
		model: google(MODEL_ID),
		schema: VideoScriptSchema,
		schemaName: "VideoScript",
		schemaDescription:
			"Vertical short-form video script with hook + scenes + CTA",
		system,
		prompt: user,
	});
	return object;
}

function totalSeconds(script: VideoScript): number {
	return script.scenes.reduce((acc, s) => acc + s.durationSec, 0);
}

function systemPrompt(brand: BrandProfile): string {
	const tone = describeTone(brand);
	return [
		`You are a video script writer for the brand "${brand.name}".`,
		`Voice: ${brand.voice}.`,
		`Tone adjectives: ${tone}.`,
		brand.rules?.dos?.length ? `Do: ${brand.rules.dos.join("; ")}.` : "",
		brand.rules?.donts?.length ? `Don't: ${brand.rules.donts.join("; ")}.` : "",
		"Output a 30-60 second vertical short-form script: a punchy hook, 4-8 scenes (each 2-8s), and a closing CTA.",
		"Every scene needs concrete user-facing facts pulled from the source. No vague filler.",
	]
		.filter(Boolean)
		.join(" ");
}

function userPrompt({
	snapshot,
	market,
}: {
	snapshot: RepoSnapshot;
	market: MarketContext;
}): string {
	const lines: string[] = [
		`Repo: ${snapshot.owner}/${snapshot.name} (${snapshot.stars}★)`,
		snapshot.description ? `Description: ${snapshot.description}` : "",
		snapshot.primaryLanguage
			? `Primary language: ${snapshot.primaryLanguage}`
			: "",
		snapshot.topics.length ? `Topics: ${snapshot.topics.join(", ")}` : "",
		"",
		"README excerpt:",
		snapshot.readme.slice(0, 8_000),
	];

	if (snapshot.recentCommits.length > 0) {
		lines.push("", "Recent commits:");
		for (const c of snapshot.recentCommits.slice(0, 8)) {
			lines.push(`- ${c.message}`);
		}
	}

	if (market.results.length > 0) {
		lines.push("", "Competitors / similar projects in the wild:");
		for (const r of market.results) {
			lines.push(`- ${r.title} — ${r.snippet.slice(0, 200)}`);
		}
		lines.push(
			"",
			"Use the competitor context to highlight a unique angle this project owns.",
		);
	}

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
