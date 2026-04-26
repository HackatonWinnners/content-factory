import { redirect } from "next/navigation";

import { ScreenShell } from "@/components/screen-shell";

import { VideoCard } from "./_components/video-card";

type SearchParams = Promise<{ jobId?: string | string[] }>;

export default async function ResultPage({
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
		<ScreenShell header={null}>
			<VideoCard jobId={jobId} />
		</ScreenShell>
	);
}
