// Lucide-style icons used by the Source screen. Stroke 1.5, 16px default.
type IconProps = { size?: number };

function Svg({ size, children }: { size: number; children: React.ReactNode }) {
	return (
		<svg
			aria-hidden="true"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			style={{ flexShrink: 0 }}
		>
			{children}
		</svg>
	);
}

export function GithubIcon({ size = 14 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
		</Svg>
	);
}

export function LinearIcon({ size = 14 }: IconProps) {
	return (
		<Svg size={size}>
			<rect x={3} y={3} width={18} height={18} rx={4} />
			<path d="M7 10l4 4 6-6" />
		</Svg>
	);
}

export function PdfIcon({ size = 14 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<path d="M14 2v6h6" />
			<path d="M9 14h6M9 18h6M9 10h2" />
		</Svg>
	);
}

export function SettingsIcon({ size = 14 }: IconProps) {
	return (
		<Svg size={size}>
			<circle cx={12} cy={12} r={3} />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</Svg>
	);
}

export function PencilIcon({ size = 12 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
		</Svg>
	);
}

export function PlayIcon({ size = 10 }: IconProps) {
	return (
		<svg
			aria-hidden="true"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="currentColor"
			style={{ flexShrink: 0 }}
		>
			<polygon points="6 4 20 12 6 20 6 4" />
		</svg>
	);
}

export function CheckIcon({ size = 10 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M20 6L9 17l-5-5" />
		</Svg>
	);
}

export function ArrowRightIcon({ size = 14 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M5 12h14M13 5l7 7-7 7" />
		</Svg>
	);
}

export function ChevRightIcon({ size = 14 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M9 18l6-6-6-6" />
		</Svg>
	);
}

export function EyeIcon({ size = 13 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx={12} cy={12} r={3} />
		</Svg>
	);
}
