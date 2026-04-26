import { env } from "@content-factory/env/server";
import { type PeecContext, PeecContextSchema } from "./schemas";

// Peec AI Customer REST API — auth via x-api-key header.
// Docs: https://docs.peec.ai/api/authentication.md
// Get a key at https://app.peec.ai/api-keys (project- or company-scoped).
const PEEC_BASE = "https://api.peec.ai/customer/v1";
const TIMEOUT_MS = 8_000;
const REPORT_DAYS = 30;

type PeecBrand = {
	id: string;
	name: string;
	domains: string[];
	aliases: string[];
	is_own?: boolean;
};

type PeecBrandReportRow = {
	brand_id: string;
	brand_name: string;
	visibility?: number | null;
	share_of_voice?: number | null;
	sentiment?: number | null;
	mention_count?: number | null;
};

type PeecDomainReportRow = {
	domain: string;
	classification?: string | null;
	citation_rate?: number | null;
	retrieval_rate?: number | null;
};

interface FetchArgs {
	brandName: string;
	projectId?: string; // optional override — useful for hackathon test projects
}

// Best-effort: returns enriched context if PEEC_API_KEY is set AND we can find
// a matching project; otherwise returns an empty shell that the script writer
// will silently ignore. Never throws — Peec is enrichment, not core path.
export async function fetchPeecContext({
	brandName,
	projectId,
}: FetchArgs): Promise<PeecContext> {
	const empty = (): PeecContext => ({
		available: false,
		brandName,
		ownBrand: null,
		competitors: [],
		opportunityDomains: [],
	});

	if (!env.PEEC_API_KEY) {
		return empty();
	}

	try {
		// 1. Discover brands. If projectId given use it, otherwise let key scope decide.
		const brandsRes = await peecGet<PeecBrand[]>(
			`/brands${projectId ? `?project_id=${encodeURIComponent(projectId)}` : ""}`,
		);
		if (!brandsRes || brandsRes.length === 0) return empty();

		// Pick own brand: explicit `is_own` if present, else closest name match.
		const ownBrand =
			brandsRes.find((b) => b.is_own) ??
			brandsRes.find((b) =>
				b.name.toLowerCase().includes(brandName.toLowerCase()),
			) ??
			brandsRes[0];
		if (!ownBrand) return empty();

		// 2. Brand visibility/share-of-voice report over the last 30 days.
		const brandReport = await peecPost<PeecBrandReportRow[]>(
			"/reports/brands",
			{
				...(projectId ? { project_id: projectId } : {}),
				start_date: isoDaysAgo(REPORT_DAYS),
				end_date: new Date().toISOString().slice(0, 10),
				dimensions: ["brand"],
			},
		);

		const ownRow = brandReport?.find((r) => r.brand_id === ownBrand.id);
		const competitorRows = (brandReport ?? [])
			.filter((r) => r.brand_id !== ownBrand.id)
			.sort((a, b) => (b.share_of_voice ?? 0) - (a.share_of_voice ?? 0))
			.slice(0, 5);

		// 3. Domains report — find where competitors are cited but own brand isn't.
		const domainReport = await peecPost<PeecDomainReportRow[]>(
			"/reports/domains",
			{
				...(projectId ? { project_id: projectId } : {}),
				start_date: isoDaysAgo(REPORT_DAYS),
				end_date: new Date().toISOString().slice(0, 10),
			},
		).catch(() => null);

		const opportunityDomains = (domainReport ?? [])
			.filter((d) => (d.citation_rate ?? 0) < 0.2)
			.sort((a, b) => (b.retrieval_rate ?? 0) - (a.retrieval_rate ?? 0))
			.slice(0, 5)
			.map((d) => d.domain)
			.filter((d): d is string => Boolean(d));

		return PeecContextSchema.parse({
			available: true,
			brandName: ownBrand.name,
			ownBrand: ownRow
				? {
						visibility: clamp01(ownRow.visibility),
						shareOfVoice: clamp01(ownRow.share_of_voice),
						sentiment:
							typeof ownRow.sentiment === "number" ? ownRow.sentiment : null,
						mentionCount:
							typeof ownRow.mention_count === "number"
								? ownRow.mention_count
								: null,
					}
				: null,
			competitors: competitorRows.map((r) => ({
				name: r.brand_name,
				visibility: clamp01(r.visibility),
				shareOfVoice: clamp01(r.share_of_voice),
			})),
			opportunityDomains,
		});
	} catch (e) {
		console.warn("[agent.peec] failed:", e);
		return empty();
	}
}

async function peecGet<T>(path: string): Promise<T | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(`${PEEC_BASE}${path}`, {
			method: "GET",
			headers: {
				"x-api-key": env.PEEC_API_KEY ?? "",
				accept: "application/json",
			},
			signal: controller.signal,
		});
		if (!res.ok) {
			console.warn(`[agent.peec] GET ${path} → ${res.status}`);
			return null;
		}
		return (await res.json()) as T;
	} finally {
		clearTimeout(timer);
	}
}

async function peecPost<T>(path: string, body: unknown): Promise<T | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(`${PEEC_BASE}${path}`, {
			method: "POST",
			headers: {
				"x-api-key": env.PEEC_API_KEY ?? "",
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify(body ?? {}),
			signal: controller.signal,
		});
		if (!res.ok) {
			console.warn(`[agent.peec] POST ${path} → ${res.status}`);
			return null;
		}
		return (await res.json()) as T;
	} finally {
		clearTimeout(timer);
	}
}

function isoDaysAgo(days: number): string {
	const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
	return d.toISOString().slice(0, 10);
}

function clamp01(n: number | null | undefined): number | null {
	if (typeof n !== "number" || Number.isNaN(n)) return null;
	if (n <= 1) return Math.max(0, n);
	// Some endpoints return percentages 0-100; normalise to 0-1.
	return Math.max(0, Math.min(1, n / 100));
}
