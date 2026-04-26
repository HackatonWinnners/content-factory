import { redirect } from "next/navigation";

import { ScreenShell } from "@/components/screen-shell";

import { ProgressStream } from "./_components/progress-stream";

type SearchParams = Promise<{ jobId?: string | string[] }>;

export default async function ThinkingPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const params = await searchParams;
	const raw = params.jobId;
	const jobId = Array.isArray(raw) ? raw[0] : raw;

	if (!jobId) {
		redirect("/source");
	}

	return (
		<ScreenShell>
			<ProgressStream jobId={jobId} />
		</ScreenShell>
	);
}
