import { env } from "@content-factory/env/server";
import { type PeecContext, PeecContextSchema } from "./schemas";

// Peec AI Customer REST API — auth via x-api-key header.
// Docs: https://docs.peec.ai/api/authentication.md
// Get a key at https://app.peec.ai/api-keys (project- or company-scoped).
const PEEC_BASE = "https://api.peec.ai/customer/v1";
const TIMEOUT_MS = 8_000;
const REPORT_DAYS = 30;

// All Peec list/report endpoints wrap rows in `{ data: [...] }`.
type PeecEnvelope<T> = { data: T[] };

type PeecProject = { id: string; name: string; status?: string };

type PeecBrand = {
	id: string;
	name: string;
	domains: string[];
	is_own?: boolean;
	color?: string;
};

type PeecBrandReportRow = {
	brand: { id: string; name: string };
	mention_count?: number | null;
	visibility?: number | null;
	visibility_count?: number | null;
	visibility_total?: number | null;
};

type PeecDomainReportRow = {
	domain: string;
	classification?: string | null;
	usage_rate?: number | null;
	citation_rate?: number | null;
	retrieval_rate?: number | null;
	retrieval_count?: number | null;
	citation_count?: number | null;
	mentioned_brands?: { id: string; name: string }[];
};

interface FetchArgs {
	brandName: string;
	projectId?: string;
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

	if (!env.PEEC_API_KEY) return empty();

	try {
		// 1. Resolve project_id. If caller passed one, trust it. Otherwise pick
		//    the project whose name best matches the brand, falling back to
		//    the first one.
		let pid = projectId;
		if (!pid) {
			const projectsRes = await peecGet<PeecEnvelope<PeecProject>>("/projects");
			const projects = projectsRes?.data ?? [];
			if (projects.length === 0) return empty();
			const matched =
				projects.find((p) =>
					p.name.toLowerCase().includes(brandName.toLowerCase()),
				) ?? projects[0];
			if (!matched) return empty();
			pid = matched.id;
		}

		// 2. Discover brands tracked in this project.
		const brandsRes = await peecGet<PeecEnvelope<PeecBrand>>(
			`/brands?project_id=${encodeURIComponent(pid)}`,
		);
		const brands = brandsRes?.data ?? [];
		if (brands.length === 0) return empty();

		// Pick own brand: explicit `is_own` if any, else best name match,
		// else fall back to the first.
		const ownBrand =
			brands.find((b) => b.is_own) ??
			brands.find((b) =>
				b.name.toLowerCase().includes(brandName.toLowerCase()),
			) ??
			brands[0];
		if (!ownBrand) return empty();

		// 3. Brand visibility report — last 30 days, no filters so we get all
		//    tracked brands aggregated.
		const reportRes = await peecPost<PeecEnvelope<PeecBrandReportRow>>(
			"/reports/brands",
			{
				project_id: pid,
				start_date: isoDaysAgo(REPORT_DAYS),
				end_date: today(),
			},
		);
		const rows = reportRes?.data ?? [];

		const ownRow = rows.find((r) => r.brand.id === ownBrand.id);
		const competitorRows = rows
			.filter((r) => r.brand.id !== ownBrand.id)
			.sort((a, b) => (b.mention_count ?? 0) - (a.mention_count ?? 0))
			.slice(0, 5);

		// 4. Domain report — find high-traffic domains where we're absent.
		//    A domain is an "opportunity" if it has a non-trivial retrieval
		//    rate but our brand is not in its mentioned_brands list.
		const domainRes = await peecPost<PeecEnvelope<PeecDomainReportRow>>(
			"/reports/domains",
			{
				project_id: pid,
				start_date: isoDaysAgo(REPORT_DAYS),
				end_date: today(),
			},
		).catch(() => null);
		const domains = domainRes?.data ?? [];

		const opportunityDomains = domains
			.filter((d) => (d.retrieval_rate ?? 0) > 0.05)
			.filter((d) => {
				const mentioned = d.mentioned_brands ?? [];
				return !mentioned.some((b) => b.id === ownBrand.id);
			})
			.sort((a, b) => (b.retrieval_rate ?? 0) - (a.retrieval_rate ?? 0))
			.slice(0, 5)
			.map((d) => d.domain)
			.filter((d): d is string => Boolean(d));

		return PeecContextSchema.parse({
			available: true,
			brandName: ownBrand.name,
			ownBrand: ownRow
				? {
						visibility: ratio(ownRow.visibility),
						shareOfVoice: shareOfVoice(ownRow, rows),
						sentiment: null,
						mentionCount:
							typeof ownRow.mention_count === "number"
								? ownRow.mention_count
								: null,
					}
				: null,
			competitors: competitorRows.map((r) => ({
				name: r.brand.name,
				visibility: ratio(r.visibility),
				shareOfVoice: shareOfVoice(r, rows),
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

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

// Peec's `visibility` is already 0-1. Clamp defensively.
function ratio(n: number | null | undefined): number | null {
	if (typeof n !== "number" || Number.isNaN(n)) return null;
	if (n > 1) return Math.min(1, n / 100);
	return Math.max(0, Math.min(1, n));
}

// Derive share-of-voice from mention counts since the API doesn't surface it
// directly: brand_mentions / sum(all_brand_mentions).
function shareOfVoice(
	row: PeecBrandReportRow,
	all: PeecBrandReportRow[],
): number | null {
	const total = all.reduce((s, r) => s + (r.mention_count ?? 0), 0);
	if (total <= 0) return null;
	return Math.max(0, Math.min(1, (row.mention_count ?? 0) / total));
}
