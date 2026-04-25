import { type RepoSnapshot, RepoSnapshotSchema } from "./schemas";

const USER_AGENT = "content-factory-agent";
const README_MAX = 12_000;

export type ParsedRepo = { owner: string; name: string };

export function parseRepoUrl(input: string): ParsedRepo {
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		throw new Error("repo input is empty");
	}

	const ghShort = trimmed.match(/^gh:([^/\s]+)\/([^/\s]+?)\/?$/i);
	if (ghShort?.[1] && ghShort[2]) {
		return { owner: ghShort[1], name: stripGitSuffix(ghShort[2]) };
	}

	const httpUrl = trimmed.match(
		/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s?#]+?)\/?(?:[?#].*)?$/i,
	);
	if (httpUrl?.[1] && httpUrl[2]) {
		return { owner: httpUrl[1], name: stripGitSuffix(httpUrl[2]) };
	}

	throw new Error(`unsupported repo input: ${input}`);
}

function stripGitSuffix(name: string): string {
	return name.endsWith(".git") ? name.slice(0, -4) : name;
}

async function ghFetch(path: string): Promise<unknown> {
	const res = await fetch(`https://api.github.com${path}`, {
		headers: {
			"User-Agent": USER_AGENT,
			Accept: "application/vnd.github+json",
		},
	});
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

	const [repoRaw, readmeRaw, commitsRaw] = await Promise.all([
		ghFetch(`/repos/${owner}/${name}`),
		ghFetch(`/repos/${owner}/${name}/readme`).catch(() => null),
		ghFetch(`/repos/${owner}/${name}/commits?per_page=20`).catch(() => []),
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
