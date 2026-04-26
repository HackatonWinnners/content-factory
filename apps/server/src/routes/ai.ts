import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, wrapLanguageModel } from "ai";
import { Hono } from "hono";

export const aiRoutes = new Hono();

aiRoutes.post("/", async (c) => {
	const body = await c.req.json();
	const uiMessages = body.messages || [];
	const model = wrapLanguageModel({
		model: google("gemini-2.5-flash"),
		middleware: devToolsMiddleware(),
	});
	const result = streamText({
		model,
		messages: await convertToModelMessages(uiMessages),
	});

	return result.toUIMessageStreamResponse();
});
