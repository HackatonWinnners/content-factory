"use client";

import { useEffect, useState } from "react";

import { type BrandProfile, loadBrandProfile } from "@/lib/brand-profile";

import {
	ArrowRightIcon,
	ChevRightIcon,
	PencilIcon,
	PlayIcon,
} from "./source-icons";
import type { Format } from "./source-screen";

export function SourceRightPanel({
	format,
	onFormatChange,
	onGenerate,
	submitting,
	disabled,
	error,
}: {
	format: Format;
	onFormatChange: (f: Format) => void;
	onGenerate: () => void;
	submitting: boolean;
	disabled: boolean;
	error: string | null;
}) {
	const [brand, setBrand] = useState<BrandProfile | null>(null);
	useEffect(() => {
		setBrand(loadBrandProfile());
	}, []);

	const traits = describeTone(brand);

	return (
		<aside className="flex w-[320px] flex-col gap-3 border-[var(--color-border)] border-l p-4">
			{/* Brand */}
			<Card>
				<TitleRow title="Brand">
					<GhostIconButton ariaLabel="Edit brand">
						<PencilIcon size={12} />
					</GhostIconButton>
				</TitleRow>
				<div className="mt-1 font-semibold text-[14px] text-[var(--color-text)]">
					{brand?.name ?? "Demo Brand"}
				</div>
				<div className="mt-2 flex flex-wrap gap-1.5">
					{traits.map((t) => (
						<span
							key={t}
							className="rounded border border-[var(--color-border)] px-2 py-[2px] text-[11px] text-[var(--color-text)]"
							style={{ background: "rgba(255,255,255,0.03)" }}
						>
							{t}
						</span>
					))}
				</div>
				<div className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)]">
					<span
						aria-hidden="true"
						className="inline-flex h-3 w-3 items-center justify-center rounded-full"
						style={{ background: "var(--color-green)" }}
					>
						<svg
							aria-hidden="true"
							width={8}
							height={8}
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							strokeWidth={3}
						>
							<path d="M20 6L9 17l-5-5" />
						</svg>
					</span>
					Brand profile saved
				</div>
			</Card>

			{/* Format */}
			<Card>
				<TitleRow title="Format">
					<span className="mono inline-flex items-center rounded-[3px] border border-[var(--color-border)] px-1.5 py-[1px] text-[10px] text-[var(--color-text-dim)] uppercase tracking-[0.08em]">
						soon
					</span>
				</TitleRow>
				<div className="mt-2 flex flex-col gap-2 opacity-50">
					<FormatOption
						value="vertical"
						selected={format === "vertical"}
						onSelect={() => {}}
						label="Vertical · 9:16"
						sub="Always — every render is 1080×1920 today"
						disabled
					/>
					<FormatOption
						value="horizontal"
						selected={false}
						onSelect={() => {}}
						label="Horizontal · 16:9"
						sub="Coming soon"
						disabled
					/>
				</div>
			</Card>

			{/* Voice */}
			<Card>
				<TitleRow title="Voice" />
				<div className="mt-2 flex items-center gap-2">
					<MiniWave />
					<span className="flex-1 text-[13px] text-[var(--color-text)]">
						Your cloned voice
					</span>
					<button
						type="button"
						aria-label="Preview voice"
						className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] transition-[background-color,color] duration-[120ms] hover:bg-[var(--color-magenta)] hover:text-white"
					>
						<PlayIcon size={9} />
					</button>
				</div>
				<div className="mt-3 flex items-center justify-between text-[12px] text-[var(--color-text-muted)]">
					<span>4 voices available</span>
					<ChevRightIcon size={14} />
				</div>
			</Card>

			{/* CTA */}
			<div className="mt-3 flex flex-col gap-2 border-[var(--color-border)] border-t pt-4">
				<button
					type="button"
					onClick={onGenerate}
					disabled={disabled}
					className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border-none font-medium text-[14px] transition-[background-color,transform] duration-[120ms] active:translate-y-[1px] ${
						disabled
							? "cursor-not-allowed bg-[rgba(229,38,124,0.35)] text-white/70"
							: "cursor-pointer bg-[var(--color-magenta)] text-white hover:bg-[#ED2F86]"
					}`}
				>
					{submitting ? "Generating…" : "Generate video"}
					{!submitting ? <ArrowRightIcon size={14} /> : null}
				</button>
				{error ? (
					<div className="text-[12px] text-[var(--color-red)]">{error}</div>
				) : null}
				<div className="text-[11.5px] text-[var(--color-text-muted)]">
					Estimated 45–60s · ~$0.04 in tokens
				</div>
			</div>
		</aside>
	);
}

function Card({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="flex flex-col rounded-md border border-[var(--color-border)] p-3.5"
			style={{ background: "var(--color-elev-1)" }}
		>
			{children}
		</div>
	);
}

function TitleRow({
	title,
	children,
}: {
	title: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between">
			<span className="font-medium text-[13px] text-[var(--color-text)]">
				{title}
			</span>
			{children}
		</div>
	);
}

function GhostIconButton({
	children,
	ariaLabel,
}: {
	children: React.ReactNode;
	ariaLabel: string;
}) {
	return (
		<button
			type="button"
			aria-label={ariaLabel}
			className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-[4px] border-none bg-transparent text-[var(--color-text-dim)] transition-[background-color,color] duration-[120ms] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--color-text)]"
		>
			{children}
		</button>
	);
}

function FormatOption({
	value,
	selected,
	onSelect,
	label,
	sub,
	disabled,
}: {
	value: Format;
	selected: boolean;
	onSelect: (v: Format) => void;
	label: string;
	sub: string;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={() => !disabled && onSelect(value)}
			disabled={disabled}
			className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-[background-color,border-color] duration-[120ms] ${
				disabled
					? "cursor-not-allowed border-[var(--color-border)] bg-transparent"
					: selected
						? "cursor-pointer border-[rgba(229,38,124,0.45)] bg-[var(--color-magenta-bg)]"
						: "cursor-pointer border-[var(--color-border)] bg-transparent hover:border-[var(--color-border-strong)]"
			}`}
		>
			<FormatPreview kind={value} />
			<div className="min-w-0 flex-1">
				<div className="font-medium text-[13px] text-[var(--color-text)]">
					{label}
				</div>
				<div className="text-[11px] text-[var(--color-text-muted)]">{sub}</div>
			</div>
			<span
				aria-hidden="true"
				className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${selected ? "border-[var(--color-magenta)]" : "border-[var(--color-border-strong)]"}`}
			>
				{selected ? (
					<span
						className="block h-1.5 w-1.5 rounded-full"
						style={{ background: "var(--color-magenta)" }}
					/>
				) : null}
			</span>
		</button>
	);
}

function FormatPreview({ kind }: { kind: Format }) {
	if (kind === "vertical") {
		return (
			<span
				aria-hidden="true"
				className="block shrink-0 rounded-sm border border-[var(--color-border)]"
				style={{
					width: 14,
					height: 24,
					background: "var(--color-elev-2)",
				}}
			/>
		);
	}
	return (
		<span
			aria-hidden="true"
			className="block shrink-0 rounded-sm border border-[var(--color-border)]"
			style={{
				width: 28,
				height: 16,
				background: "var(--color-elev-2)",
			}}
		/>
	);
}

function MiniWave() {
	const bars = [3, 5, 7, 11, 8, 14, 10, 16, 12, 18, 14, 15, 11, 8, 12, 7];
	return (
		<svg
			width={64}
			height={22}
			viewBox="0 0 64 22"
			preserveAspectRatio="none"
			style={{ color: "var(--color-magenta)" }}
			aria-hidden="true"
		>
			{bars.map((h, i) => (
				<rect
					key={`${h}-${i}`}
					x={i * (64 / bars.length) + 0.5}
					y={(22 - h) / 2}
					width={64 / bars.length - 1}
					height={h}
					rx={0.5}
					fill="currentColor"
					opacity={0.45 + (h / 22) * 0.55}
				/>
			))}
		</svg>
	);
}

function describeTone(brand: BrandProfile | null): string[] {
	if (!brand) return ["Casual", "Direct", "Concise"];
	const t = brand.tone;
	const out: string[] = [];
	out.push(t.formalCasual >= 50 ? "Casual" : "Formal");
	out.push(t.seriousPlayful >= 50 ? "Playful" : "Serious");
	out.push(t.directStorytelling >= 50 ? "Story-driven" : "Direct");
	return out;
}
