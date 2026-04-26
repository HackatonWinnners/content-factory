import { GithubIcon } from "./source-icons";
import type { PreviewState } from "./use-repo-preview";

export function MetadataCard({ preview }: { preview: PreviewState }) {
	return (
		<div
			className="mt-6 grid grid-cols-4 gap-4 rounded-md border border-[var(--color-border)] p-4"
			style={{ background: "var(--color-elev-1)" }}
		>
			<Cell label="Repo">
				{preview.status === "ready" ? (
					<span className="mono inline-flex items-center gap-1.5">
						<GithubIcon size={13} />
						{preview.data.owner}/{preview.data.name}
					</span>
				) : (
					<Skeleton kind={preview} fallback="—" />
				)}
			</Cell>
			<Cell label="Commits in range">
				{preview.status === "ready" ? (
					<span className="mono">{preview.data.commitsInRange}</span>
				) : (
					<Skeleton kind={preview} fallback="—" />
				)}
			</Cell>
			<Cell label="Languages">
				{preview.status === "ready" && preview.data.languages.length > 0 ? (
					<span className="inline-flex gap-1.5">
						{preview.data.languages.slice(0, 2).map((l) => (
							<span
								key={l.name}
								className="mono inline-flex items-center rounded border border-[var(--color-border)] px-2 py-[2px] font-medium text-[11px] text-[var(--color-text)]"
								style={{ background: "rgba(255,255,255,0.025)" }}
							>
								<span
									aria-hidden
									className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
									style={{ background: l.color ?? "#888" }}
								/>
								{l.name}
							</span>
						))}
					</span>
				) : (
					<Skeleton kind={preview} fallback="—" />
				)}
			</Cell>
			<Cell label="Last activity">
				{preview.status === "ready" ? (
					<span className="mono">
						{relativeShort(preview.data.lastActivity)}
					</span>
				) : (
					<Skeleton kind={preview} fallback="—" />
				)}
			</Cell>
		</div>
	);
}

function Cell({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<div className="mono mb-1.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
				{label}
			</div>
			<div className="inline-flex items-center gap-1.5 font-medium text-[14px] text-[var(--color-text)]">
				{children}
			</div>
		</div>
	);
}

function Skeleton({
	kind,
	fallback,
}: {
	kind: PreviewState;
	fallback: string;
}) {
	if (kind.status === "loading") {
		return (
			<span
				aria-hidden
				className="inline-block h-4 w-20 animate-pulse rounded"
				style={{ background: "rgba(255,255,255,0.06)" }}
			/>
		);
	}
	if (kind.status === "error") {
		return <span className="text-[13px] text-[var(--color-text-dim)]">—</span>;
	}
	return <span className="text-[var(--color-text-dim)]">{fallback}</span>;
}

function relativeShort(iso: string | null): string {
	if (!iso) return "—";
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
