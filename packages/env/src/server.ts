import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

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
