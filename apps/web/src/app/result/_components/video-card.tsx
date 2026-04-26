"use client";

import { env } from "@content-factory/env/web";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { type BrandProfile, loadBrandProfile } from "@/lib/brand-profile";

import { VoiceoverButton } from "./voiceover-button";

type JobStatus =
	| "pending"
	| "extracting"
	| "researching"
	| "scripting"
	| "rendering"
	| "voicing"
	| "done"
	| "failed";

type Job = {
	id: string;
	status: JobStatus;
	progress: number;
	owner?: string;
	name?: string;
	error?: string;
};

function ArrowLeftIcon() {
	return (
		<svg
			aria-hidden="true"
			width={13}
			height={13}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 12H5" />
			<path d="M11 5l-7 7 7 7" />
		</svg>
	);
}

function DownloadIcon() {
	return (
		<svg
			aria-hidden="true"
			width={14}
			height={14}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<path d="M7 10l5 5 5-5" />
			<path d="M12 15V3" />
		</svg>
	);
}

function RefreshIcon() {
	return (
		<svg
			aria-hidden="true"
			width={14}
			height={14}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 12a9 9 0 1 1-3-6.7" />
			<path d="M21 4v5h-5" />
		</svg>
	);
}

export function VideoCard({ jobId }: { jobId: string }) {
	const router = useRouter();
	const [job, setJob] = useState<Job | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [brand, setBrand] = useState<BrandProfile | null>(null);

	useEffect(() => {
		setBrand(loadBrandProfile());
	}, []);

	useEffect(() => {
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const tick = async () => {
			try {
				const response = await fetch(
					`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs/${jobId}`,
				);
				if (!response.ok) {
					throw new Error(`Server returned ${response.status}`);
				}
				const data = (await response.json()) as Job;
				if (cancelled) return;
				setJob(data);
				if (data.status !== "done" && data.status !== "failed") {
					timer = setTimeout(tick, 2000);
				}
			} catch (e) {
				if (cancelled) return;
				setLoadError(e instanceof Error ? e.message : "Failed to load job");
			}
		};

		void tick();
		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [jobId]);

	const repoLabel = job?.owner && job?.name ? `${job.owner}/${job.name}` : "—";
	const ready = job?.status === "done";
	const failed = job?.status === "failed";
	const videoSrc = `${env.NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs/${jobId}/video`;

	return (
		<>
			<header className="grid h-14 grid-cols-[1fr_auto_1fr] items-center border-[var(--color-border)] border-b bg-[var(--color-bg)] px-6">
				<div className="flex items-center gap-[10px] text-[13px] text-[var(--color-text-muted)]">
					<button
						type="button"
						onClick={() => router.push("/source" as Route)}
						aria-label="Back to source"
						className="inline-flex h-[26px] cursor-pointer items-center gap-[6px] rounded-md border border-[var(--color-border)] bg-transparent px-[8px] text-[var(--color-text-muted)] transition-[background-color,color] duration-[120ms] hover:bg-[var(--color-elev-1)] hover:text-[var(--color-text)]"
					>
						<ArrowLeftIcon />
						<span>All projects</span>
					</button>
					<span className="text-[var(--color-text-dim)]">/</span>
					<span className="mono text-[var(--color-text)]">{repoLabel}</span>
				</div>
				<div className="flex items-center justify-center gap-[10px] font-medium text-[14px] text-[var(--color-text)]">
					{failed ? (
						<span className="inline-block h-[6px] w-[6px] rounded-full bg-[var(--color-red)]" />
					) : ready ? (
						<span
							className="inline-block h-[6px] w-[6px] rounded-full"
							style={{
								background: "var(--color-green)",
								boxShadow: "0 0 0 3px rgba(45,106,79,0.18)",
							}}
						/>
					) : (
						<span className="brand-pulse inline-block h-[6px] w-[6px] rounded-full bg-[var(--color-magenta)]" />
					)}
					<span>
						{failed
							? "Generation failed"
							: ready
								? "Video ready"
								: "Still rendering"}
					</span>
				</div>
				<div className="flex items-center justify-end">
					<span className="mono text-[11px] text-[var(--color-text-muted)]">
						9:16 · 1080×1920
					</span>
				</div>
			</header>

			<main className="mx-auto grid w-full max-w-[1280px] flex-1 grid-cols-[420px_1fr] gap-12 px-12 py-12">
				<section className="flex flex-col items-start gap-4">
					<div className="relative w-[360px]">
						<div
							aria-hidden
							className="pointer-events-none absolute"
							style={{
								inset: "-60px",
								borderRadius: "24px",
								filter: "blur(2px)",
								background:
									"radial-gradient(circle at 0% 50%, rgba(229,38,124,0.14), transparent 38%), radial-gradient(circle at 100% 50%, rgba(229,38,124,0.10), transparent 38%)",
							}}
						/>
						<div
							className="relative aspect-[9/16] w-[360px] overflow-hidden rounded-md border bg-[#08080A]"
							style={{ borderColor: "rgba(255,255,255,0.12)" }}
						>
							{ready ? (
								// biome-ignore lint/a11y/useMediaCaption: hackathon demo, no captions yet
								<video
									data-testid="result-video"
									controls
									preload="metadata"
									src={videoSrc}
									className="h-full w-full object-cover"
								/>
							) : (
								<div className="flex h-full w-full flex-col items-center justify-center gap-3 px-8 text-center">
									{failed ? (
										<>
											<div className="font-medium text-[15px] text-[var(--color-text)]">
												Generation failed
											</div>
											<div className="text-[13px] text-[var(--color-text-muted)] leading-[1.5]">
												{job?.error ?? "Something went wrong while rendering."}
											</div>
										</>
									) : loadError ? (
										<>
											<div className="font-medium text-[15px] text-[var(--color-text)]">
												Couldn't load this job
											</div>
											<div className="text-[13px] text-[var(--color-text-muted)] leading-[1.5]">
												{loadError}
											</div>
										</>
									) : (
										<>
											<div className="font-medium text-[15px] text-[var(--color-text)]">
												Still rendering
											</div>
											<div className="text-[13px] text-[var(--color-text-muted)] leading-[1.5]">
												Head back to{" "}
												<button
													type="button"
													onClick={() =>
														router.push(`/thinking?jobId=${jobId}` as Route)
													}
													className="underline decoration-[var(--color-magenta)] underline-offset-[3px] transition-colors hover:text-[var(--color-magenta)]"
												>
													/thinking
												</button>{" "}
												to watch progress.
											</div>
										</>
									)}
								</div>
							)}
						</div>
					</div>

					<div className="mono flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
						<span>9:16 vertical</span>
						<span className="text-[var(--color-text-dim)]">·</span>
						<span>30-60 seconds</span>
						<span className="text-[var(--color-text-dim)]">·</span>
						<span>powered by Gradium</span>
					</div>
				</section>

				<section className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<h1 className="font-semibold text-[28px] text-[var(--color-text)] tracking-[-0.012em]">
							{ready ? "Your video is ready." : "Almost there."}
						</h1>
						<p className="text-[14px] text-[var(--color-text-muted)] leading-[1.55]">
							{ready
								? "Review it, generate the AI voiceover, or spin up another."
								: "Once the render finishes the player will load here automatically."}
						</p>
					</div>

					<div
						className="grid grid-cols-3 overflow-hidden rounded-md border border-[var(--color-border)]"
						style={{ background: "var(--color-elev-1)" }}
					>
						<div className="flex h-[68px] flex-col justify-center gap-[6px] border-[var(--color-border)] border-r px-4">
							<div className="mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]">
								Brand
							</div>
							<div className="font-medium text-[13px] text-[var(--color-text)]">
								{brand?.name ?? "—"}
							</div>
						</div>
						<div className="flex h-[68px] flex-col justify-center gap-[6px] border-[var(--color-border)] border-r px-4">
							<div className="mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]">
								Source
							</div>
							<div className="mono font-medium text-[13px] text-[var(--color-text)]">
								{repoLabel}
							</div>
						</div>
						<div className="flex h-[68px] flex-col justify-center gap-[6px] px-4">
							<div className="mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]">
								Status
							</div>
							<div className="font-medium text-[13px] text-[var(--color-text)]">
								{failed ? "Failed" : ready ? "Generated" : "Rendering"}
							</div>
						</div>
					</div>

					<VoiceoverButton jobId={jobId} disabled={!ready} />

					<div className="flex flex-wrap items-center gap-3">
						<a
							href={ready ? videoSrc : undefined}
							download={ready ? `cf-${jobId}.mp4` : undefined}
							aria-disabled={!ready}
							className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 font-medium text-[13px] transition-[background-color,border-color] duration-[120ms] ${
								ready
									? "cursor-pointer border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-1)]"
									: "pointer-events-none cursor-not-allowed border-[var(--color-border)] bg-transparent text-[var(--color-text-dim)] opacity-60"
							}`}
						>
							<DownloadIcon />
							Download video
						</a>
						<button
							type="button"
							onClick={() => router.push("/source" as Route)}
							className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-4 font-medium text-[13px] text-[var(--color-text)] transition-[background-color,border-color] duration-[120ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-1)]"
						>
							<RefreshIcon />
							Generate another
						</button>
					</div>
				</section>
			</main>
		</>
	);
}

export default VideoCard;
