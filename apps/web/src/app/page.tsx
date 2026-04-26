"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { defaultBrandProfile, saveBrandProfile } from "@/lib/brand-profile";

import { PlayerTile } from "./_components/player-tile";

const FEATURES = [
	{
		label: "BRAND-AWARE",
		h: "Sounds like you, not ChatGPT.",
		body: "Set up your voice once — tone, signature phrases, what to say and what to never say. Every video sounds like your team wrote it.",
	},
	{
		label: "FACT-LOCKED",
		h: "Every line cites a real change.",
		body: "Scripts are grounded in actual commits, README updates, and shipped features. No hallucinated benchmarks. No marketing-speak.",
	},
	{
		label: "RENDER-READY",
		h: "9:16 MP4 with embedded voice.",
		body: "Outputs a self-contained vertical MP4 with karaoke captions. Drag it straight into Twitter, Reels, or TikTok — no post-production.",
	},
] as const;

type HowRow = {
	name: string;
	result: string;
	time: string;
	state?: "live" | "pending";
};

const HOW_ROWS: HowRow[] = [
	{
		name: "extract_user_facing_changes",
		result: "GitHub REST → 6 user-facing from 47 commits",
		time: "8s",
	},
	{
		name: "fetch_market_context",
		result: "Tavily → 12 competitors searched, lead with speed",
		time: "6s",
	},
	{
		name: "write_voiceover_script",
		result: "Gemini 2.5 Pro → hook + 6 scenes + CTA",
		time: "11s",
		state: "live",
	},
	{
		name: "synthesize_voiceover",
		result: "Gradium → 47s of audio in your cloned voice",
		time: "9s",
		state: "pending",
	},
	{
		name: "compose_final_video",
		result: "Remotion 4 → 1080×1920 MP4 with embedded audio",
		time: "13s",
		state: "pending",
	},
];

const PARTNERS = [
	{ mark: "G", name: "Gemini 2.5 Pro" },
	{ mark: "Tv", name: "Tavily" },
	{ mark: "Gr", name: "Gradium" },
	{ mark: "Ai", name: "Aikido" },
	{ mark: "En", name: "Entire" },
] as const;

export default function Home() {
	const router = useRouter();

	function handleSkip() {
		saveBrandProfile(defaultBrandProfile());
		router.push("/source" as Route);
	}

	return (
		<div className="mx-auto min-h-[1024px] w-[1440px]">
			{/* Top header */}
			<header className="flex h-14 items-center justify-between border-[var(--color-border)] border-b px-6">
				<div className="font-medium text-[14px] text-[var(--color-text)] tracking-[-0.01em]">
					Content Factory<span className="text-[var(--color-magenta)]">.</span>
				</div>
				<div className="flex items-center gap-3.5">
					<button
						type="button"
						className="cursor-pointer rounded-[4px] border-none bg-transparent px-2 py-1.5 text-[13px] text-[var(--color-text-muted)] transition-colors duration-[120ms] hover:text-[var(--color-text)]"
					>
						How it works
					</button>
					<button
						type="button"
						className="cursor-pointer rounded-[4px] border-none bg-transparent px-2 py-1.5 text-[13px] text-[var(--color-text-muted)] transition-colors duration-[120ms] hover:text-[var(--color-text)]"
					>
						Pricing
					</button>
					<button
						type="button"
						className="cursor-pointer rounded-[4px] border-none bg-transparent px-2 py-1.5 text-[13px] text-[var(--color-text-muted)] transition-colors duration-[120ms] hover:text-[var(--color-text)]"
					>
						Sign in
					</button>
					<button
						type="button"
						className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-2.5 py-1.5 pl-3 text-[13px] text-[var(--color-text)] transition-[background-color,border-color] duration-[120ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-1)]"
					>
						<span
							className="mono inline-flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border border-[var(--color-border)] font-semibold text-[9px] text-[var(--color-text-muted)]"
							style={{ background: "linear-gradient(135deg,#2A2A30,#1B1B20)" }}
						>
							A
						</span>
						<span>Acme Co</span>
						<svg
							aria-hidden="true"
							width={12}
							height={12}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.5}
						>
							<path d="M6 9l6 6 6-6" />
						</svg>
					</button>
					<span
						className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] font-semibold text-[11px]"
						style={{
							background: "linear-gradient(135deg,#2E1F2A,#3A2533)",
							color: "#E5C7D6",
						}}
					>
						MP
					</span>
				</div>
			</header>

			{/* HERO */}
			<section className="relative grid items-center gap-16 px-20 pt-[72px] pb-14 [grid-template-columns:1fr_420px]">
				{/* Accent vertical line */}
				<span
					aria-hidden="true"
					className="absolute top-0 left-20 h-14 w-[2px]"
					style={{
						background:
							"linear-gradient(180deg, var(--color-magenta), transparent)",
					}}
				/>

				<div>
					<div className="mono inline-flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.12em]">
						<span
							aria-hidden="true"
							className="brand-pulse block h-1.5 w-1.5 rounded-full bg-[var(--color-magenta)]"
						/>
						<span>Live agent · ~90s end-to-end</span>
					</div>

					<h1
						className="m-0 mt-4 mb-4 max-w-[720px] font-semibold text-[64px] text-[var(--color-text)] leading-[1.04]"
						style={{ letterSpacing: "-0.025em" }}
					>
						Ship a launch video <br />
						<span className="text-[var(--color-magenta)]">
							before your coffee cools.
						</span>
					</h1>

					<p className="m-0 mb-8 max-w-[600px] text-[17px] text-[var(--color-text-muted)] leading-[1.55]">
						Drop a GitHub repo, Linear ticket, or PDF. We extract{" "}
						<span className="text-[var(--color-text)]">
							what's actually user-facing
						</span>
						, write the hook, voice it in your brand, and render the MP4 — in
						about 90 seconds.
					</p>

					<div className="mb-7 flex items-center gap-3">
						<Link
							href="/brand-setup"
							className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--color-magenta)] bg-[var(--color-magenta)] px-[18px] font-medium text-[14px] text-white transition-[background-color,transform] duration-[120ms] hover:bg-[#ED2F86] active:translate-y-[1px]"
							style={{
								boxShadow: "0 12px 32px -16px rgba(229,38,124,0.6)",
							}}
						>
							Set up your brand
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
								<path d="M5 12h14M13 5l7 7-7 7" />
							</svg>
						</Link>
						<button
							type="button"
							onClick={handleSkip}
							className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-[18px] font-medium text-[14px] text-[var(--color-text)] transition-[background-color,border-color] duration-[120ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-1)] active:translate-y-[1px]"
						>
							Skip — use defaults
						</button>
					</div>

					<div className="mt-2 flex flex-wrap items-center gap-2">
						<span className="mono mr-1 text-[10.5px] text-[var(--color-text-dim)] uppercase tracking-[0.12em]">
							Agent pipeline
						</span>
						<PipePill label="extract" />
						<PipeArrow />
						<PipePill label="research" />
						<PipeArrow />
						<PipePill label="script" active />
						<PipeArrow />
						<PipePill label="voice" />
						<PipeArrow />
						<PipePill label="render" />
					</div>
				</div>

				<div className="relative flex justify-center">
					<PlayerTile />
				</div>
			</section>

			{/* FEATURES */}
			<section className="grid grid-cols-3 border-[var(--color-border)] border-t px-20 py-14">
				{FEATURES.map((f, i) => (
					<div
						key={f.label}
						className={`px-8 ${i === 0 ? "pl-0" : ""} ${i === FEATURES.length - 1 ? "border-none pr-0" : "border-[var(--color-border)] border-r"}`}
					>
						<div className="mono mb-3.5 font-semibold text-[11px] text-[var(--color-magenta)] tracking-[0.10em]">
							{f.label}
						</div>
						<h3 className="m-0 mb-2 font-medium text-[18px] text-[var(--color-text)] tracking-[-0.005em]">
							{f.h}
						</h3>
						<p className="m-0 text-[14px] text-[var(--color-text-muted)] leading-[1.55]">
							{f.body}
						</p>
					</div>
				))}
			</section>

			{/* HOW IT WORKS */}
			<section className="grid gap-12 border-[var(--color-border)] border-t px-20 pt-16 pb-[72px] [grid-template-columns:380px_1fr]">
				<div>
					<span className="mono mb-4.5 inline-block text-[10.5px] text-[var(--color-text-muted)] uppercase tracking-[0.12em]">
						{"// Under the hood"}
					</span>
					<h2 className="m-0 mb-4 font-semibold text-[28px] text-[var(--color-text)] leading-[1.15] tracking-[-0.015em]">
						The agent shows its work.
					</h2>
					<p className="m-0 text-[14px] text-[var(--color-text-muted)] leading-[1.6]">
						No black box. Watch each decision the agent makes — what it
						extracted, what it researched, what it chose to lead with, and why.
						Every step is inspectable, every output traceable to a source.
					</p>
				</div>
				<div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-elev-1)]">
					{HOW_ROWS.map((r, i) => (
						<HowRowItem
							key={r.name}
							row={r}
							isLast={i === HOW_ROWS.length - 1}
						/>
					))}
				</div>
			</section>

			{/* POWERED BY */}
			<section className="flex items-center gap-6 border-[var(--color-border)] border-t px-20 pt-10 pb-8">
				<div className="mono shrink-0 text-[10.5px] text-[var(--color-text-dim)] uppercase tracking-[0.14em]">
					Powered by
				</div>
				<div className="flex flex-1 items-center gap-6">
					{PARTNERS.map((p) => (
						<span
							key={p.name}
							className="inline-flex cursor-default items-center gap-2 font-medium text-[13px] text-[var(--color-text-muted)] transition-colors duration-[120ms] hover:text-[var(--color-text)]"
						>
							<span className="mono inline-flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-[var(--color-border)] bg-[var(--color-elev-1)] font-semibold text-[10px] text-[var(--color-text)]">
								{p.mark}
							</span>
							<span>{p.name}</span>
						</span>
					))}
				</div>
			</section>

			{/* FOOTER */}
			<footer className="mono flex items-center justify-between border-[var(--color-border)] border-t px-20 pt-6 pb-10 text-[11px] text-[var(--color-text-dim)]">
				<span>© 2026 Content Factory</span>
				<div className="flex gap-[18px]">
					<a
						href="https://github.com/HackatonWinnners/content-factory"
						className="text-[var(--color-text-dim)] no-underline transition-colors duration-[120ms] hover:text-[var(--color-text)]"
					>
						GitHub
					</a>
					<a
						href="https://github.com/HackatonWinnners/content-factory"
						className="text-[var(--color-text-dim)] no-underline transition-colors duration-[120ms] hover:text-[var(--color-text)]"
					>
						Docs
					</a>
					<a
						href="https://github.com/HackatonWinnners/content-factory"
						className="text-[var(--color-text-dim)] no-underline transition-colors duration-[120ms] hover:text-[var(--color-text)]"
					>
						Changelog
					</a>
				</div>
			</footer>
		</div>
	);
}

function PipePill({ label, active }: { label: string; active?: boolean }) {
	return (
		<span
			className={
				active
					? "mono rounded-[4px] border border-[rgba(229,38,124,0.45)] px-2.5 py-1 text-[11px] text-[var(--color-magenta)]"
					: "mono rounded-[4px] border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors duration-[120ms]"
			}
			style={
				active
					? { background: "rgba(229,38,124,0.08)" }
					: { background: "rgba(255,255,255,0.025)" }
			}
		>
			{label}
		</span>
	);
}

function PipeArrow() {
	return (
		<span
			aria-hidden="true"
			className="text-[11px] text-[var(--color-text-dim)]"
		>
			→
		</span>
	);
}

function HowRowItem({ row, isLast }: { row: HowRow; isLast: boolean }) {
	return (
		<div
			className={`grid items-center gap-4 px-[18px] py-3.5 [grid-template-columns:28px_220px_1fr_auto] ${isLast ? "" : "border-[rgba(255,255,255,0.06)] border-b"}`}
		>
			<HowStatus state={row.state} />
			<span className="mono font-medium text-[12.5px] text-[var(--color-text)]">
				{row.name}
			</span>
			<span className="text-[12.5px] text-[var(--color-text-muted)] leading-[1.45]">
				{row.result}
			</span>
			<span className="mono text-[11px] text-[var(--color-text-dim)]">
				{row.time}
			</span>
		</div>
	);
}

function HowStatus({ state }: { state?: "live" | "pending" }) {
	if (state === "pending") {
		return (
			<span
				aria-hidden="true"
				className="ml-1 block h-2 w-2 rounded-full border border-[var(--color-text-dim)] bg-transparent"
			/>
		);
	}
	if (state === "live") {
		return (
			<span
				aria-hidden="true"
				className="brand-pulse ml-1 block h-2 w-2 rounded-full bg-[var(--color-magenta)]"
			/>
		);
	}
	return (
		<span
			aria-hidden="true"
			className="ml-1 block h-2 w-2 rounded-full bg-[var(--color-green)]"
			style={{ boxShadow: "0 0 0 3px rgba(45,106,79,0.18)" }}
		/>
	);
}
