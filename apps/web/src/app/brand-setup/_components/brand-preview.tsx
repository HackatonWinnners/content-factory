"use client";

import type { BrandProfile } from "@/lib/brand-profile";

type Props = {
	profile: BrandProfile;
};

function toneWord(value: number, low: string, mid: string, high: string) {
	if (value <= 33) return low;
	if (value >= 67) return high;
	return mid;
}

function deriveToneWords(tone: BrandProfile["tone"]) {
	return [
		toneWord(tone.formalCasual, "formal", "balanced", "casual"),
		toneWord(tone.seriousPlayful, "serious", "slightly playful", "playful"),
		toneWord(tone.directStorytelling, "direct", "narrative", "storytelling"),
	];
}

const DEFAULT_DOS = [
	"show real numbers",
	"write like talking to a friend who codes",
];
const DEFAULT_DONTS = ["use marketing language", "claim breakthroughs"];

export function BrandPreview({ profile }: Props) {
	const toneWords = deriveToneWords(profile.tone);
	const dos = profile.rules?.dos ?? DEFAULT_DOS;
	const donts = profile.rules?.donts ?? DEFAULT_DONTS;
	const traits = (() => {
		if (profile.examples && profile.examples.length > 0) {
			return profile.examples;
		}
		const inferred: string[] = [];
		if (/technical|engineer|code/i.test(profile.voice))
			inferred.push("technical");
		if (/skeptic|hype/i.test(profile.voice)) inferred.push("skeptical of hype");
		if (/humor|sarcas|fun/i.test(profile.voice))
			inferred.push("engineer humor");
		if (inferred.length === 0) inferred.push(...toneWords);
		return inferred;
	})();

	return (
		<aside className="sticky top-6 self-start">
			<div className="flex flex-col rounded-md border border-[var(--color-border)] bg-[var(--color-elev-1)] p-6">
				<div className="mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]">
					Compiled brand profile
				</div>
				<div className="mono mt-1 inline-flex items-center gap-[6px] text-[11px] text-[var(--color-text-muted)]">
					<span
						className="inline-block h-[6px] w-[6px] rounded-full"
						style={{
							background: "var(--color-green)",
							boxShadow: "0 0 0 3px rgba(45,106,79,0.18)",
						}}
					/>
					<span>Live preview</span>
				</div>

				<div className="mt-5 flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<div className="mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
							name
						</div>
						<div className="text-[13px] text-[var(--color-text)] leading-[1.5]">
							{profile.name || "—"}
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<div className="mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
							tone
						</div>
						<div className="text-[13px] text-[var(--color-text)] leading-[1.5]">
							{toneWords.join(", ")}
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<div className="mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
							voice_traits
						</div>
						<div className="mt-[2px] flex flex-wrap gap-[6px]">
							{traits.map((trait) => (
								<span
									key={trait}
									className="rounded border border-[var(--color-border)] bg-white/[0.03] px-2 py-[3px] text-[11.5px] text-[var(--color-text)]"
								>
									{trait}
								</span>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<div className="mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
							writing_rules
						</div>
						<div className="mt-1 flex flex-col gap-[6px]">
							{dos.map((rule) => (
								<div
									key={`do-${rule}`}
									className="grid grid-cols-[36px_1fr] items-baseline text-[13px] text-[var(--color-text)] leading-[1.45]"
								>
									<span
										className="mono font-semibold text-[10.5px] tracking-[0.06em]"
										style={{ color: "#6FBF95" }}
									>
										DO
									</span>
									<span>{rule}</span>
								</div>
							))}
							{donts.map((rule) => (
								<div
									key={`dont-${rule}`}
									className="grid grid-cols-[36px_1fr] items-baseline text-[13px] text-[var(--color-text)] leading-[1.45]"
								>
									<span
										className="mono font-semibold text-[10.5px] tracking-[0.06em]"
										style={{ color: "#C97C7C" }}
									>
										DON'T
									</span>
									<span>{rule}</span>
								</div>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<div className="mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
							voice_description
						</div>
						<div className="text-[12px] text-[var(--color-text-muted)] leading-[1.5]">
							{profile.voice
								? profile.voice.slice(0, 220) +
									(profile.voice.length > 220 ? "…" : "")
								: "—"}
						</div>
					</div>
				</div>

				<div
					className="mono mt-5 inline-flex items-center gap-2 border-t pt-[14px] text-[11px] text-[var(--color-text-muted)]"
					style={{ borderColor: "rgba(255,255,255,0.06)" }}
				>
					<span className="brand-pulse inline-block h-[6px] w-[6px] rounded-full bg-[var(--color-magenta)]" />
					<span>Synced</span>
				</div>
			</div>
		</aside>
	);
}

export default BrandPreview;
