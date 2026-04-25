export function Header() {
	return (
		<header className="flex h-14 items-center justify-between border-[var(--color-border)] border-b px-6">
			<span className="font-medium text-[14px] text-[var(--color-text)] tracking-[-0.01em]">
				Content Factory
				<span className="text-[var(--color-magenta)]">.</span>
			</span>
			<div className="flex items-center gap-[14px]">
				<button
					type="button"
					className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent py-[6px] pr-[10px] pl-3 text-[13px] text-[var(--color-text)] transition-[background-color,border-color] duration-[120ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elev-1)]"
				>
					<span
						className="inline-flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border border-[var(--color-border)] font-semibold text-[9px] text-[var(--color-text-muted)]"
						style={{
							background: "linear-gradient(135deg,#2A2A30,#1B1B20)",
						}}
					>
						A
					</span>
					<span>Acme Co</span>
					<svg
						aria-hidden="true"
						width={12}
						height={12}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
				<span
					className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] font-semibold text-[11px]"
					style={{
						background: "linear-gradient(135deg,#2E1F2A,#3A2533)",
						color: "#E5C7D6",
					}}
				>
					MP
				</span>
			</div>
		</header>
	);
}

export default Header;
