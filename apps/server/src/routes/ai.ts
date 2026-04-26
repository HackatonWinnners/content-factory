import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import { env } from "@content-factory/env/server";
import { convertToModelMessages, streamText, wrapLanguageModel } from "ai";
import { Hono } from "hono";

export const aiRoutes = new Hono();

const isDev = env.NODE_ENV === "development";

aiRoutes.post("/", async (c) => {
	const body = await c.req.json();
	const uiMessages = body.messages || [];
	const baseModel = google("gemini-2.5-flash");
	const model = isDev
		? wrapLanguageModel({ model: baseModel, middleware: devToolsMiddleware() })
		: baseModel;
	const result = streamText({
		model,
		messages: await convertToModelMessages(uiMessages),
	});

	return result.toUIMessageStreamResponse();
});
