"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import { ScreenShell } from "@/components/screen-shell";
import { defaultBrandProfile, saveBrandProfile } from "@/lib/brand-profile";

export default function Home() {
	const router = useRouter();

	function handleSkip() {
		saveBrandProfile(defaultBrandProfile());
		router.push("/source" as Route);
	}

	return (
		<ScreenShell>
			<main className="flex flex-1 items-center justify-center px-20 py-20">
				<div className="flex w-[640px] flex-col items-center gap-10 rounded-md border border-[var(--color-border)] bg-[var(--color-elev-1)] px-16 py-16 text-center">
					<div className="flex flex-col gap-4">
						<h1 className="font-medium text-[40px] text-[var(--color-text)] leading-[1.1] tracking-[-0.02em]">
							Turn anything into video
						</h1>
						<p className="text-[15px] text-[var(--color-text-muted)] leading-[1.55]">
							Drop a GitHub repo, Linear ticket, or PDF — get a 30-60s on-brand
							vertical video back.
						</p>
					</div>
					<div className="flex flex-col items-center gap-3">
						<a
							href="/brand-setup"
							className="inline-flex h-11 w-[240px] items-center justify-center gap-2 rounded-md border border-[var(--color-magenta)] bg-[var(--color-magenta)] font-medium text-[14px] text-white transition-[background-color,transform] duration-[120ms] hover:bg-[#ED2F86] active:translate-y-[1px]"
						>
							Set up your brand
						</a>
						<button
							type="button"
							onClick={handleSkip}
							className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-[18px] font-medium text-[13px] text-[var(--color-text-muted)] transition-[background-color,border-color,color] duration-[120ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-2)] hover:text-[var(--color-text)]"
						>
							Skip — use defaults
						</button>
					</div>
				</div>
			</main>
		</ScreenShell>
	);
}
