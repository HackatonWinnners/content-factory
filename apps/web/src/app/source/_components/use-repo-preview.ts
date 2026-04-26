import { env } from "@content-factory/env/web";
import { useEffect, useState } from "react";

export type PreviewLanguage = {
	name: string;
	bytes: number;
	color: string | null;
};

export type PreviewCommit = {
	sha: string;
	message: string;
	scope: string | null;
	description: string;
	isUserFacing: boolean;
	authorName: string;
	authorAvatarUrl: string | null;
	date: string;
};

export type RepoPreview = {
	owner: string;
	name: string;
	description: string | null;
	primaryLanguage: string | null;
	stars: number;
	languages: PreviewLanguage[];
	commitsInRange: number;
	lastActivity: string | null;
	commits: PreviewCommit[];
};

export type PreviewState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "ready"; data: RepoPreview }
	| { status: "error"; error: string };

const URL_RE =
	/^https?:\/\/(?:www\.)?github\.com\/[^/\s?#]+\/[^/\s?#]+\/?(?:[?#].*)?$/i;

export function isLikelyRepoUrl(input: string): boolean {
	return URL_RE.test(input.trim());
}

export function useRepoPreview(ref: string, days: number): PreviewState {
	const [state, setState] = useState<PreviewState>({ status: "idle" });

	useEffect(() => {
		if (!isLikelyRepoUrl(ref)) {
			setState({ status: "idle" });
			return;
		}
		const controller = new AbortController();
		const handle = window.setTimeout(async () => {
			setState({ status: "loading" });
			try {
				const r = await fetch(
					`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/repos/preview?ref=${encodeURIComponent(ref)}&days=${days}`,
					{ signal: controller.signal },
				);
				if (!r.ok) {
					const body = await r.json().catch(() => ({}));
					throw new Error(body.error ?? `preview failed (${r.status})`);
				}
				const data = (await r.json()) as RepoPreview;
				setState({ status: "ready", data });
			} catch (e) {
				if (controller.signal.aborted) return;
				const msg = e instanceof Error ? e.message : "preview failed";
				setState({ status: "error", error: msg });
			}
		}, 400);
		return () => {
			controller.abort();
			window.clearTimeout(handle);
		};
	}, [ref, days]);

	return state;
}
