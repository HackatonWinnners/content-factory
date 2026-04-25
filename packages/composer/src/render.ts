import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const here = path.dirname(fileURLToPath(import.meta.url));

export interface RenderOptions {
	compositionId: string;
	inputProps: Record<string, unknown>;
	outputLocation: string;
	onProgress?: (progress: number) => void;
}

export async function renderVideo(opts: RenderOptions): Promise<void> {
	const bundled = await bundle({
		entryPoint: path.join(here, "index.ts"),
	});

	const composition = await selectComposition({
		serveUrl: bundled,
		id: opts.compositionId,
		inputProps: opts.inputProps,
	});

	await renderMedia({
		composition,
		serveUrl: bundled,
		codec: "h264",
		outputLocation: opts.outputLocation,
		inputProps: opts.inputProps,
		onProgress: opts.onProgress
			? ({ progress }) => opts.onProgress?.(progress)
			: undefined,
	});
}
