import { z } from "zod";

const STORAGE_KEY = "cf:recentProjects";
const MAX = 8;

export const RecentProjectSchema = z.object({
	jobId: z.string().min(1).optional(),
	owner: z.string().min(1),
	name: z.string().min(1),
	source: z.enum(["github", "linear", "pdf"]),
	createdAt: z.number().int().nonnegative(),
});
export type RecentProject = z.infer<typeof RecentProjectSchema>;

const ListSchema = z.array(RecentProjectSchema);

export function loadRecentProjects(): RecentProject[] {
	if (typeof window === "undefined") return [];
	const raw = window.localStorage.getItem(STORAGE_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		const result = ListSchema.safeParse(parsed);
		return result.success ? result.data : [];
	} catch {
		return [];
	}
}

export function pushRecentProject(p: Omit<RecentProject, "createdAt">): void {
	if (typeof window === "undefined") return;
	const now = Date.now();
	const current = loadRecentProjects();
	// De-dupe by owner/name — keep most recent occurrence.
	const filtered = current.filter(
		(c) => !(c.owner === p.owner && c.name === p.name),
	);
	const next = [{ ...p, createdAt: now }, ...filtered].slice(0, MAX);
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function relativeTime(epochMs: number): string {
	const diff = Date.now() - epochMs;
	const sec = Math.floor(diff / 1000);
	if (sec < 60) return "now";
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	if (day < 7) return `${day}d ago`;
	const wk = Math.floor(day / 7);
	if (wk < 4) return `${wk}w ago`;
	return new Date(epochMs).toLocaleDateString();
}
