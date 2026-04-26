import { z } from "zod";

export const RepoSnapshotSchema = z.object({
	owner: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable(),
	primaryLanguage: z.string().nullable(),
	topics: z.array(z.string()),
	stars: z.number().int().nonnegative(),
	readme: z.string(),
	recentCommits: z.array(
		z.object({
			message: z.string(),
			date: z.string(),
		}),
	),
});

export type RepoSnapshot = z.infer<typeof RepoSnapshotSchema>;

export const MarketContextSchema = z.object({
	topic: z.string(),
	results: z
		.array(
			z.object({
				title: z.string(),
				url: z.string(),
				snippet: z.string(),
				score: z.number().optional(),
			}),
		)
		.max(8),
});

export type MarketContext = z.infer<typeof MarketContextSchema>;

export const BrandToneSchema = z.object({
	formalCasual: z.number().min(0).max(100),
	seriousPlayful: z.number().min(0).max(100),
	directStorytelling: z.number().min(0).max(100),
});

export const BrandProfileSchema = z.object({
	name: z.string().min(1).max(120),
	description: z.string().max(2000).optional(),
	voice: z.string().min(1).max(2000),
	tone: BrandToneSchema,
	examples: z.array(z.string().max(500)).max(20).optional(),
	rules: z
		.object({
			dos: z.array(z.string().max(200)).max(20),
			donts: z.array(z.string().max(200)).max(20),
		})
		.optional(),
});

export type BrandProfile = z.infer<typeof BrandProfileSchema>;

export const VideoSceneSchema = z.object({
	text: z.string().min(1),
	bullets: z.array(z.string()).max(5).optional(),
	durationSec: z.number().min(2).max(8),
});

export const VideoScriptSchema = z.object({
	hook: z.string().min(1),
	scenes: z.array(VideoSceneSchema).min(4).max(8),
	closingCta: z.string().min(1),
});

export type VideoScript = z.infer<typeof VideoScriptSchema>;
