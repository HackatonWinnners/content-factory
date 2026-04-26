import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

// Locate the Remotion entry. In dev `import.meta.url` points at this file in
// `packages/composer/src/`, so the sibling `index.ts` is right next door. In
// production the server bundle is `apps/server/dist/index.mjs` and this code
// gets inlined, so we walk up to the workspace root and pick up the on-disk
// composer source the docker image ships.
function resolveComposerEntry(): string {
	const here = path.dirname(fileURLToPath(import.meta.url));
	const sibling = path.join(here, "index.ts");
	if (existsSync(sibling)) return sibling;
	let dir = here;
	for (let i = 0; i < 12; i++) {
		const cand = path.join(dir, "packages", "composer", "src", "index.ts");
		if (existsSync(cand)) return cand;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error("composer entry index.ts not found from " + here);
}

export interface RenderOptions {
	compositionId: string;
	inputProps: Record<string, unknown>;
	outputLocation: string;
	onProgress?: (progress: number) => void;
}

export async function renderVideo(opts: RenderOptions): Promise<void> {
	const bundled = await bundle({
		entryPoint: resolveComposerEntry(),
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
		// Cap parallel Chromium instances to keep peak RAM bounded — a M1/M2
		// laptop runs out of heap somewhere between 4-6 concurrent renders when
		// the composition includes per-scene Audio + animated backgrounds.
		concurrency: 2,
		// Tame Chrome's per-renderer overhead.
		chromiumOptions: { gl: "swangle" },
		onProgress: opts.onProgress
			? ({ progress }) => opts.onProgress?.(progress)
			: undefined,
	});
}
