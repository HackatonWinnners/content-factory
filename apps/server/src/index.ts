import { env } from "@content-factory/env/server";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { aiRoutes } from "./routes/ai";
import { healthRoutes } from "./routes/health";
import { videoJobRoutes } from "./routes/video-jobs";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
	}),
);

app.route("/api/v1/health", healthRoutes);
app.route("/api/v1/ai", aiRoutes);
app.route("/api/v1/video-jobs", videoJobRoutes);

app.get("/", (c) => c.text("OK"));

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
