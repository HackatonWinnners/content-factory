import { defineConfig } from "tsdown";

// rspack/remotion in the bundle reference __filename/__dirname/require which
// don't exist in ES module scope. Inject ESM-compatible shims at the top of
// the bundle so CJS-style code keeps working when bundled into ESM.
// `require` is declared (and reassigned) inside the bundled rspack code, so we
// only need to provide __filename / __dirname at module scope. Using `var` so
// any later code that tries to reassign is not blocked.
const esmCjsCompatBanner = [
	"import { createRequire as __cf_createRequire } from 'node:module';",
	"import { fileURLToPath as __cf_fileURLToPath } from 'node:url';",
	"import { dirname as __cf_dirname } from 'node:path';",
	"var __filename = __cf_fileURLToPath(import.meta.url);",
	"var __dirname = __cf_dirname(__filename);",
	"var require = __cf_createRequire(import.meta.url);",
].join("\n");

export default defineConfig({
	entry: "./src/index.ts",
	format: "esm",
	outDir: "./dist",
	clean: true,
	noExternal: [/@content-factory\/.*/],
	outputOptions: {
		banner: esmCjsCompatBanner,
	},
});
