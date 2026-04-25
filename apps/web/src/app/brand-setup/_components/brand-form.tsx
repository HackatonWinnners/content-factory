"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import { type BrandProfile, saveBrandProfile } from "@/lib/brand-profile";

type ToneKey = keyof BrandProfile["tone"];

type Props = {
	profile: BrandProfile;
	onChange: (next: BrandProfile) => void;
};

type SliderRowProps = {
	leftLabel: string;
	rightLabel: string;
	value: number;
	onChange: (value: number) => void;
	id: string;
};

function SliderRow({
	leftLabel,
	rightLabel,
	value,
	onChange,
	id,
}: SliderRowProps) {
	const activeRight = value >= 50;
	return (
		<div className="grid grid-cols-[90px_1fr_90px] items-center gap-4">
			<div
				className={`text-right text-[12px] ${
					activeRight
						? "text-[var(--color-text-muted)]"
						: "text-[var(--color-text)]"
				}`}
			>
				{leftLabel}
			</div>
			<div className="relative h-[6px] rounded-[3px] bg-white/[0.08]">
				<div
					className="absolute top-0 bottom-0 left-0 rounded-[3px]"
					style={{
						width: `${value}%`,
						background: "rgba(229,38,124,0.30)",
					}}
				/>
				<div
					className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
					style={{
						left: `${value}%`,
						background: "var(--color-magenta)",
						boxShadow:
							"0 0 0 4px rgba(229,38,124,0.18), 0 2px 6px rgba(0,0,0,0.35)",
					}}
				/>
				<input
					id={id}
					type="range"
					min={0}
					max={100}
					value={value}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onChange(Number(e.target.value))
					}
					aria-label={`${leftLabel} to ${rightLabel}`}
					className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
				/>
			</div>
			<div
				className={`text-left text-[12px] ${
					activeRight
						? "text-[var(--color-text)]"
						: "text-[var(--color-text-muted)]"
				}`}
			>
				{rightLabel}
			</div>
		</div>
	);
}

export function BrandForm({ profile, onChange }: Props) {
	const router = useRouter();

	function setName(name: string) {
		onChange({ ...profile, name });
	}

	function setVoice(voice: string) {
		onChange({ ...profile, voice });
	}

	function setTone(key: ToneKey, value: number) {
		onChange({ ...profile, tone: { ...profile.tone, [key]: value } });
	}

	function handleSave() {
		saveBrandProfile(profile);
		router.push("/source" as Route);
	}

	function handleSkip() {
		router.push("/source" as Route);
	}

	return (
		<div>
			<h1 className="m-0 mb-[6px] font-semibold text-[24px] text-[var(--color-text)] tracking-[-0.012em]">
				Define your brand
			</h1>
			<p className="m-0 text-[14px] text-[var(--color-text-muted)]">
				We'll use this every time we generate. You can edit it later.
			</p>

			<div className="mt-10 flex flex-col gap-8">
				<div>
					<label
						htmlFor="brand-name"
						className="mono mb-[10px] block font-medium text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]"
					>
						Brand name
					</label>
					<input
						id="brand-name"
						className="h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-elev-1)] px-[14px] text-[14px] text-[var(--color-text)] outline-none transition-[border-color,background-color] duration-[120ms] focus:border-[var(--color-border-strong)] focus:bg-[var(--color-elev-2)]"
						value={profile.name}
						onChange={(e) => setName(e.target.value)}
						spellCheck={false}
					/>
					<div className="mt-2 text-[11px] text-[var(--color-text-dim)]">
						This is how we'll refer to your brand internally.
					</div>
				</div>

				<div>
					<label
						htmlFor="brand-voice"
						className="mono mb-[10px] block font-medium text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]"
					>
						Voice description
					</label>
					<textarea
						id="brand-voice"
						rows={5}
						className="min-h-[140px] w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-elev-1)] px-[14px] py-3 text-[14px] text-[var(--color-text)] leading-[1.55] outline-none transition-[border-color,background-color] duration-[120ms] focus:border-[var(--color-border-strong)] focus:bg-[var(--color-elev-2)]"
						value={profile.voice}
						onChange={(e) => setVoice(e.target.value)}
					/>
					<div className="mt-2 text-[11px] text-[var(--color-text-dim)]">
						The more specific, the better. We'll learn from your tone.
					</div>
				</div>

				<div>
					<div className="mono mb-[10px] block font-medium text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]">
						Tone
					</div>
					<div className="mt-[-2px] mb-3 text-[12px] text-[var(--color-text-muted)]">
						Three knobs that shape how we write.
					</div>
					<div className="mt-1 flex flex-col gap-6">
						<SliderRow
							id="tone-formal-casual"
							leftLabel="Formal"
							rightLabel="Casual"
							value={profile.tone.formalCasual}
							onChange={(v) => setTone("formalCasual", v)}
						/>
						<SliderRow
							id="tone-serious-playful"
							leftLabel="Serious"
							rightLabel="Playful"
							value={profile.tone.seriousPlayful}
							onChange={(v) => setTone("seriousPlayful", v)}
						/>
						<SliderRow
							id="tone-direct-storytelling"
							leftLabel="Direct"
							rightLabel="Storytelling"
							value={profile.tone.directStorytelling}
							onChange={(v) => setTone("directStorytelling", v)}
						/>
					</div>
				</div>
			</div>

			<div className="mt-10 flex items-center gap-4">
				<button
					type="button"
					onClick={handleSave}
					className="inline-flex h-11 w-[240px] items-center justify-center gap-2 rounded-md border border-[var(--color-magenta)] bg-[var(--color-magenta)] px-4 font-medium text-[14px] text-white transition-[background-color,transform] duration-[120ms] hover:bg-[#ED2F86] active:translate-y-[1px]"
				>
					Save brand profile
				</button>
				<button
					type="button"
					onClick={handleSkip}
					className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-[18px] font-medium text-[14px] text-[var(--color-text)] transition-[background-color,border-color,transform] duration-[120ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-1)] active:translate-y-[1px]"
				>
					Skip for now
				</button>
			</div>
		</div>
	);
}

export default BrandForm;
