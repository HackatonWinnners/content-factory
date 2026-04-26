import { env } from "@content-factory/env/server";
import { type MarketContext, MarketContextSchema } from "./schemas";

const TAVILY_URL = "https://api.tavily.com/search";
const TIMEOUT_MS = 6_000;
// Tavily caps `query` around 400 chars; trim to stay safely under.
const QUERY_MAX = 380;

type TavilyResult = {
	title?: string;
	url?: string;
	content?: string;
	score?: number;
};

type TavilyResponse = { results?: TavilyResult[] };

export async function fetchMarketContext({
	topic,
}: {
	topic: string;
}): Promise<MarketContext> {
	const query = topic.slice(0, QUERY_MAX);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(TAVILY_URL, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				api_key: env.TAVILY_API_KEY,
				query,
				max_results: 5,
				search_depth: "basic",
				include_answer: false,
			}),
			signal: controller.signal,
		});
		if (!res.ok) {
			console.warn(`tavily search failed: ${res.status}`);
			return { topic, results: [] };
		}
		const data = (await res.json()) as TavilyResponse;
		const results = (data.results ?? [])
			.slice(0, 8)
			.map((r) => ({
				title: r.title ?? "",
				url: r.url ?? "",
				snippet: r.content ?? "",
				score: typeof r.score === "number" ? r.score : undefined,
			}))
			.filter((r) => r.title && r.url);
		return MarketContextSchema.parse({ topic, results });
	} catch (err) {
		const reason = err instanceof Error ? err.message : String(err);
		console.warn(`tavily search failed: ${reason}`);
		return { topic, results: [] };
	} finally {
		clearTimeout(timer);
	}
}
