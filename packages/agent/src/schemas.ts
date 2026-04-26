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

// Peec AI distribution-gap context. `available` is false when the API key is
// missing or the brand has no Peec project — script writer skips it silently.
export const PeecContextSchema = z.object({
	available: z.boolean(),
	brandName: z.string(),
	ownBrand: z
		.object({
			visibility: z.number().min(0).max(1).nullable(),
			shareOfVoice: z.number().min(0).max(1).nullable(),
			sentiment: z.number().nullable(),
			mentionCount: z.number().int().nonnegative().nullable(),
		})
		.nullable(),
	competitors: z
		.array(
			z.object({
				name: z.string(),
				visibility: z.number().min(0).max(1).nullable(),
				shareOfVoice: z.number().min(0).max(1).nullable(),
			}),
		)
		.max(10),
	opportunityDomains: z.array(z.string()).max(10),
});

export type PeecContext = z.infer<typeof PeecContextSchema>;

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

// Scene types — each maps to a distinct composer layout + background motion.
export const SceneTypeEnum = z.enum([
	"stat",
	"fact",
	"feature",
	"comparison",
	"quote",
]);
export type SceneType = z.infer<typeof SceneTypeEnum>;

// Single scene shape. Required fields are common, type-specific data is in
// optional sub-objects. The narrator says `voiceover`; the screen shows `text`.
// Visible text is short (TikTok-style 1-2 lines); voiceover is longer prose.
export const VideoSceneSchema = z.object({
	type: SceneTypeEnum,
	text: z
		.string()
		.min(1)
		.max(240)
		.describe(
			"Short text shown on screen — 1-2 lines max, no full sentences. TikTok caption style.",
		),
	voiceover: z
		.string()
		.min(1)
		.max(800)
		.describe(
			"What the narrator says for this scene — natural spoken prose, 1-3 sentences, can be longer than the on-screen text.",
		),
	stat: z
		.object({
			value: z
				.string()
				.min(1)
				.max(60)
				.describe("Pre-formatted display value, e.g. '47k', '6×', '99.9%'"),
			label: z.string().min(1).max(120).describe("What the number measures"),
		})
		.optional()
		.describe("Required when type='stat'."),
	bullets: z
		.array(z.string().min(1).max(160))
		.max(6)
		.optional()
		.describe("Optional 2-6 short bullets for type='feature'."),
	comparison: z
		.object({
			them: z.string().min(1).max(200),
			us: z.string().min(1).max(200),
		})
		.optional()
		.describe("Required when type='comparison'."),
});

export type VideoScene = z.infer<typeof VideoSceneSchema>;

export const VideoScriptSchema = z.object({
	hook: z.object({
		text: z
			.string()
			.min(1)
			.max(200)
			.describe("Big punchy hook — 1 line, max ~6 words ideally."),
		voiceover: z
			.string()
			.min(1)
			.max(500)
			.describe("Spoken hook — slightly longer than the on-screen line."),
	}),
	scenes: z.array(VideoSceneSchema).min(3).max(8),
	cta: z.object({
		text: z
			.string()
			.min(1)
			.max(160)
			.describe("Closing call to action — short, punchy."),
		voiceover: z.string().min(1).max(400),
	}),
});

export type VideoScript = z.infer<typeof VideoScriptSchema>;
