"use client";

import { env } from "@content-factory/env/web";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ScreenShell } from "@/components/screen-shell";
import { type BrandProfile, loadBrandProfile } from "@/lib/brand-profile";
import { pushRecentProject } from "@/lib/recent-projects";

import { CommitList } from "./commit-list";
import { MetadataCard } from "./metadata-card";
import { SourceRightPanel } from "./source-right-panel";
import { SourceSidebar } from "./source-sidebar";
import { TabsAndUrl } from "./tabs-and-url";
import { isLikelyRepoUrl, useRepoPreview } from "./use-repo-preview";

const DEFAULT_URL = "https://github.com/honojs/hono";

export type Format = "vertical" | "horizontal";
export type SourceTab = "github" | "linear" | "pdf";
export type RangeDays = 7 | 30 | 90;

export function SourceScreen() {
	const router = useRouter();
	const [tab, setTab] = useState<SourceTab>("github");
	const [url, setUrl] = useState<string>(DEFAULT_URL);
	const [days, setDays] = useState<RangeDays>(30);
	const [format, setFormat] = useState<Format>("horizontal");
	const [showAll, setShowAll] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const preview = useRepoPreview(url, days);

	const activeKey = useMemo(() => {
		if (preview.status === "ready") {
			return `${preview.data.owner}/${preview.data.name}`;
		}
		return null;
	}, [preview]);

	const visibleCommits = useMemo(() => {
		if (preview.status !== "ready") return [];
		return showAll
			? preview.data.commits
			: preview.data.commits.filter((c) => c.isUserFacing);
	}, [preview, showAll]);

	async function handleGenerate() {
		setSubmitError(null);
		if (tab !== "github") {
			setSubmitError("Only GitHub is wired up so far.");
			return;
		}
		if (!isLikelyRepoUrl(url)) {
			setSubmitError("That doesn't look like a GitHub URL.");
			return;
		}
		const brand: BrandProfile | null = loadBrandProfile();
		if (!brand) {
			router.push("/brand-setup" as Route);
			return;
		}
		setSubmitting(true);
		try {
			const r = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ kind: "git", ref: url, brand }),
			});
			if (!r.ok) {
				const body = await r.json().catch(() => ({}));
				throw new Error(body.error ?? `request failed (${r.status})`);
			}
			const data = (await r.json()) as { jobId: string };
			if (preview.status === "ready") {
				pushRecentProject({
					jobId: data.jobId,
					owner: preview.data.owner,
					name: preview.data.name,
					source: "github",
				});
			}
			router.push(`/thinking?jobId=${data.jobId}` as Route);
		} catch (e) {
			setSubmitError(e instanceof Error ? e.message : "submit failed");
			setSubmitting(false);
		}
	}

	const generateDisabled =
		submitting || tab !== "github" || !isLikelyRepoUrl(url);

	return (
		<ScreenShell
			sidebar={<SourceSidebar activeKey={activeKey} />}
			right={
				<SourceRightPanel
					format={format}
					onFormatChange={setFormat}
					onGenerate={handleGenerate}
					submitting={submitting}
					disabled={generateDisabled}
					error={submitError}
				/>
			}
		>
			<main className="min-w-0 overflow-hidden p-[24px_32px_32px_32px]">
				<h1 className="m-0 font-semibold text-[20px] text-[var(--color-text)] tracking-[-0.01em]">
					New project
				</h1>
				<p className="m-0 text-[13px] text-[var(--color-text-muted)]">
					Pick a source. We'll handle the rest.
				</p>

				<TabsAndUrl
					tab={tab}
					onTabChange={setTab}
					url={url}
					onUrlChange={setUrl}
					days={days}
					onDaysChange={setDays}
				/>

				<MetadataCard preview={preview} />

				<CommitList
					preview={preview}
					showAll={showAll}
					onToggleShowAll={() => setShowAll((s) => !s)}
					visibleCommits={visibleCommits}
				/>
			</main>
		</ScreenShell>
	);
}
