"use client";

import { env } from "@content-factory/env/web";
import { useState } from "react";

function SparkleIcon() {
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
			<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
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

function Spinner() {
	return (
		<svg
			aria-hidden="true"
			width={14}
			height={14}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			className="animate-spin"
		>
			<path d="M21 12a9 9 0 1 1-6.22-8.56" />
		</svg>
	);
}

export function VoiceoverButton({
	jobId,
	disabled,
}: {
	jobId: string;
	disabled?: boolean;
}) {
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function generate() {
		setError(null);
		setPending(true);
		try {
			const response = await fetch(
				`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs/${jobId}/voiceover`,
				{ method: "POST" },
			);
			if (!response.ok) {
				const text = await response.text().catch(() => "");
				throw new Error(text || `Server returned ${response.status}`);
			}
			const data = (await response.json()) as { audioUrl?: string };
			if (!data.audioUrl) {
				throw new Error("Server did not return audioUrl");
			}
			setAudioUrl(`${env.NEXT_PUBLIC_SERVER_URL}${data.audioUrl}`);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Voiceover failed");
		} finally {
			setPending(false);
		}
	}

	if (audioUrl) {
		return (
			<div className="flex flex-col gap-3">
				<div className="mono text-[11px] text-[var(--color-magenta)] uppercase tracking-[0.08em]">
					Powered by Gradium
				</div>
				{/* biome-ignore lint/a11y/useMediaCaption: hackathon demo, no captions */}
				<audio
					data-testid="result-audio"
					controls
					autoPlay
					src={audioUrl}
					className="w-full"
				/>
				<div className="flex items-center gap-3">
					<a
						href={audioUrl}
						download={`cf-${jobId}-voiceover.mp3`}
						className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-3 font-medium text-[12px] text-[var(--color-text)] transition-[background-color,border-color] duration-[120ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-1)]"
					>
						<DownloadIcon />
						Download voiceover
					</a>
					<button
						type="button"
						onClick={() => {
							setAudioUrl(null);
							void generate();
						}}
						disabled={pending}
						className="inline-flex h-9 items-center gap-2 rounded-md bg-transparent px-3 font-medium text-[12px] text-[var(--color-text-muted)] transition-[color] duration-[120ms] hover:text-[var(--color-text)] disabled:opacity-60"
					>
						Regenerate
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				onClick={generate}
				disabled={disabled || pending}
				className="inline-flex h-11 w-fit min-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--color-magenta)] bg-[var(--color-magenta)] px-5 font-medium text-[14px] text-white transition-[background-color,opacity,transform] duration-[120ms] hover:bg-[#ED2F86] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--color-magenta)]"
			>
				{pending ? <Spinner /> : <SparkleIcon />}
				{pending ? "Synthesizing with Gradium…" : "Generate voiceover"}
			</button>
			{error ? (
				<div
					role="alert"
					className="text-[12px] text-[var(--color-red)] leading-[1.4]"
				>
					Voiceover failed — {error}.{" "}
					<button
						type="button"
						onClick={generate}
						className="underline transition-colors hover:text-[var(--color-text)]"
					>
						Retry
					</button>
				</div>
			) : (
				<div className="mono text-[11px] text-[var(--color-text-muted)]">
					Powered by Gradium
				</div>
			)}
		</div>
	);
}

export default VoiceoverButton;
