"use client";

import { env } from "@content-factory/env/web";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";

import { type BrandProfile, loadBrandProfile } from "@/lib/brand-profile";

const githubUrlPattern =
	/^(?:https?:\/\/github\.com\/[^/]+\/[^/]+\/?|gh:[^/]+\/[^/]+)$/;

const githubRefSchema = z
	.string()
	.trim()
	.regex(
		githubUrlPattern,
		"Enter a public GitHub repo URL like https://github.com/owner/repo",
	);

type SourceKind = "github" | "linear" | "pdf";

type SourceCardProps = {
	kind: SourceKind;
	active: boolean;
	disabled: boolean;
	title: string;
	subtitle: string;
	icon: React.ReactNode;
	onClick: () => void;
};

function SourceCard({
	active,
	disabled,
	title,
	subtitle,
	icon,
	onClick,
}: SourceCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-disabled={disabled}
			data-active={active}
			className={`group relative flex h-[148px] flex-col items-start justify-between rounded-md border bg-[var(--color-elev-1)] p-4 text-left transition-[border-color,background-color,transform] duration-[120ms] ${
				disabled
					? "cursor-not-allowed border-[var(--color-border)] opacity-50"
					: "cursor-pointer border-[var(--color-border)] hover:border-[var(--color-magenta)] hover:bg-[var(--color-magenta-bg)] focus-visible:border-[var(--color-magenta)] focus-visible:outline-none"
			} ${
				active && !disabled
					? "border-[var(--color-magenta)] bg-[var(--color-magenta-bg)]"
					: ""
			}`}
		>
			<div className="flex w-full items-start justify-between">
				<span
					className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-elev-2)] ${
						active && !disabled
							? "text-[var(--color-magenta)]"
							: "text-[var(--color-text)]"
					}`}
				>
					{icon}
				</span>
				{disabled ? (
					<span className="mono inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-elev-2)] px-2 py-[3px] text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]">
						Coming soon
					</span>
				) : null}
			</div>
			<div className="flex flex-col gap-1">
				<span className="font-medium text-[14px] text-[var(--color-text)]">
					{title}
				</span>
				<span className="text-[12px] text-[var(--color-text-muted)] leading-[1.45]">
					{subtitle}
				</span>
			</div>
		</button>
	);
}

function GitHubIcon() {
	return (
		<svg
			aria-hidden="true"
			width={16}
			height={16}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
		</svg>
	);
}

function LinearIcon() {
	return (
		<svg
			aria-hidden="true"
			width={16}
			height={16}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M3 13a9 9 0 0 1 9 9" />
			<path d="M3 8.5A12.5 12.5 0 0 1 15.5 21" />
			<path d="M3 4a17 17 0 0 1 17 17" />
		</svg>
	);
}

function PdfIcon() {
	return (
		<svg
			aria-hidden="true"
			width={16}
			height={16}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<path d="M14 2v6h6" />
			<path d="M9 13h6M9 17h4" />
		</svg>
	);
}

function ArrowRightIcon() {
	return (
		<svg
			aria-hidden="true"
			width={14}
			height={14}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M5 12h14" />
			<path d="M13 5l7 7-7 7" />
		</svg>
	);
}

export function SourceForm() {
	const router = useRouter();
	const [kind, setKind] = useState<SourceKind>("github");
	const [ref, setRef] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [brand, setBrand] = useState<BrandProfile | null>(null);
	const [brandReady, setBrandReady] = useState(false);

	useEffect(() => {
		setBrand(loadBrandProfile());
		setBrandReady(true);
	}, []);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		if (!brandReady) return;
		if (!brand) {
			router.push("/brand-setup" as Route);
			return;
		}

		const parsed = githubRefSchema.safeParse(ref);
		if (!parsed.success) {
			const issue = parsed.error.issues[0];
			setError(issue?.message ?? "Invalid GitHub URL");
			return;
		}

		setSubmitting(true);
		try {
			const response = await fetch(
				`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs`,
				{
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ kind: "git", ref: parsed.data, brand }),
				},
			);
			if (!response.ok) {
				const text = await response.text().catch(() => "");
				throw new Error(text || `Server returned ${response.status}`);
			}
			const data = (await response.json()) as { jobId?: string };
			if (!data.jobId) {
				throw new Error("Server did not return a jobId");
			}
			router.push(`/thinking?jobId=${data.jobId}` as Route);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to start job";
			setError(message);
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
			<div className="grid grid-cols-3 gap-3">
				<SourceCard
					kind="github"
					active={kind === "github"}
					disabled={false}
					title="GitHub repo"
					subtitle="Public repos only. We read README, recent commits, and topics."
					icon={<GitHubIcon />}
					onClick={() => setKind("github")}
				/>
				<SourceCard
					kind="linear"
					active={false}
					disabled={true}
					title="Linear ticket"
					subtitle="Export shipped tickets into a recap video."
					icon={<LinearIcon />}
					onClick={() => {}}
				/>
				<SourceCard
					kind="pdf"
					active={false}
					disabled={true}
					title="PDF document"
					subtitle="Drop a release note PDF, get a video summary."
					icon={<PdfIcon />}
					onClick={() => {}}
				/>
			</div>

			<div className="flex flex-col gap-3">
				<label
					htmlFor="github-ref"
					className="mono font-medium text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]"
				>
					GitHub URL
				</label>
				<div
					className={`flex h-11 items-center rounded-md border bg-[var(--color-elev-1)] px-[14px] transition-[border-color] duration-[120ms] focus-within:border-[var(--color-border-strong)] ${
						error ? "border-[var(--color-red)]" : "border-[var(--color-border)]"
					}`}
				>
					<span className="text-[var(--color-text-muted)]">
						<GitHubIcon />
					</span>
					<input
						id="github-ref"
						name="ref"
						spellCheck={false}
						autoComplete="off"
						placeholder="https://github.com/owner/repo"
						value={ref}
						onChange={(e) => {
							setRef(e.target.value);
							if (error) setError(null);
						}}
						className="mono ml-3 flex-1 bg-transparent text-[13px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-dim)]"
					/>
				</div>
				{error ? (
					<div
						role="alert"
						className="text-[12px] text-[var(--color-red)] leading-[1.4]"
					>
						{error}
					</div>
				) : null}
			</div>

			<div className="flex items-center gap-4">
				<button
					type="submit"
					disabled={submitting || !brandReady}
					className="inline-flex h-11 w-[240px] items-center justify-center gap-2 rounded-md border border-[var(--color-magenta)] bg-[var(--color-magenta)] px-4 font-medium text-[14px] text-white transition-[background-color,transform,opacity] duration-[120ms] hover:bg-[#ED2F86] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--color-magenta)]"
				>
					{submitting ? "Starting…" : "Generate video"}
					{submitting ? null : <ArrowRightIcon />}
				</button>
				<span className="mono text-[11px] text-[var(--color-text-muted)]">
					Estimated 45–60s · Powered by Gemini + Gradium
				</span>
			</div>
		</form>
	);
}

export default SourceForm;
