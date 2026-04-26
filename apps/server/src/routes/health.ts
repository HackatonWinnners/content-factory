import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/", (c) =>
	c.json({
		ok: true,
		version: "0.1.0",
		uptime: process.uptime(),
	}),
);
