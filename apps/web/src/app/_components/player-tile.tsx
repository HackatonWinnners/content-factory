"use client";

import { useEffect, useRef, useState } from "react";

type CaptionWord = { t: number; w: string };

const CAPTION_WORDS: CaptionWord[] = [
	{ t: 0.4, w: "Most" },
	{ t: 0.7, w: "retry" },
	{ t: 1.05, w: "libraries" },
	{ t: 1.5, w: "make" },
	{ t: 1.7, w: "you" },
	{ t: 1.95, w: "write" },
	{ t: 2.25, w: "40" },
	{ t: 2.55, w: "lines." },
	{ t: 3.1, w: "We" },
	{ t: 3.3, w: "do" },
	{ t: 3.5, w: "it" },
	{ t: 3.7, w: "in" },
	{ t: 4.0, w: "one." },
];
const LOOP = 8.5;

function fmt(sec: number): string {
	const s = Math.floor(sec % 60)
		.toString()
		.padStart(2, "0");
	return `0:${s}`;
}

export function PlayerTile() {
	const [playing, setPlaying] = useState(false);
	const [t, setT] = useState(0);
	const rafRef = useRef<number | null>(null);
	const startRef = useRef<number | null>(null);

	useEffect(() => {
		if (!playing) return;
		startRef.current = performance.now() - t * 1000;
		const tick = (now: number) => {
			const elapsed = (now - (startRef.current ?? now)) / 1000;
			setT(elapsed % LOOP);
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		};
		// Only restart when toggling play; t is owned by the loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [playing]);

	let litIndex = -1;
	for (let k = 0; k < CAPTION_WORDS.length; k++) {
		const word = CAPTION_WORDS[k];
		if (word && word.t <= t) litIndex = k;
	}

	const visibleWords = CAPTION_WORDS.slice(0, Math.max(litIndex + 1, 1));

	return (
		<div className="relative w-[280px]">
			{/* Glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -inset-12 z-0 rounded-[32px]"
				style={{
					background:
						"radial-gradient(circle at 50% 100%, rgba(229,38,124,0.18), transparent 55%), radial-gradient(circle at 0% 0%, rgba(229,38,124,0.10), transparent 50%)",
					filter: "blur(2px)",
				}}
			/>

			{/* Frame */}
			<div
				className="relative z-[1] h-[498px] w-[280px] overflow-hidden rounded-[14px]"
				style={{
					background: "#08080A",
					border: "1px solid rgba(255,255,255,0.12)",
				}}
			>
				{/* First-frame backdrop */}
				<div
					className="absolute inset-0"
					style={{
						background:
							"radial-gradient(circle at 50% 25%, rgba(229,38,124,0.10), transparent 55%), #08080A",
					}}
				/>

				{/* Top meta */}
				<div className="absolute top-4 right-4 left-4 flex items-center justify-between">
					<span
						className="mono inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-[3px] text-[10px] text-[var(--color-text-muted)]"
						style={{
							background: "rgba(0,0,0,0.4)",
							borderColor: "rgba(255,255,255,0.08)",
							backdropFilter: "blur(4px)",
						}}
					>
						<span
							aria-hidden="true"
							className="block h-[5px] w-[5px] rounded-full bg-[var(--color-magenta)]"
						/>
						Generated
					</span>
					<span className="mono text-[10px] text-[var(--color-text-muted)]">
						9:16 · 0:47
					</span>
				</div>

				{/* First-frame hook (visible until played) */}
				{!playing ? (
					<div className="absolute inset-0 flex flex-col justify-center px-6 py-9 text-left">
						<div
							className="font-bold text-[36px] text-[var(--color-magenta)] leading-[1.05]"
							style={{ letterSpacing: "-0.02em" }}
						>
							Most retry libraries
						</div>
						<div
							className="mt-2 font-normal text-[26px] leading-[1.1]"
							style={{ color: "#DADAE0", letterSpacing: "-0.01em" }}
						>
							make you write 40 lines.
						</div>
					</div>
				) : null}

				{/* Karaoke captions while playing */}
				{playing ? (
					<div className="absolute right-4 bottom-14 left-4 flex flex-wrap justify-center gap-1 font-semibold text-[14px] leading-[1.3]">
						{visibleWords.map((w, i) => (
							<span
								key={`${w.w}-${i}`}
								className={
									i === litIndex
										? "rounded-[3px] bg-[var(--color-magenta)] px-1.5 py-[1px] text-white"
										: "text-white/45"
								}
							>
								{w.w}
							</span>
						))}
					</div>
				) : null}

				{/* Scrub */}
				<div className="absolute right-4 bottom-6 left-4 flex h-[14px] flex-col gap-1.5">
					<div className="relative h-[3px] rounded-[3px] bg-white/[0.14]">
						<div
							className="absolute top-0 bottom-0 left-0 rounded-[3px] bg-[var(--color-magenta)] transition-[width] duration-[100ms] ease-linear"
							style={{ width: `${(t / LOOP) * 100}%` }}
						/>
					</div>
					<div className="mono flex justify-between text-[9.5px] text-white/55">
						<span>{fmt(t)}</span>
						<span>0:47</span>
					</div>
				</div>

				{/* Big play */}
				{!playing ? (
					<button
						type="button"
						aria-label="Play"
						onClick={() => setPlaying(true)}
						className="absolute top-1/2 left-1/2 z-[2] inline-flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--color-magenta)] text-white transition-[background-color,transform] duration-[120ms] hover:scale-105 hover:bg-[#ED2F86]"
						style={{
							boxShadow:
								"0 12px 28px -10px rgba(229,38,124,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset",
						}}
					>
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							width={22}
							height={22}
							style={{ transform: "translateX(2px)" }}
						>
							<polygon points="7 5 20 12 7 19 7 5" fill="currentColor" />
						</svg>
					</button>
				) : null}
			</div>

			<div className="mono mt-4 text-center text-[11px] text-[var(--color-text-muted)] leading-[1.5]">
				<div className="inline-flex items-center gap-1.5 text-[var(--color-text)]">
					<svg
						aria-hidden="true"
						width={12}
						height={12}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
					>
						<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
					</svg>
					acme/webhook-retry
				</div>
				<div className="mt-1">generated in 47s · 4,892 tokens</div>
			</div>
		</div>
	);
}
