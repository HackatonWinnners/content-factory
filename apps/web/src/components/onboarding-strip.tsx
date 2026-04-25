"use client";

type Props = {
	step: string;
	label: string;
	onSkip?: () => void;
	skipLabel?: string;
};

export function OnboardingStrip({
	step,
	label,
	onSkip,
	skipLabel = "Skip for now",
}: Props) {
	return (
		<div
			className="mono flex h-8 items-center justify-between border-[var(--color-border)] border-b px-6 text-[12px] text-[var(--color-text-muted)]"
			style={{ background: "#0E0E11" }}
		>
			<span>
				<span className="font-medium text-[var(--color-text)]">{step}</span>
				<span> · {label}</span>
			</span>
			{onSkip ? (
				<button
					type="button"
					onClick={onSkip}
					className="cursor-pointer rounded px-[6px] py-1 text-[12px] text-[var(--color-text-muted)] transition-[color,background-color] duration-[120ms] hover:bg-[var(--color-elev-1)] hover:text-[var(--color-text)]"
				>
					{skipLabel}
				</button>
			) : null}
		</div>
	);
}

export default OnboardingStrip;
