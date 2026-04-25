import { ScreenShell } from "@/components/screen-shell";

import { SourceForm } from "./_components/source-form";

export default function SourcePage() {
	return (
		<ScreenShell>
			<main className="mx-auto flex w-full max-w-[840px] flex-col gap-10 px-20 pt-20 pb-24">
				<header className="flex flex-col gap-2">
					<h1 className="font-semibold text-[28px] text-[var(--color-text)] tracking-[-0.012em]">
						Drop a source
					</h1>
					<p className="text-[14px] text-[var(--color-text-muted)] leading-[1.55]">
						We turn it into a 30-60 second on-brand video.
					</p>
				</header>
				<SourceForm />
			</main>
		</ScreenShell>
	);
}
