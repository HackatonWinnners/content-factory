"use client";

import { env } from "@content-factory/env/web";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type JobStatus =
	| "pending"
	| "extracting"
	| "researching"
	| "scripting"
	| "rendering"
	| "voicing"
	| "done"
	| "failed";

type JobEvent = {
	id: string;
	status: JobStatus;
	progress: number;
	message?: string;
	error?: string;
	owner?: string;
	name?: string;
};

type StepKey =
	| "extracting"
	| "researching"
	| "scripting"
	| "rendering"
	| "done";

type StepState = "done" | "in-progress" | "pending";

type StepDef = {
	key: StepKey;
	name: string;
	pendingBody: string;
	activeBody: string;
	doneBody: string;
};

const STEPS: StepDef[] = [
	{
		key: "extracting",
		name: "extract_user_facing_changes",
		pendingBody:
			"Will scan recent commits and the README for user-facing changes.",
		activeBody: "Reading repo metadata, README, and recent commits…",
		doneBody: "Captured repo metadata, README, and recent commits.",
	},
	{
		key: "researching",
		name: "fetch_market_context",
		pendingBody: "Will pull competitive context to find a unique angle.",
		activeBody: "Searching the web for competing tools and trending hooks…",
		doneBody: "Pulled competitive context to inform the angle.",
	},
	{
		key: "scripting",
		name: "write_voiceover_script",
		pendingBody: "Will draft a 30-60s voiceover script in your brand voice.",
		activeBody: "Drafting the voiceover script in your brand voice…",
		doneBody: "Drafted the voiceover script in your brand voice.",
	},
	{
		key: "rendering",
		name: "render_scenes",
		pendingBody: "Will render the scenes with Remotion at 9:16, 30fps.",
		activeBody: "Rendering scenes with Remotion at 9:16, 30fps…",
		doneBody: "Rendered the scenes with Remotion at 9:16, 30fps.",
	},
	{
		key: "done",
		name: "compose_final_video",
		pendingBody: "Will mix scenes and brand framing into the final MP4.",
		activeBody: "Finalizing…",
		doneBody: "Final video ready. Voiceover available on the result page.",
	},
];

const STATUS_INDEX: Record<JobStatus, number> = {
	pending: 0,
	extracting: 0,
	researching: 1,
	scripting: 2,
	rendering: 3,
	voicing: 3,
	done: 4,
	failed: -1,
};

function stepStateForStatus(idx: number, status: JobStatus): StepState {
	if (status === "done") return "done";
	if (status === "failed") return "pending";
	const cursor = STATUS_INDEX[status] ?? 0;
	if (idx < cursor) return "done";
	if (idx === cursor) return "in-progress";
	return "pending";
}

function StatusDot({ state }: { state: StepState }) {
	if (state === "done") {
		return (
			<span
				aria-hidden
				className="inline-block h-2 w-2 flex-none rounded-full"
				style={{
					background: "#2D6A4F",
					boxShadow: "0 0 0 3px rgba(45,106,79,0.18)",
				}}
			/>
		);
	}
	if (state === "in-progress") {
		return (
			<span
				aria-hidden
				className="brand-pulse inline-block h-2 w-2 flex-none rounded-full bg-[var(--color-magenta)]"
			/>
		);
	}
	return (
		<span
			aria-hidden
			className="inline-block h-2 w-2 flex-none rounded-full border border-[var(--color-text-dim)]"
		/>
	);
}

function FilmIcon() {
	return (
		<svg
			aria-hidden="true"
			width={18}
			height={18}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="2" y="3" width="20" height="18" rx="2" />
			<path d="M2 8h20M2 16h20M7 3v18M17 3v18" />
		</svg>
	);
}

export function ProgressStream({ jobId }: { jobId: string }) {
	const router = useRouter();
	const [job, setJob] = useState<JobEvent | null>(null);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [elapsed, setElapsed] = useState(0);
	const sourceRef = useRef<EventSource | null>(null);
	const terminalRef = useRef(false);

	useEffect(() => {
		const url = `${env.NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs/${jobId}/events`;
		const source = new EventSource(url);
		sourceRef.current = source;

		const handleStatus = (e: MessageEvent) => {
			try {
				const data = JSON.parse(e.data) as JobEvent;
				setJob(data);
				if (data.status === "done") {
					terminalRef.current = true;
					source.close();
					router.replace(`/result?jobId=${jobId}` as Route);
				}
				if (data.status === "failed") {
					terminalRef.current = true;
					source.close();
				}
			} catch {
				// ignore malformed event
			}
		};

		source.addEventListener("status", handleStatus as EventListener);

		source.onerror = () => {
			if (terminalRef.current) return;
			if (source.readyState === EventSource.CLOSED) {
				setConnectionError(
					"Lost connection to the server. Try refreshing the page.",
				);
			}
		};

		return () => {
			source.removeEventListener("status", handleStatus as EventListener);
			source.close();
			sourceRef.current = null;
		};
	}, [jobId, router]);

	useEffect(() => {
		const start = Date.now();
		const interval = setInterval(() => {
			setElapsed(Math.floor((Date.now() - start) / 1000));
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const status: JobStatus = job?.status ?? "pending";
	const progress = job?.progress ?? 0;
	const failed = status === "failed";
	const repoLabel = job?.owner && job?.name ? `${job.owner}/${job.name}` : "—";
	const doneCount = STEPS.filter(
		(_s, i) => stepStateForStatus(i, status) === "done",
	).length;

	return (
		<>
			<header className="grid h-14 grid-cols-[1fr_auto_1fr] items-center border-[var(--color-border)] border-b bg-[var(--color-bg)] px-6">
				<div className="flex items-center gap-[10px] text-[13px] text-[var(--color-text-muted)]">
					<button
						type="button"
						onClick={() => router.push("/source" as Route)}
						aria-label="Back"
						className="inline-flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] transition-[background-color,color] duration-[120ms] hover:bg-[var(--color-elev-1)] hover:text-[var(--color-text)]"
					>
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
							<path d="M15 18l-6-6 6-6" />
						</svg>
					</button>
					<span className="text-[var(--color-text-dim)]">/</span>
					<span>Videos</span>
					<span className="text-[var(--color-text-dim)]">/</span>
					<span className="mono text-[var(--color-text)]">{repoLabel}</span>
				</div>
				<div className="flex min-w-[360px] flex-col items-center gap-[6px]">
					<div className="flex items-center gap-[10px] font-medium text-[14px] text-[var(--color-text)]">
						<span
							className={
								failed
									? "inline-block h-[6px] w-[6px] rounded-full bg-[var(--color-red)]"
									: "brand-pulse inline-block h-[6px] w-[6px] rounded-full bg-[var(--color-magenta)]"
							}
						/>
						<span>{failed ? "Generation failed" : "Generating video"}</span>
					</div>
					<div
						className="relative h-[2px] w-[320px] overflow-hidden rounded-[2px]"
						style={{ background: "rgba(255,255,255,0.06)" }}
					>
						<div
							className="h-full rounded-[2px] bg-[var(--color-magenta)] transition-[width] duration-[800ms]"
							style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
						/>
					</div>
				</div>
				<div className="flex items-center justify-end gap-3">
					<span className="mono text-[12px] text-[var(--color-text-muted)]">
						{elapsed}s elapsed
					</span>
				</div>
			</header>

			<div className="grid flex-1 grid-cols-[860px_1fr]">
				<section className="border-[var(--color-border)] border-r px-8 pt-7 pb-10">
					<h2 className="mb-5 flex items-center gap-2 font-medium text-[13px] text-[var(--color-text-muted)]">
						Agent reasoning
						<span className="mono inline-flex items-center rounded border border-[var(--color-border)] px-[6px] py-[2px] text-[11px] text-[var(--color-text-dim)]">
							{doneCount}/{STEPS.length}
						</span>
					</h2>

					{failed && job?.error ? (
						<div
							role="alert"
							className="mb-4 flex flex-col gap-3 rounded-md border border-[var(--color-red)] bg-[rgba(122,46,46,0.12)] p-4"
						>
							<div className="font-medium text-[13px] text-[var(--color-text)]">
								Generation failed
							</div>
							<div className="text-[13px] text-[var(--color-text-muted)] leading-[1.55]">
								{job.error}
							</div>
							<button
								type="button"
								onClick={() => router.push("/source" as Route)}
								className="mono w-fit cursor-pointer rounded border border-[var(--color-border)] bg-transparent px-3 py-1 text-[12px] text-[var(--color-text-muted)] transition-[background-color,color] duration-[120ms] hover:bg-[var(--color-elev-1)] hover:text-[var(--color-text)]"
							>
								Try again
							</button>
						</div>
					) : null}

					<div className="flex flex-col gap-3">
						{STEPS.map((step, idx) => {
							const state = stepStateForStatus(idx, status);
							const body =
								state === "done"
									? step.doneBody
									: state === "in-progress"
										? step.activeBody
										: step.pendingBody;
							const cardBase =
								"rounded-md border border-[var(--color-border)] p-4 transition-[background-color,border-color] duration-[160ms]";
							const cardCls =
								state === "in-progress"
									? `${cardBase} bg-[var(--color-elev-2)]`
									: state === "done"
										? `${cardBase} bg-[var(--color-elev-1)]`
										: `${cardBase} bg-[var(--color-elev-1)] opacity-40`;
							const accent =
								state === "in-progress" || state === "done"
									? {
											borderLeft: "2px solid var(--color-magenta)",
											paddingLeft: "15px",
										}
									: undefined;
							const shadow =
								state === "in-progress"
									? {
											boxShadow:
												"0 0 0 1px rgba(229,38,124,0.10), 0 18px 40px -24px rgba(229,38,124,0.35)",
										}
									: undefined;

							return (
								<div
									key={step.key}
									className={cardCls}
									style={{ ...accent, ...shadow }}
								>
									<div className="mb-2 flex items-center gap-[10px]">
										<StatusDot state={state} />
										<span className="mono flex-1 font-medium text-[13px] text-[var(--color-text)]">
											{step.name}
										</span>
										{state === "in-progress" ? (
											<span className="mono text-[11px] text-[var(--color-magenta)]">
												now
											</span>
										) : state === "done" ? (
											<span className="mono text-[11px] text-[var(--color-text-dim)]">
												done
											</span>
										) : null}
									</div>
									<p
										className="m-0 text-[14px] leading-[1.55]"
										style={{
											color:
												state === "pending"
													? "var(--color-text-muted)"
													: "#C4C4CB",
										}}
									>
										{body}
									</p>
								</div>
							);
						})}
					</div>
				</section>

				<section className="px-8 pt-7 pb-10">
					<h2 className="mb-5 font-medium text-[13px] text-[var(--color-text-muted)]">
						Live preview
					</h2>
					<div
						className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)]"
						style={{ background: "#0E0E10" }}
					>
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0"
							style={{
								background:
									"repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0 12px, transparent 12px 24px)",
							}}
						/>
						<div className="z-1 flex flex-col items-center gap-[10px] text-[13px] text-[var(--color-text-muted)]">
							<div
								className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)]"
								style={{ background: "rgba(255,255,255,0.015)" }}
							>
								<FilmIcon />
							</div>
							<div>Preview will appear when scenes finish rendering</div>
						</div>
					</div>
					<div className="mono mt-3 flex items-center gap-2 text-[11.5px] text-[var(--color-text-muted)]">
						<span>9:16 vertical</span>
						<span className="text-[var(--color-text-dim)]">·</span>
						<span>30-60 seconds</span>
						<span className="text-[var(--color-text-dim)]">·</span>
						<span>powered by Gradium</span>
					</div>

					{connectionError ? (
						<div
							role="alert"
							className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-elev-1)] p-3 text-[12px] text-[var(--color-text-muted)]"
						>
							{connectionError}
						</div>
					) : null}
				</section>
			</div>
		</>
	);
}

export default ProgressStream;
