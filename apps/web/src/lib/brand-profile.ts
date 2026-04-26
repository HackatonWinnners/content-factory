import { z } from "zod";

const BRAND_PROFILE_KEY = "cf:brandProfile";

export const BrandProfileSchema = z.object({
	name: z.string().min(1).max(120),
	description: z.string().max(2000).optional(),
	voice: z.string().min(1).max(2000),
	tone: z.object({
		formalCasual: z.number().min(0).max(100),
		seriousPlayful: z.number().min(0).max(100),
		directStorytelling: z.number().min(0).max(100),
	}),
	examples: z.array(z.string().max(500)).max(20).optional(),
	rules: z
		.object({
			dos: z.array(z.string().max(200)).max(20),
			donts: z.array(z.string().max(200)).max(20),
		})
		.optional(),
});

export type BrandProfile = z.infer<typeof BrandProfileSchema>;

export function defaultBrandProfile(): BrandProfile {
	return {
		name: "Acme Engineering",
		voice:
			"Technical but with humor. We write like engineers talk — direct, slightly sarcastic, never corporate. We show real numbers and skip marketing fluff.",
		tone: {
			formalCasual: 70,
			seriousPlayful: 55,
			directStorytelling: 30,
		},
	};
}

export function loadBrandProfile(): BrandProfile | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(BRAND_PROFILE_KEY);
		if (!raw) return null;
		const parsed = BrandProfileSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export function saveBrandProfile(profile: BrandProfile): void {
	if (typeof window === "undefined") return;
	const validated = BrandProfileSchema.parse(profile);
	window.localStorage.setItem(BRAND_PROFILE_KEY, JSON.stringify(validated));
}
