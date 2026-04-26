import { GithubIcon, LinearIcon, PdfIcon } from "./source-icons";
import type { RangeDays, SourceTab } from "./source-screen";

const RANGE_OPTIONS: Array<{ id: RangeDays; label: string }> = [
	{ id: 7, label: "Last 7 days" },
	{ id: 30, label: "Last 30 days" },
	{ id: 90, label: "Last 90 days" },
];

export function TabsAndUrl({
	tab,
	onTabChange,
	url,
	onUrlChange,
	days,
	onDaysChange,
}: {
	tab: SourceTab;
	onTabChange: (t: SourceTab) => void;
	url: string;
	onUrlChange: (u: string) => void;
	days: RangeDays;
	onDaysChange: (d: RangeDays) => void;
}) {
	return (
		<div>
			{/* Tabs */}
			<div className="mt-6 flex items-center gap-8 border-[var(--color-border)] border-b">
				{(
					[
						{ id: "github", label: "GitHub", enabled: true },
						{ id: "linear", label: "Linear", enabled: false },
						{ id: "pdf", label: "PDF", enabled: false },
					] as const
				).map((t) => {
					const isActive = tab === t.id;
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => t.enabled && onTabChange(t.id)}
							disabled={!t.enabled}
							className={`relative cursor-pointer border-none bg-transparent p-[10px_0] font-medium text-[14px] transition-colors duration-[120ms] ${
								isActive
									? "text-[var(--color-text)]"
									: t.enabled
										? "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
										: "cursor-not-allowed text-[var(--color-text-dim)] opacity-60"
							}`}
						>
							{t.label}
							{!t.enabled ? (
								<span className="mono ml-2 inline-flex items-center rounded-[3px] border border-[var(--color-border)] px-1.5 py-[1px] text-[10px] text-[var(--color-text-dim)] uppercase tracking-[0.08em]">
									soon
								</span>
							) : null}
							{isActive ? (
								<span
									aria-hidden
									className="absolute right-0 bottom-[-1px] left-0 h-[2px] rounded-tl-[1px] rounded-tr-[1px] bg-[var(--color-magenta)]"
								/>
							) : null}
						</button>
					);
				})}
			</div>

			{/* URL row */}
			<div className="mt-5 flex items-center gap-3">
				<div
					className="flex h-11 flex-1 items-center rounded border border-[var(--color-border)] px-3.5 transition-colors duration-[120ms] focus-within:border-[var(--color-border-strong)]"
					style={{ background: "var(--color-elev-1)" }}
				>
					<span className="text-[var(--color-text-muted)]">
						<GithubIcon size={14} />
					</span>
					<input
						type="text"
						spellCheck={false}
						value={url}
						onChange={(e) => onUrlChange(e.target.value)}
						placeholder="github.com/owner/repo"
						className="mono ml-2.5 min-w-0 flex-1 border-none bg-transparent text-[13px] text-[var(--color-text)] outline-none"
					/>
				</div>
				<div className="inline-flex h-11 shrink-0 items-center gap-1.5 px-3 text-[11px] text-[var(--color-text-muted)]">
					<span
						aria-hidden
						className="block h-1.5 w-1.5 rounded-full"
						style={{
							background: "var(--color-green)",
							boxShadow: "0 0 0 3px rgba(45,106,79,0.18)",
						}}
					/>
					<span>
						Connected as{" "}
						<span className="mono text-[var(--color-text)]">@you</span>
					</span>
				</div>
			</div>

			{/* Time range pills */}
			<div className="mt-3 flex gap-1">
				{RANGE_OPTIONS.map((p) => {
					const active = days === p.id;
					return (
						<button
							key={p.id}
							type="button"
							onClick={() => onDaysChange(p.id)}
							className={`h-[30px] cursor-pointer rounded border px-3 text-[12.5px] transition-[background-color,border-color,color] duration-[120ms] ${
								active
									? "border-[rgba(229,38,124,0.35)] bg-[var(--color-magenta-bg)] text-[var(--color-magenta)]"
									: "border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
							}`}
						>
							{p.label}
						</button>
					);
				})}
				<button
					type="button"
					disabled
					className="h-[30px] cursor-not-allowed rounded border border-[var(--color-border)] bg-transparent px-3 text-[12.5px] text-[var(--color-text-dim)] opacity-60"
				>
					Custom range
				</button>
			</div>
		</div>
	);
}

// Hide unused warnings in icon module imports.
void LinearIcon;
void PdfIcon;
