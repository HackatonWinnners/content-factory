import { env } from "@content-factory/env/server";
import { type RepoSnapshot, RepoSnapshotSchema } from "./schemas";

const USER_AGENT = "content-factory-agent";
const README_MAX = 12_000;
const GH_TIMEOUT_MS = 10_000;

export type ParsedRepo = { owner: string; name: string };

// GitHub-permitted segment chars: alphanumerics, dot, dash, underscore.
// Must contain at least one alphanumeric to reject pure-dot segments like "."
// or ".." which GitHub's REST collapses into a different endpoint.
const SEGMENT = /^[A-Za-z0-9._-]*[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

export function parseRepoUrl(input: string): ParsedRepo {
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		throw new Error("repo input is empty");
	}

	const httpUrl = trimmed.match(
		/^https?:\/\/(?:www\.)?github\.com\/([^/\s?#]+)\/([^/\s?#]+?)\/?(?:[?#].*)?$/i,
	);
	if (httpUrl?.[1] && httpUrl[2]) {
		const owner = httpUrl[1];
		const name = stripGitSuffix(httpUrl[2]);
		if (!SEGMENT.test(owner) || !SEGMENT.test(name)) {
			throw new Error(`unsupported repo input: ${input}`);
		}
		return { owner, name };
	}

	throw new Error(`unsupported repo input: ${input}`);
}

function stripGitSuffix(name: string): string {
	return name.endsWith(".git") ? name.slice(0, -4) : name;
}

async function ghFetch(path: string): Promise<unknown> {
	const headers: Record<string, string> = {
		"User-Agent": USER_AGENT,
		Accept: "application/vnd.github+json",
	};
	if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), GH_TIMEOUT_MS);
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

type GhRepo = {
	description: string | null;
	language: string | null;
	topics?: string[];
	stargazers_count: number;
};

type GhReadme = { content: string; encoding: string };
type GhCommit = { commit: { message: string; author: { date: string } } };

export async function fetchRepoSnapshot(input: string): Promise<RepoSnapshot> {
	const { owner, name } = parseRepoUrl(input);

	const ownerEnc = encodeURIComponent(owner);
	const nameEnc = encodeURIComponent(name);
	const [repoRaw, readmeRaw, commitsRaw] = await Promise.all([
		ghFetch(`/repos/${ownerEnc}/${nameEnc}`),
		ghFetch(`/repos/${ownerEnc}/${nameEnc}/readme`).catch(() => null),
		ghFetch(`/repos/${ownerEnc}/${nameEnc}/commits?per_page=20`).catch(
			() => [],
		),
	]);

	const repo = repoRaw as GhRepo;
	const readme = decodeReadme(readmeRaw as GhReadme | null);
	const recentCommits = (commitsRaw as GhCommit[]).map((c) => ({
		message: c.commit.message.split("\n", 1)[0] ?? "",
		date: c.commit.author?.date ?? "",
	}));

	return RepoSnapshotSchema.parse({
		owner,
		name,
		description: repo.description ?? null,
		primaryLanguage: repo.language ?? null,
		topics: repo.topics ?? [],
		stars: repo.stargazers_count ?? 0,
		readme,
		recentCommits,
	});
}

function decodeReadme(raw: GhReadme | null): string {
	if (!raw) return "";
	if (raw.encoding !== "base64") return raw.content.slice(0, README_MAX);
	const decoded = Buffer.from(raw.content, "base64").toString("utf8");
	return decoded.slice(0, README_MAX);
}
