import path from "node:path";
import "@content-factory/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki"],
};

export default nextConfig;
