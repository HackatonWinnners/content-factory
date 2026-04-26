"use client";

import { env } from "@content-factory/env/web";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { type BrandProfile, loadBrandProfile } from "@/lib/brand-profile";

import { useStreamingText } from "./use-streaming-text";

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

// 8 decision cards mapped to backend phases. The mapping is deliberately
// over-specific: real backend has 5 phases (extracting/researching/scripting/
// voicing/rendering); we synthesize a couple of intermediate "decisions" that
// fall between phases so the agent feels reasoning-rich.
type DecisionId =
	| "extract"
	| "market"
	| "select"
	| "hook"
	| "script"
	| "visuals"
	| "voiceover"
	| "compose";

type DecisionState = "done" | "in-progress" | "pending";

type DecisionDef = {
	id: DecisionId;
	name: string;
	body: string;
	chips?: { k: string; v: string }[];
	features?: string[];
	timestamp: string;
};

const DECISIONS: DecisionDef[] = [
	{
		id: "extract",
		name: "extract_user_facing_changes",
		body: "Found 6 user-facing changes. Filtered out 41 internal commits — refactors, dependency bumps, test reorganization.",
		chips: [
			{ k: "47", v: "commits scanned" },
			{ k: "6", v: "user-facing" },
			{ k: "41", v: "dropped" },
		],
		timestamp: "12s ago",
	},
	{
		id: "market",
		name: "fetch_market_context",
		body: "Searched what 12 competing dev tools led with this month. Most pushed “security” or “reliability”. We'll lead with speed instead — it's the white space.",
		chips: [
			{ k: "12", v: "competitors" },
			{ k: "8", v: "led with security" },
			{ k: "4", v: "led with reliability" },
		],
		timestamp: "9s ago",
	},
	{
		id: "select",
		name: "select_features",
		body: "Picked the 3 features most likely to land for technical readers. Ordered by emotional weight: lightest hook first, biggest payoff last.",
		features: ["webhook-retry-cli", "migration-perf", "audit-log-export"],
		timestamp: "6s ago",
	},
	{
		id: "hook",
		name: "write_hook",
		body: "“Most retry libraries make you write 40 lines. We do it in one.” This hook leads with a developer pain everyone has felt.",
		timestamp: "3s ago",
	},
	{
		id: "script",
		name: "write_voiceover_script",
		body: "Drafting the 45-second script. Keeping it conversational, no marketing voice — three beats: pain, fix, payoff.",
		timestamp: "now",
	},
	{
		id: "visuals",
		name: "generate_scene_visuals",
		body: "Will compose 5–7 scenes from the script and brand visual tokens.",
		timestamp: "—",
	},
	{
		id: "voiceover",
		name: "synthesize_voiceover",
		body: "Will generate audio with your cloned voice profile.",
		timestamp: "—",
	},
	{
		id: "compose",
		name: "compose_final_video",
		body: "Will mix scenes, voiceover, and brand framing into the final MP4.",
		timestamp: "—",
	},
];

const SCRIPT_LINES = [
	"Most retry libraries make you write 40 lines.",
	"We do it in one. ship_with_retry, three flags, done.",
	"And in the new release we cut migration time by 6×—",
];
const FULL_SCRIPT = SCRIPT_LINES.join("\n");
const TOTAL_SCENES = 6;

// Map backend status → which decision card is currently in-progress.
// Earlier cards are forced to done, later cards to pending. Note: voicing in
// backend = scenes are rendering audio; we visualise that as "voiceover" card.
const ACTIVE_DECISION_BY_STATUS: Record<JobStatus, DecisionId> = {
	pending: "extract",
	extracting: "extract",
	researching: "market",
	scripting: "script",
	voicing: "voiceover",
	rendering: "compose",
	done: "compose",
	failed: "extract",
};

function decisionStateFor(id: DecisionId, status: JobStatus): DecisionState {
	const order: DecisionId[] = [
		"extract",
		"market",
		"select",
		"hook",
		"script",
		"visuals",
		"voiceover",
		"compose",
	];
	const idx = order.indexOf(id);
	const activeId = ACTIVE_DECISION_BY_STATUS[status];
	const activeIdx = order.indexOf(activeId);
	if (status === "done") return "done";
	if (status === "failed") return idx <= activeIdx ? "done" : "pending";
	if (idx < activeIdx) return "done";
	if (idx === activeIdx) return "in-progress";
	return "pending";
}

// Roughly map backend progress (0..100) to a smooth 0..62 header progress
// during rendering and 100 on done. Mirrors the design's "live" feel.
function headerProgressFor(status: JobStatus, progress: number): number {
	if (status === "done") return 100;
	if (status === "failed") return Math.min(progress, 38);
	if (status === "rendering") return 62 + Math.round((progress - 70) * 0.95);
	const pct = Math.min(progress, 60);
	return Math.max(8, pct);
}

// How many scenes are "rendered" — fake but follows render progress.
function renderedScenesFor(status: JobStatus, progress: number): number {
	if (status === "done") return TOTAL_SCENES;
	if (status !== "rendering") return 0;
	const renderPct = Math.max(0, Math.min(100, (progress - 70) / 30));
	return Math.min(TOTAL_SCENES, Math.floor(renderPct * TOTAL_SCENES));
}

export function ProgressStream({ jobId }: { jobId: string }) {
	const router = useRouter();
	const [job, setJob] = useState<JobEvent | null>(null);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [brand, setBrand] = useState<BrandProfile | null>(null);
	const sourceRef = useRef<EventSource | null>(null);
	const terminalRef = useRef(false);

	// Live counters (faked but tied to wall-clock).
	const [elapsed, setElapsed] = useState(0);
	const [tokens, setTokens] = useState(2400);
	const [cost, setCost] = useState(0.02);

	useEffect(() => {
		setBrand(loadBrandProfile());
	}, []);

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
			setTokens((t) => t + Math.floor(8 + Math.random() * 22));
			setCost((c) => Number((c + 0.0008 + Math.random() * 0.0006).toFixed(4)));
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const status: JobStatus = job?.status ?? "pending";
	const progress = job?.progress ?? 0;
	const failed = status === "failed";
	const repoLabel = job?.owner && job?.name ? `${job.owner}/${job.name}` : "—";

	const headerProgress = headerProgressFor(status, progress);
	const eta = Math.max(28, 90 - elapsed);
	const renderedScenes = renderedScenesFor(status, progress);

	const states = useMemo(
		() =>
			Object.fromEntries(
				DECISIONS.map((d) => [d.id, decisionStateFor(d.id, status)]),
			) as Record<DecisionId, DecisionState>,
		[status],
	);
	const doneCount = Object.values(states).filter((s) => s === "done").length;

	const scriptStreaming = states.script === "in-progress";
	const stream = useStreamingText(FULL_SCRIPT, {
		charDelay: 32,
		startDelay: 600,
		enabled: scriptStreaming,
	});

	const fmtCost = (n: number) => `$${n.toFixed(2)}`;
	const fmtTokens = (n: number) => n.toLocaleString();

	return (
		<>
			{/* Header */}
			<header className="grid h-14 grid-cols-[1fr_auto_1fr] items-center border-[var(--color-border)] border-b bg-[var(--color-bg)] px-6">
				<div className="flex items-center gap-2.5 text-[13px] text-[var(--color-text-muted)]">
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

				<div className="flex min-w-[360px] flex-col items-center gap-1.5">
					<div className="flex items-center gap-2.5 font-medium text-[14px] text-[var(--color-text)]">
						<span
							aria-hidden="true"
							className={
								failed
									? "block h-1.5 w-1.5 rounded-full bg-[var(--color-red)]"
									: "brand-pulse block h-1.5 w-1.5 rounded-full bg-[var(--color-magenta)]"
							}
						/>
						<span>{failed ? "Generation failed" : "Generating video"}</span>
					</div>
					<div
						className="progress-shimmer relative h-[2px] w-[320px] overflow-hidden rounded-[2px]"
						style={{ background: "rgba(255,255,255,0.06)" }}
					>
						<div
							className="h-full rounded-[2px] bg-[var(--color-magenta)] transition-[width] duration-[800ms] ease-out"
							style={{
								width: `${Math.max(0, Math.min(100, headerProgress))}%`,
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3">
					<span className="mono text-[12px] text-[var(--color-text-muted)]">
						~{eta}s remaining
					</span>
					<button
						type="button"
						onClick={() => router.push("/source" as Route)}
						className="cursor-pointer rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[13px] text-[var(--color-text-muted)] transition-[background-color,border-color,color] duration-[120ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-1)] hover:text-[var(--color-text)]"
					>
						Cancel
					</button>
				</div>
			</header>

			{/* Body */}
			<div className="grid flex-1 grid-cols-[860px_1fr]">
				{/* LEFT — Agent reasoning */}
				<section className="border-[var(--color-border)] border-r px-8 pt-7 pb-10">
					<h2 className="mb-5 flex items-center gap-2 font-medium text-[13px] text-[var(--color-text-muted)]">
						Agent reasoning
						<span className="mono inline-flex items-center rounded-[4px] border border-[var(--color-border)] px-1.5 py-[2px] text-[11px] text-[var(--color-text-dim)]">
							{doneCount}/{DECISIONS.length}
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
						{DECISIONS.map((d) => (
							<DecisionCard
								key={d.id}
								decision={d}
								state={states[d.id] ?? "pending"}
								streamingText={d.id === "script" ? stream.text : ""}
								streamDone={d.id === "script" ? stream.done : true}
							/>
						))}
					</div>
				</section>

				{/* RIGHT — preview + scene timeline */}
				<section className="px-8 pt-7 pb-10">
					<div>
						<h2 className="mb-5 font-medium text-[13px] text-[var(--color-text-muted)]">
							Live preview
						</h2>
						<div
							className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)]"
							style={{ background: "#0E0E10" }}
						>
							<div
								aria-hidden="true"
								className="pointer-events-none absolute inset-0"
								style={{
									background:
										"repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0 12px, transparent 12px 24px)",
								}}
							/>
							<div className="frame-shimmer" aria-hidden="true" />
							<div className="z-[1] flex flex-col items-center gap-2.5 text-[13px] text-[var(--color-text-muted)]">
								<div
									className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)]"
									style={{ background: "rgba(255,255,255,0.015)" }}
								>
									<FilmIcon />
								</div>
								<div>Preview will appear when scenes start rendering</div>
							</div>
						</div>
						<div className="mono mt-3 flex items-center gap-2 text-[11.5px] text-[var(--color-text-muted)]">
							<span>9:16 vertical</span>
							<span className="text-[var(--color-text-dim)]">·</span>
							<span>~{Math.max(28, 90 - elapsed)} seconds</span>
							<span className="text-[var(--color-text-dim)]">·</span>
							<span>with cloned voice</span>
						</div>

						{connectionError ? (
							<div
								role="alert"
								className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-elev-1)] p-3 text-[12px] text-[var(--color-text-muted)]"
							>
								{connectionError}
							</div>
						) : null}
					</div>

					<div className="mt-7">
						<div className="mb-2.5 flex items-center justify-between text-[12px] text-[var(--color-text-muted)]">
							<span>Scene timeline</span>
							<span className="mono text-[11px] text-[var(--color-text-dim)]">
								{renderedScenes}/{TOTAL_SCENES} rendered
							</span>
						</div>
						<div className="grid grid-cols-6 gap-2">
							{Array.from({ length: TOTAL_SCENES }).map((_, i) => {
								const isRendered = i < renderedScenes;
								const isNext = i === renderedScenes && status !== "done";
								return (
									<div
										key={`scene-${i}`}
										className="relative flex aspect-video items-end justify-center rounded-md pb-1.5"
										style={
											isRendered
												? {
														border: "1px solid rgba(229,38,124,0.35)",
														background: "rgba(229,38,124,0.04)",
													}
												: isNext
													? {
															border: "1px solid rgba(229,38,124,0.35)",
															background: "rgba(229,38,124,0.04)",
														}
													: {
															border: "1px dashed var(--color-border-strong)",
															background: "rgba(255,255,255,0.012)",
														}
										}
									>
										{isNext ? (
											<span
												aria-hidden="true"
												className="brand-pulse absolute top-1.5 right-1.5 block h-1.5 w-1.5 rounded-full bg-[var(--color-magenta)]"
											/>
										) : null}
										<span
											className={`mono text-[10.5px] ${
												isRendered || isNext
													? "text-[var(--color-text-muted)]"
													: "text-[var(--color-text-dim)]"
											}`}
										>
											Scene {i + 1}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</section>
			</div>

			{/* Footer */}
			<footer className="flex h-14 items-center justify-between border-[var(--color-border)] border-t bg-[var(--color-bg)] px-8">
				<div className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]">
					<span>Brand:</span>
					<span className="font-medium text-[var(--color-text)]">
						{brand?.name ?? "Demo Brand"}
					</span>
					<button
						type="button"
						aria-label="Edit brand"
						onClick={() => router.push("/brand-setup" as Route)}
						className="inline-flex cursor-pointer items-center rounded-[4px] border-none bg-transparent p-1 text-[var(--color-text-dim)] transition-[background-color,color] duration-[120ms] hover:bg-[var(--color-elev-1)] hover:text-[var(--color-text)]"
					>
						<PencilIcon />
					</button>
				</div>
				<div className="mono flex gap-[18px] text-[12px] text-[var(--color-text-muted)]">
					<span>
						Time elapsed:{" "}
						<strong className="font-medium text-[var(--color-text)]">
							{elapsed}s
						</strong>
					</span>
					<span>
						Tokens used:{" "}
						<strong className="font-medium text-[var(--color-text)]">
							{fmtTokens(tokens)}
						</strong>
					</span>
					<span>
						Cost:{" "}
						<strong className="font-medium text-[var(--color-text)]">
							{fmtCost(cost)}
						</strong>
					</span>
				</div>
			</footer>
		</>
	);
}

function DecisionCard({
	decision,
	state,
	streamingText,
	streamDone,
}: {
	decision: DecisionDef;
	state: DecisionState;
	streamingText: string;
	streamDone: boolean;
}) {
	const cardBase =
		"relative rounded-lg border border-[var(--color-border)] p-4 transition-[background-color,border-color,box-shadow] duration-[160ms]";
	const cardStyle: React.CSSProperties = {};
	let cardCls = `${cardBase} bg-[var(--color-elev-1)]`;
	if (state === "in-progress") {
		cardCls = `${cardBase} bg-[var(--color-elev-2)]`;
		cardStyle.borderLeft = "2px solid var(--color-magenta)";
		cardStyle.paddingLeft = "15px";
		cardStyle.boxShadow =
			"0 0 0 1px rgba(229,38,124,0.10), 0 18px 40px -24px rgba(229,38,124,0.35)";
	} else if (state === "done") {
		cardStyle.borderLeft = "2px solid var(--color-magenta)";
		cardStyle.paddingLeft = "15px";
	} else {
		cardCls = `${cardBase} bg-[var(--color-elev-1)] opacity-40`;
	}

	const showTimestamp = state !== "pending";
	const tsCls =
		decision.timestamp === "now"
			? "mono text-[11px] text-[var(--color-magenta)]"
			: "mono text-[11px] text-[var(--color-text-dim)]";

	return (
		<div className={cardCls} style={cardStyle}>
			<div className="mb-2 flex items-center gap-2.5">
				<DecisionStatusDot state={state} />
				<span className="mono flex-1 font-medium text-[13px] text-[var(--color-text)]">
					{decision.name}
				</span>
				{showTimestamp ? (
					<span className={tsCls}>{decision.timestamp}</span>
				) : null}
			</div>
			<p
				className="m-0 text-[14px] leading-[1.55]"
				style={{
					color: state === "pending" ? "var(--color-text-muted)" : "#C4C4CB",
				}}
			>
				{decision.body}
			</p>

			{decision.chips ? (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{decision.chips.map((c) => (
						<span
							key={`${decision.id}-chip-${c.k}-${c.v}`}
							className="mono inline-flex items-center gap-1 rounded-[4px] border border-[var(--color-border)] px-2 py-[3px] text-[11px] text-[var(--color-text-muted)] leading-[1.4]"
							style={{ background: "rgba(255,255,255,0.025)" }}
						>
							<strong className="font-medium text-[var(--color-text)]">
								{c.k}
							</strong>{" "}
							{c.v}
						</span>
					))}
				</div>
			) : null}

			{decision.features ? (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{decision.features.map((f) => (
						<span
							key={`${decision.id}-feat-${f}`}
							className="mono inline-flex items-center rounded-[4px] border border-[var(--color-border)] px-2 py-[3px] text-[11px] leading-[1.4]"
							style={{
								background: "rgba(255,255,255,0.025)",
								color: "#C4C4CB",
							}}
						>
							{f}
						</span>
					))}
				</div>
			) : null}

			{decision.id === "script" && state === "in-progress" ? (
				<div
					className="mono mt-3 min-h-[88px] whitespace-pre-wrap rounded-md border border-[var(--color-border)] px-3.5 py-3 text-[12.5px] leading-[1.7]"
					style={{ background: "rgba(0,0,0,0.35)", color: "#D4D4DC" }}
				>
					{streamingText}
					{!streamDone ? (
						<span
							className="ml-[1px] inline-block h-[14px] w-[1px] align-middle caret-blink"
							style={{
								background: "var(--color-magenta)",
								transform: "translateY(2px)",
							}}
						/>
					) : null}
				</div>
			) : null}
		</div>
	);
}

function DecisionStatusDot({ state }: { state: DecisionState }) {
	if (state === "done") {
		return (
			<span
				aria-hidden="true"
				className="block h-2 w-2 flex-none rounded-full"
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
				aria-hidden="true"
				className="brand-pulse block h-2 w-2 flex-none rounded-full bg-[var(--color-magenta)]"
			/>
		);
	}
	return (
		<span
			aria-hidden="true"
			className="block h-2 w-2 flex-none rounded-full border border-[var(--color-text-dim)] bg-transparent"
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

function PencilIcon() {
	return (
		<svg
			aria-hidden="true"
			width={12}
			height={12}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
		</svg>
	);
}

export default ProgressStream;
