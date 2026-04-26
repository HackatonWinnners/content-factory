import { z } from "zod";

const BRAND_PROFILE_KEY = "cf:brandProfile";

export const BrandProfileSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	voice: z.string().min(1),
	tone: z.object({
		formalCasual: z.number(),
		seriousPlayful: z.number(),
		directStorytelling: z.number(),
	}),
	examples: z.array(z.string()).optional(),
	rules: z
		.object({
			dos: z.array(z.string()),
			donts: z.array(z.string()),
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
