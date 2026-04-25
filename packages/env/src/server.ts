import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// Walk up from this file to find the monorepo root .env so dev scripts work
// no matter which package directory they were spawned from.
function findRootEnv(): string | undefined {
	let dir = dirname(fileURLToPath(import.meta.url));
	for (let i = 0; i < 12; i++) {
		const candidate = join(dir, ".env");
		if (existsSync(candidate)) return candidate;
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return undefined;
}

const rootEnv = findRootEnv();
if (rootEnv) loadDotenv({ path: rootEnv });
else loadDotenv();

// AI SDK's @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY from process.env
// directly, bypassing our typed env. Mirror our GEMINI_API_KEY into it so we
// can keep one key name in the .env file.
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
	process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		GEMINI_API_KEY: z.string().min(1),
		TAVILY_API_KEY: z.string().min(1),
		HERA_API_KEY: z.string().min(1),
		PIONEER_API_KEY: z.string().min(1),
		GRADIUM_API_KEY: z.string().min(1),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
