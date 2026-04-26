import {
	AbsoluteFill,
	interpolate,
	Series,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { z } from "zod";

const FPS = 30;
const HOOK_SECONDS = 2.5;
const CLOSING_SECONDS = 2;

const sceneSchema = z.object({
	text: z.string().min(1),
	bullets: z.array(z.string()).optional(),
	durationSec: z.number().min(2).max(8),
});

const videoScriptSchema = z.object({
	hook: z.string().min(1),
	scenes: z.array(sceneSchema).min(4).max(8),
	closingCta: z.string().min(1),
});

const brandToneSchema = z.object({
	formalCasual: z.number().min(0).max(100),
	seriousPlayful: z.number().min(0).max(100),
	directStorytelling: z.number().min(0).max(100),
});

const brandSchema = z.object({
	name: z.string().min(1),
	tone: brandToneSchema,
});

export const scriptVideoSchema = z.object({
	script: videoScriptSchema,
	brand: brandSchema,
	repo: z
		.object({
			owner: z.string(),
			name: z.string(),
		})
		.optional(),
});

export type ScriptVideoProps = z.infer<typeof scriptVideoSchema>;

const COLORS = {
	bg: "#0A0A0B",
	elev: "#111113",
	text: "#ECECEE",
	textMuted: "#8A8A93",
	textDim: "#5C5C66",
	magenta: "#E5267C",
	magentaSoft: "rgba(229, 38, 124, 0.14)",
	border: "rgba(255,255,255,0.08)",
};

const FONT_BODY = "Inter, system-ui, -apple-system, sans-serif";
const FONT_MONO = "JetBrains Mono, ui-monospace, monospace";

const Backdrop: React.FC = () => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(circle at 50% 25%, ${COLORS.magentaSoft} 0%, transparent 55%), ${COLORS.bg}`,
		}}
	/>
);

const Wordmark: React.FC<{ name: string }> = ({ name }) => (
	<div
		style={{
			fontFamily: FONT_BODY,
			fontSize: 28,
			fontWeight: 500,
			letterSpacing: "-0.01em",
			color: COLORS.text,
		}}
	>
		{name}
		<span style={{ color: COLORS.magenta }}>.</span>
	</div>
);

const HookScene: React.FC<{ hook: string; brandName: string }> = ({
	hook,
	brandName,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
	const opacity = interpolate(enter, [0, 1], [0, 1]);
	const translateY = interpolate(enter, [0, 1], [40, 0]);

	return (
		<AbsoluteFill>
			<Backdrop />
			<AbsoluteFill
				style={{
					padding: 80,
					justifyContent: "space-between",
				}}
			>
				<Wordmark name={brandName} />
				<div
					style={{
						opacity,
						transform: `translateY(${translateY}px)`,
					}}
				>
					<div
						style={{
							fontFamily: FONT_MONO,
							fontSize: 22,
							color: COLORS.magenta,
							textTransform: "uppercase",
							letterSpacing: "0.18em",
							marginBottom: 32,
						}}
					>
						The hook
					</div>
					<h1
						style={{
							fontFamily: FONT_BODY,
							fontSize: 110,
							fontWeight: 700,
							lineHeight: 1.05,
							letterSpacing: "-0.02em",
							color: COLORS.text,
							margin: 0,
						}}
					>
						{hook}
					</h1>
				</div>
				<div
					style={{
						height: 6,
						width: 160,
						background: COLORS.magenta,
						borderRadius: 4,
					}}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const ContentScene: React.FC<{
	text: string;
	bullets?: string[];
	index: number;
	total: number;
	brandName: string;
}> = ({ text, bullets, index, total, brandName }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
	const opacity = interpolate(enter, [0, 1], [0, 1]);
	const translateY = interpolate(enter, [0, 1], [32, 0]);

	return (
		<AbsoluteFill>
			<Backdrop />
			<AbsoluteFill
				style={{
					padding: 80,
					justifyContent: "space-between",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Wordmark name={brandName} />
					<div
						style={{
							fontFamily: FONT_MONO,
							fontSize: 18,
							color: COLORS.textMuted,
							letterSpacing: "0.12em",
						}}
					>
						{String(index + 1).padStart(2, "0")} /{" "}
						{String(total).padStart(2, "0")}
					</div>
				</div>

				<div
					style={{
						opacity,
						transform: `translateY(${translateY}px)`,
					}}
				>
					<div
						style={{
							height: 6,
							width: 96,
							background: COLORS.magenta,
							borderRadius: 4,
							marginBottom: 40,
						}}
					/>
					<div
						style={{
							fontFamily: FONT_BODY,
							fontSize: 76,
							fontWeight: 600,
							lineHeight: 1.12,
							letterSpacing: "-0.02em",
							color: COLORS.text,
							margin: 0,
						}}
					>
						{text}
					</div>

					{bullets && bullets.length > 0 ? (
						<ul
							style={{
								marginTop: 56,
								padding: 0,
								listStyle: "none",
								display: "flex",
								flexDirection: "column",
								gap: 24,
							}}
						>
							{bullets.map((bullet, i) => {
								const bulletDelay = 6 + i * 4;
								const bulletEnter = spring({
									frame: frame - bulletDelay,
									fps,
									config: { damping: 18, stiffness: 110 },
								});
								return (
									<li
										key={`${bullet}-${i}`}
										style={{
											fontFamily: FONT_MONO,
											fontSize: 32,
											lineHeight: 1.4,
											color: COLORS.text,
											opacity: bulletEnter,
											transform: `translateX(${interpolate(bulletEnter, [0, 1], [-16, 0])}px)`,
											display: "flex",
											gap: 20,
											alignItems: "flex-start",
										}}
									>
										<span
											style={{
												color: COLORS.magenta,
												fontWeight: 700,
												lineHeight: 1.4,
											}}
										>
											›
										</span>
										<span>{bullet}</span>
									</li>
								);
							})}
						</ul>
					) : null}
				</div>

				<div style={{ height: 6 }} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const ClosingScene: React.FC<{
	cta: string;
	brandName: string;
	repo?: { owner: string; name: string };
}> = ({ cta, brandName, repo }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
	const opacity = interpolate(enter, [0, 1], [0, 1]);
	const scale = interpolate(enter, [0, 1], [0.96, 1]);

	return (
		<AbsoluteFill>
			<Backdrop />
			<AbsoluteFill
				style={{
					padding: 80,
					alignItems: "center",
					justifyContent: "center",
					textAlign: "center",
				}}
			>
				<div
					style={{
						opacity,
						transform: `scale(${scale})`,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 32,
					}}
				>
					<Wordmark name={brandName} />
					{repo ? (
						<div
							style={{
								fontFamily: FONT_MONO,
								fontSize: 26,
								color: COLORS.textMuted,
								letterSpacing: "0.04em",
							}}
						>
							{repo.owner}/{repo.name}
						</div>
					) : null}
					<div
						style={{
							fontFamily: FONT_BODY,
							fontSize: 72,
							fontWeight: 700,
							color: COLORS.text,
							lineHeight: 1.1,
							letterSpacing: "-0.02em",
							maxWidth: 880,
						}}
					>
						{cta}
					</div>
					<div
						style={{
							marginTop: 24,
							padding: "16px 28px",
							border: `1px solid ${COLORS.magenta}`,
							borderRadius: 999,
							fontFamily: FONT_MONO,
							fontSize: 22,
							color: COLORS.magenta,
							letterSpacing: "0.16em",
							textTransform: "uppercase",
						}}
					>
						Generated by Content Factory
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const ScriptVideo: React.FC<ScriptVideoProps> = ({
	script,
	brand,
	repo,
}) => {
	const hookFrames = Math.round(HOOK_SECONDS * FPS);
	const closingFrames = Math.round(CLOSING_SECONDS * FPS);

	return (
		<AbsoluteFill style={{ background: COLORS.bg }}>
			<Series>
				<Series.Sequence durationInFrames={hookFrames}>
					<HookScene hook={script.hook} brandName={brand.name} />
				</Series.Sequence>
				{script.scenes.map((scene, i) => (
					<Series.Sequence
						key={`scene-${i}-${scene.text.slice(0, 12)}`}
						durationInFrames={Math.max(1, Math.round(scene.durationSec * FPS))}
					>
						<ContentScene
							text={scene.text}
							bullets={scene.bullets}
							index={i}
							total={script.scenes.length}
							brandName={brand.name}
						/>
					</Series.Sequence>
				))}
				<Series.Sequence durationInFrames={closingFrames}>
					<ClosingScene
						cta={script.closingCta}
						brandName={brand.name}
						repo={repo}
					/>
				</Series.Sequence>
			</Series>
		</AbsoluteFill>
	);
};

export const computeScriptVideoDuration = (props: ScriptVideoProps): number => {
	const sceneFrames = props.script.scenes.reduce(
		(acc, s) => acc + Math.max(1, Math.round(s.durationSec * FPS)),
		0,
	);
	return (
		Math.round(HOOK_SECONDS * FPS) +
		sceneFrames +
		Math.round(CLOSING_SECONDS * FPS)
	);
};

export const scriptVideoDefaultProps: ScriptVideoProps = {
	brand: {
		name: "Demo Brand",
		tone: {
			formalCasual: 60,
			seriousPlayful: 55,
			directStorytelling: 45,
		},
	},
	repo: {
		owner: "honojs",
		name: "hono",
	},
	script: {
		hook: "Build APIs at the edge — without the bloat.",
		scenes: [
			{
				text: "Hono is a tiny web framework for the edge.",
				bullets: ["Runs on Workers, Deno, Bun, Node", "~14kB core, zero deps"],
				durationSec: 6,
			},
			{
				text: "Routing that feels familiar — Express-style, fully typed.",
				bullets: ["Type-safe params", "RPC client out of the box"],
				durationSec: 6,
			},
			{
				text: "Middleware for the things you actually need.",
				bullets: ["JWT, CORS, ETag, JSX", "First-class streaming"],
				durationSec: 6,
			},
			{
				text: "Production-ready. Ship anywhere JS runs.",
				durationSec: 5,
			},
		],
		closingCta: "Try Hono in your next project.",
	},
};
