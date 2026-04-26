import { EyeIcon } from "./source-icons";
import type { PreviewCommit, PreviewState } from "./use-repo-preview";

export function CommitList({
	preview,
	visibleCommits,
	showAll,
	onToggleShowAll,
}: {
	preview: PreviewState;
	visibleCommits: PreviewCommit[];
	showAll: boolean;
	onToggleShowAll: () => void;
}) {
	const userFacingCount =
		preview.status === "ready"
			? preview.data.commits.filter((c) => c.isUserFacing).length
			: 0;
	const totalCount =
		preview.status === "ready" ? preview.data.commits.length : 0;

	return (
		<div className="mt-6">
			{/* Filter strip */}
			<div className="flex items-center justify-between pb-2">
				<div className="text-[13px] text-[var(--color-text-muted)]">
					{preview.status === "ready" ? (
						<>
							Showing{" "}
							<span className="font-semibold text-[var(--color-magenta)]">
								{userFacingCount}
							</span>{" "}
							user-facing changes from {totalCount} commits
						</>
					) : preview.status === "loading" ? (
						"Loading commits…"
					) : preview.status === "error" ? (
						<span className="text-[var(--color-text-dim)]">
							Couldn't load commits ({preview.error})
						</span>
					) : (
						<span className="text-[var(--color-text-dim)]">
							Paste a GitHub URL to see commits.
						</span>
					)}
				</div>
				{preview.status === "ready" && totalCount > userFacingCount ? (
					<button
						type="button"
						onClick={onToggleShowAll}
						className="inline-flex cursor-pointer items-center gap-1.5 rounded border-none bg-transparent p-[4px_6px] text-[12.5px] text-[var(--color-text-muted)] transition-[background-color,color] duration-[120ms] hover:bg-[var(--color-elev-1)] hover:text-[var(--color-text)]"
					>
						<EyeIcon size={13} />
						{showAll ? "Hide non-user-facing" : `Show all ${totalCount}`}
					</button>
				) : null}
			</div>

			{/* List */}
			<div className="border-[rgba(255,255,255,0.06)] border-t">
				{visibleCommits.length === 0 && preview.status === "ready" ? (
					<div className="py-10 text-center text-[13px] text-[var(--color-text-dim)]">
						No user-facing changes in this range.
					</div>
				) : null}
				{visibleCommits.map((c) => {
					const dim = !c.isUserFacing;
					return (
						<div
							key={c.sha}
							className={`grid h-14 cursor-pointer grid-cols-[16px_80px_1fr_auto] items-center gap-4 border-[rgba(255,255,255,0.06)] border-b px-3 transition-colors duration-[120ms] ${
								dim ? "opacity-40" : "hover:bg-[var(--color-elev-1)]"
							}`}
						>
							<div
								aria-hidden
								className={`h-2 w-2 rounded-full ${dim ? "border border-[var(--color-text-dim)] opacity-60" : ""}`}
								style={
									dim
										? { background: "transparent" }
										: {
												background: "var(--color-magenta)",
												boxShadow: "0 0 0 3px rgba(229,38,124,0.14)",
											}
								}
							/>
							<span className="mono text-[12px] text-[var(--color-text-muted)]">
								{c.sha}
							</span>
							<span className="min-w-0 truncate text-[13px] text-[var(--color-text)]">
								{c.scope ? (
									<span className="mono mr-1 text-[12.5px] text-[var(--color-text-muted)]">
										{c.scope}
									</span>
								) : null}
								{c.description}
							</span>
							<div className="inline-flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
								<AuthorAvatar
									name={c.authorName}
									avatarUrl={c.authorAvatarUrl}
								/>
								<span className="text-[var(--color-text-muted)]">
									{c.authorName}
								</span>
								<span className="mono text-[11px] text-[var(--color-text-dim)]">
									· {relativeShort(c.date)}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function AuthorAvatar({
	name,
	avatarUrl,
}: {
	name: string;
	avatarUrl: string | null;
}) {
	if (avatarUrl) {
		return (
			// biome-ignore lint/performance/noImgElement: external avatar, dimensions known
			<img
				src={avatarUrl}
				alt=""
				width={20}
				height={20}
				className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)]"
			/>
		);
	}
	const initials =
		name
			.split(/\s+/)
			.map((s) => s[0]?.toUpperCase() ?? "")
			.slice(0, 2)
			.join("") || "?";
	return (
		<span
			className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] font-semibold text-[9px] text-white"
			style={{
				background: "linear-gradient(135deg,#3A2A4A,#4D2E5C)",
			}}
		>
			{initials}
		</span>
	);
}

function relativeShort(iso: string): string {
	if (!iso) return "";
	const diff = Date.now() - new Date(iso).getTime();
	const min = Math.round(diff / 60_000);
	if (min < 60) return `${min}m ago`;
	const hr = Math.round(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.round(hr / 24);
	if (day < 7) return `${day}d ago`;
	const wk = Math.round(day / 7);
	if (wk < 5) return `${wk}w ago`;
	return new Date(iso).toLocaleDateString();
}
