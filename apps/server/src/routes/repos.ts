import { parseRepoUrl } from "@content-factory/agent";
import { env } from "@content-factory/env/server";
import { Hono } from "hono";

export const repoRoutes = new Hono();

const USER_AGENT = "content-factory-agent";
const TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 60_000;
const RANGE_DAYS = new Set([7, 30, 90]);

// Tiny in-memory preview cache keyed by `${owner}/${name}::${days}`.
const cache = new Map<string, { at: number; data: RepoPreview }>();

repoRoutes.get("/preview", async (c) => {
	const ref = c.req.query("ref");
	const days = Number.parseInt(c.req.query("days") ?? "30", 10);
	if (!ref) return c.json({ error: "ref required" }, 400);
	if (!RANGE_DAYS.has(days))
		return c.json({ error: "days must be 7|30|90" }, 400);

	let parsed: ReturnType<typeof parseRepoUrl>;
	try {
		parsed = parseRepoUrl(ref);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return c.json({ error: msg }, 400);
	}

	const key = `${parsed.owner}/${parsed.name}::${days}`;
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
		return c.json(hit.data);
	}

	try {
		const data = await fetchPreview(parsed.owner, parsed.name, days);
		cache.set(key, { at: Date.now(), data });
		return c.json(data);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return c.json({ error: msg }, 502);
	}
});

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface RepoPreviewLanguage {
	name: string;
	bytes: number;
	color: string | null;
}

export interface RepoPreviewCommit {
	sha: string;
	message: string;
	scope: string | null;
	description: string;
	isUserFacing: boolean;
	authorName: string;
	authorAvatarUrl: string | null;
	date: string;
}

export interface RepoPreview {
	owner: string;
	name: string;
	description: string | null;
	primaryLanguage: string | null;
	stars: number;
	languages: RepoPreviewLanguage[];
	commitsInRange: number;
	lastActivity: string | null;
	commits: RepoPreviewCommit[];
}

// ────────────────────────────────────────────────────────────────────────────
// GitHub fetch
// ────────────────────────────────────────────────────────────────────────────

async function fetchPreview(
	owner: string,
	name: string,
	days: number,
): Promise<RepoPreview> {
	const sinceISO = new Date(
		Date.now() - days * 24 * 60 * 60 * 1000,
	).toISOString();
	const ownerEnc = encodeURIComponent(owner);
	const nameEnc = encodeURIComponent(name);

	const [repoRaw, languagesRaw, commitsRaw] = await Promise.all([
		ghFetch(`/repos/${ownerEnc}/${nameEnc}`),
		ghFetch(`/repos/${ownerEnc}/${nameEnc}/languages`).catch(() => ({})),
		ghFetch(
			`/repos/${ownerEnc}/${nameEnc}/commits?per_page=50&since=${encodeURIComponent(sinceISO)}`,
		).catch(() => []),
	]);

	const repo = repoRaw as {
		description: string | null;
		language: string | null;
		stargazers_count: number;
		pushed_at: string | null;
	};

	const languagesMap = (languagesRaw ?? {}) as Record<string, number>;
	const languages: RepoPreviewLanguage[] = Object.entries(languagesMap)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 4)
		.map(([lang, bytes]) => ({
			name: lang,
			bytes,
			color: LANGUAGE_COLOURS[lang] ?? null,
		}));

	type GhCommit = {
		sha: string;
		commit: {
			message: string;
			author: { name: string; date: string } | null;
		};
		author: { login: string; avatar_url: string } | null;
	};
	const commitsArr = (commitsRaw as GhCommit[]) ?? [];

	const commits: RepoPreviewCommit[] = commitsArr.map((c) => {
		const message = c.commit.message.split("\n", 1)[0] ?? "";
		const { scope, description } = parseConventionalMessage(message);
		const isUserFacing = isUserFacingMessage(message, scope);
		return {
			sha: c.sha.slice(0, 7),
			message,
			scope,
			description,
			isUserFacing,
			authorName: c.author?.login ?? c.commit.author?.name ?? "unknown",
			authorAvatarUrl: c.author?.avatar_url ?? null,
			date: c.commit.author?.date ?? "",
		};
	});

	return {
		owner,
		name,
		description: repo.description ?? null,
		primaryLanguage: repo.language ?? null,
		stars: repo.stargazers_count ?? 0,
		languages,
		commitsInRange: commits.length,
		lastActivity: repo.pushed_at ?? null,
		commits,
	};
}

async function ghFetch(path: string): Promise<unknown> {
	const headers: Record<string, string> = {
		"User-Agent": USER_AGENT,
		Accept: "application/vnd.github+json",
	};
	if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	let res: Response;
	try {
		res = await fetch(`https://api.github.com${path}`, {
			headers,
			signal: controller.signal,
		});
	} catch (e) {
		clearTimeout(timer);
		const reason = e instanceof Error ? e.message : String(e);
		throw new Error(`github ${path} request failed: ${reason}`);
	}
	clearTimeout(timer);
	if (!res.ok) {
		throw new Error(`github ${path} responded ${res.status}`);
	}
	return res.json();
}

// ────────────────────────────────────────────────────────────────────────────
// Heuristics
// ────────────────────────────────────────────────────────────────────────────

const SCOPE_RE =
	/^(feat|fix|perf|refactor|chore|docs|test|ci|build|style|revert)(?:\(([^)]+)\))?:\s*(.*)$/i;

function parseConventionalMessage(message: string): {
	scope: string | null;
	description: string;
} {
	const m = message.match(SCOPE_RE);
	if (!m) return { scope: null, description: message };
	const type = m[1]?.toLowerCase() ?? "";
	const sub = m[2];
	const rest = m[3] ?? message;
	const scope = sub ? `${type}(${sub}):` : `${type}:`;
	return { scope, description: rest };
}

function isUserFacingMessage(message: string, scope: string | null): boolean {
	const m = scope ?? message;
	return /^(feat|fix|perf)/i.test(m);
}

// Subset of github-linguist colors. Add more as needed.
const LANGUAGE_COLOURS: Record<string, string> = {
	TypeScript: "#3178C6",
	JavaScript: "#F1E05A",
	Go: "#00ADD8",
	Python: "#3572A5",
	Rust: "#DEA584",
	Ruby: "#701516",
	Java: "#B07219",
	Kotlin: "#A97BFF",
	Swift: "#FA7343",
	"C++": "#F34B7D",
	C: "#555555",
	"C#": "#178600",
	PHP: "#4F5D95",
	Shell: "#89E051",
	HTML: "#E34C26",
	CSS: "#563D7C",
	SCSS: "#C6538C",
	Vue: "#41B883",
	Svelte: "#FF3E00",
	Dockerfile: "#384D54",
	Markdown: "#083FA1",
};
