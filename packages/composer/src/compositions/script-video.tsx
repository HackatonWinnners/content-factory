import {
	AbsoluteFill,
	Audio,
	interpolate,
	random,
	Series,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { z } from "zod";

const FPS = 30;
const HOOK_PADDING_SEC = 0.6;
const SCENE_PADDING_SEC = 0.4;
const CTA_PADDING_SEC = 1.2;

// ──────────────────────────────────────────────────────────────────────────────
// Schema
// ──────────────────────────────────────────────────────────────────────────────

const sceneTypeEnum = z.enum([
	"stat",
	"fact",
	"feature",
	"comparison",
	"quote",
]);

const sceneSchema = z.object({
	type: sceneTypeEnum,
	text: z.string().min(1).max(240),
	voiceover: z.string().min(1).max(800),
	stat: z
		.object({
			value: z.string().min(1).max(60),
			label: z.string().min(1).max(120),
		})
		.optional(),
	bullets: z.array(z.string().min(1).max(160)).max(6).optional(),
	comparison: z
		.object({
			them: z.string().min(1).max(200),
			us: z.string().min(1).max(200),
		})
		.optional(),
});

const scriptSchema = z.object({
	hook: z.object({ text: z.string().min(1).max(200), voiceover: z.string() }),
	scenes: z.array(sceneSchema).min(3).max(8),
	cta: z.object({ text: z.string().min(1).max(160), voiceover: z.string() }),
});

const brandSchema = z.object({
	name: z.string().min(1),
	tone: z.object({
		formalCasual: z.number().min(0).max(100),
		seriousPlayful: z.number().min(0).max(100),
		directStorytelling: z.number().min(0).max(100),
	}),
});

const voiceAssetSchema = z.object({
	audioPath: z.string().min(1),
	durationSec: z.number().min(0.1),
});

const assetsSchema = z.object({
	hook: voiceAssetSchema,
	scenes: z.array(voiceAssetSchema),
	cta: voiceAssetSchema,
	musicPath: z.string().optional(),
});

export const scriptVideoSchema = z.object({
	script: scriptSchema,
	brand: brandSchema,
	assets: assetsSchema,
	repo: z
		.object({
			owner: z.string(),
			name: z.string(),
			stars: z.number().int().nonnegative().optional(),
			primaryLanguage: z.string().optional(),
		})
		.optional(),
});

export type ScriptVideoProps = z.infer<typeof scriptVideoSchema>;
type Scene = z.infer<typeof sceneSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Visual constants
// ──────────────────────────────────────────────────────────────────────────────

const COLORS = {
	bg: "#0A0A0B",
	elev: "#111113",
	text: "#ECECEE",
	textMuted: "#8A8A93",
	textDim: "#5C5C66",
	magenta: "#E5267C",
	magentaSoft: "rgba(229, 38, 124, 0.18)",
	magentaGlow: "rgba(229, 38, 124, 0.35)",
	border: "rgba(255,255,255,0.08)",
};

const FONT_BODY = "Inter, system-ui, -apple-system, sans-serif";
const FONT_MONO = "JetBrains Mono, ui-monospace, monospace";

// ──────────────────────────────────────────────────────────────────────────────
// Backgrounds — one per scene type, all driven by useCurrentFrame
// ──────────────────────────────────────────────────────────────────────────────

const HookBackground: React.FC = () => {
	const frame = useCurrentFrame();
	const pulse = (Math.sin(frame * 0.08) + 1) / 2; // 0..1
	const glowOpacity = interpolate(pulse, [0, 1], [0.18, 0.42]);

	return (
		<AbsoluteFill style={{ background: COLORS.bg }}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 50% 30%, rgba(229,38,124,${glowOpacity}) 0%, transparent 55%)`,
				}}
			/>
			{/* Floating particles */}
			{Array.from({ length: 24 }).map((_, i) => {
				const seed = random(`hook-particle-${i}`);
				const x = seed * 1080;
				const baseY = random(`hook-y-${i}`) * 1920;
				const speed = 0.4 + random(`hook-spd-${i}`) * 0.8;
				const y = (baseY + frame * speed) % 1920;
				const size = 2 + random(`hook-size-${i}`) * 3;
				return (
					<div
						key={`hook-p-${i}`}
						style={{
							position: "absolute",
							left: x,
							top: y,
							width: size,
							height: size,
							borderRadius: "50%",
							background: COLORS.magenta,
							opacity: 0.45,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

const StatBackground: React.FC = () => {
	const frame = useCurrentFrame();
	const drift = frame * 0.6;
	return (
		<AbsoluteFill style={{ background: COLORS.bg }}>
			{/* Concentric rings spreading out */}
			{Array.from({ length: 4 }).map((_, i) => {
				const phase = (frame + i * 22) % 90;
				const scale = phase / 90;
				const opacity = (1 - scale) * 0.5;
				return (
					<div
						key={`ring-${i}`}
						style={{
							position: "absolute",
							left: "50%",
							top: "40%",
							width: 200 + scale * 1400,
							height: 200 + scale * 1400,
							marginLeft: -(100 + scale * 700),
							marginTop: -(100 + scale * 700),
							borderRadius: "50%",
							border: `2px solid rgba(229,38,124,${opacity})`,
						}}
					/>
				);
			})}
			{/* Subtle grid drift */}
			<AbsoluteFill
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
					backgroundSize: "80px 80px",
					backgroundPosition: `0 ${drift}px, ${drift}px 0`,
				}}
			/>
		</AbsoluteFill>
	);
};

const FeatureBackground: React.FC = () => {
	const frame = useCurrentFrame();
	const shift = (frame * 0.3) % 360;
	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(${shift}deg, ${COLORS.bg} 40%, rgba(229,38,124,0.10) 100%)`,
			}}
		/>
	);
};

const ComparisonBackground: React.FC = () => (
	<AbsoluteFill style={{ background: COLORS.bg }}>
		<div
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				width: "50%",
				height: "100%",
				background:
					"linear-gradient(135deg, rgba(255,255,255,0.02), transparent)",
			}}
		/>
		<div
			style={{
				position: "absolute",
				right: 0,
				top: 0,
				width: "50%",
				height: "100%",
				background:
					"linear-gradient(225deg, rgba(229,38,124,0.10), transparent)",
			}}
		/>
		<div
			style={{
				position: "absolute",
				left: "50%",
				top: 0,
				bottom: 0,
				width: 2,
				background: COLORS.magenta,
				transform: "translateX(-1px)",
			}}
		/>
	</AbsoluteFill>
);

const QuoteBackground: React.FC = () => {
	const frame = useCurrentFrame();
	const wave = Math.sin(frame * 0.04) * 30;
	return (
		<AbsoluteFill style={{ background: COLORS.bg }}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse at ${50 + wave}% 50%, rgba(229,38,124,0.12) 0%, transparent 60%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

const CtaBackground: React.FC = () => {
	const frame = useCurrentFrame();
	const glow = interpolate(frame, [0, 40], [0.1, 0.45], {
		extrapolateRight: "clamp",
	});
	return (
		<AbsoluteFill style={{ background: COLORS.bg }}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 50% 60%, rgba(229,38,124,${glow}) 0%, transparent 55%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Reusable bits
// ──────────────────────────────────────────────────────────────────────────────

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

const SceneCounter: React.FC<{ index: number; total: number }> = ({
	index,
	total,
}) => (
	<div
		style={{
			fontFamily: FONT_MONO,
			fontSize: 18,
			color: COLORS.textMuted,
			letterSpacing: "0.12em",
		}}
	>
		{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
	</div>
);

// Word-by-word karaoke captions sliced from voiceover narration.
const KaraokeCaption: React.FC<{
	text: string;
	durationSec: number;
}> = ({ text, durationSec }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const totalFrames = durationSec * fps;
	const words = text.split(/\s+/).filter(Boolean);
	if (words.length === 0) return null;
	const charsPerWord = words.map((w) => w.length + 1);
	const totalChars = charsPerWord.reduce((a, b) => a + b, 0);
	const elapsed = frame / totalFrames;

	// Determine which word is currently active.
	let cumulative = 0;
	let activeIdx = 0;
	for (let i = 0; i < words.length; i++) {
		const next = cumulative + (charsPerWord[i] ?? 0) / totalChars;
		if (elapsed >= cumulative && elapsed < next) {
			activeIdx = i;
			break;
		}
		cumulative = next;
		if (i === words.length - 1) activeIdx = i;
	}

	// Show ~5 words around the active one.
	const windowSize = 5;
	const start = Math.max(0, activeIdx - 2);
	const visible = words.slice(start, start + windowSize);

	return (
		<div
			style={{
				position: "absolute",
				left: 0,
				right: 0,
				bottom: 140,
				display: "flex",
				justifyContent: "center",
				gap: 12,
				flexWrap: "wrap",
				padding: "0 60px",
			}}
		>
			{visible.map((w, i) => {
				const realIdx = start + i;
				const isActive = realIdx === activeIdx;
				return (
					<span
						key={`${realIdx}-${w}`}
						style={{
							fontFamily: FONT_BODY,
							fontSize: 36,
							fontWeight: 700,
							color: isActive ? COLORS.magenta : COLORS.text,
							textShadow: "0 2px 8px rgba(0,0,0,0.6)",
							letterSpacing: "-0.01em",
							transform: isActive ? "scale(1.08)" : "scale(1)",
							transition: "transform 80ms",
						}}
					>
						{w}
					</span>
				);
			})}
		</div>
	);
};

// CountUp animated number for stat scenes.
const CountUp: React.FC<{ raw: string; durationFrames: number }> = ({
	raw,
	durationFrames,
}) => {
	const frame = useCurrentFrame();
	// Try to extract a numeric prefix + suffix (e.g. "47k" → 47, "k").
	const match = raw.match(/^([\d,.]+)\s*(.*)$/);
	if (!match) {
		return <>{raw}</>;
	}
	const numStr = match[1] ?? "0";
	const suffix = match[2] ?? "";
	const target = Number.parseFloat(numStr.replace(/,/g, ""));
	if (Number.isNaN(target)) return <>{raw}</>;
	const t = Math.min(1, frame / Math.max(1, durationFrames * 0.7));
	const eased = 1 - (1 - t) ** 3;
	const current = target * eased;
	const display =
		target >= 100
			? Math.round(current).toLocaleString()
			: current.toFixed(target % 1 === 0 ? 0 : 1);
	return (
		<>
			{display}
			{suffix ? <span style={{ marginLeft: 8 }}>{suffix}</span> : null}
		</>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Scene components
// ──────────────────────────────────────────────────────────────────────────────

const HookScene: React.FC<{
	hookText: string;
	voiceover: string;
	durationSec: number;
	brandName: string;
	stars?: number;
	primaryLanguage?: string;
	audioPath: string;
}> = ({
	hookText,
	voiceover,
	durationSec,
	brandName,
	stars,
	primaryLanguage,
	audioPath,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
	const opacity = interpolate(enter, [0, 1], [0, 1]);
	const translateY = interpolate(enter, [0, 1], [40, 0]);

	return (
		<AbsoluteFill>
			<HookBackground />
			<Audio src={resolveAsset(audioPath)} />
			<AbsoluteFill style={{ padding: 80, justifyContent: "space-between" }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Wordmark name={brandName} />
					{primaryLanguage ? (
						<div
							style={{
								fontFamily: FONT_MONO,
								fontSize: 18,
								color: COLORS.textMuted,
								letterSpacing: "0.12em",
								padding: "6px 14px",
								border: `1px solid ${COLORS.border}`,
								borderRadius: 999,
							}}
						>
							{primaryLanguage}
						</div>
					) : null}
				</div>

				<div
					style={{
						opacity,
						transform: `translateY(${translateY}px)`,
					}}
				>
					{stars && stars > 0 ? (
						<div
							style={{
								fontFamily: FONT_BODY,
								fontSize: 220,
								fontWeight: 700,
								lineHeight: 1,
								color: COLORS.magenta,
								letterSpacing: "-0.04em",
								marginBottom: 16,
							}}
						>
							<CountUp
								raw={formatStars(stars)}
								durationFrames={durationSec * fps}
							/>
						</div>
					) : null}
					{stars && stars > 0 ? (
						<div
							style={{
								fontFamily: FONT_MONO,
								fontSize: 22,
								color: COLORS.textMuted,
								textTransform: "uppercase",
								letterSpacing: "0.18em",
								marginBottom: 32,
							}}
						>
							GitHub stars
						</div>
					) : null}
					<h1
						style={{
							fontFamily: FONT_BODY,
							fontSize: 92,
							fontWeight: 700,
							lineHeight: 1.05,
							letterSpacing: "-0.02em",
							color: COLORS.text,
							margin: 0,
						}}
					>
						{hookText}
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
			<KaraokeCaption text={voiceover} durationSec={durationSec} />
		</AbsoluteFill>
	);
};

// Each content scene picks a layout per type.
const ContentScene: React.FC<{
	scene: Scene;
	index: number;
	total: number;
	durationSec: number;
	brandName: string;
	audioPath: string;
}> = ({ scene, index, total, durationSec, brandName, audioPath }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = spring({ frame, fps, config: { damping: 20, stiffness: 110 } });
	const opacity = interpolate(enter, [0, 1], [0, 1]);
	const translateY = interpolate(enter, [0, 1], [32, 0]);

	const Background = pickBackground(scene.type);

	return (
		<AbsoluteFill>
			<Background />
			<Audio src={resolveAsset(audioPath)} />
			<AbsoluteFill style={{ padding: 80, justifyContent: "space-between" }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Wordmark name={brandName} />
					<SceneCounter index={index} total={total} />
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
					{renderSceneBody(scene, durationSec * fps)}
				</div>

				<div style={{ height: 6 }} />
			</AbsoluteFill>
			<KaraokeCaption text={scene.voiceover} durationSec={durationSec} />
		</AbsoluteFill>
	);
};

function pickBackground(type: Scene["type"]): React.FC {
	switch (type) {
		case "stat":
			return StatBackground;
		case "feature":
			return FeatureBackground;
		case "comparison":
			return ComparisonBackground;
		case "quote":
			return QuoteBackground;
		default:
			return HookBackground;
	}
}

function renderSceneBody(
	scene: Scene,
	durationFrames: number,
): React.ReactNode {
	if (scene.type === "stat" && scene.stat) {
		return (
			<div>
				<div
					style={{
						fontFamily: FONT_BODY,
						fontSize: 280,
						fontWeight: 700,
						lineHeight: 1,
						color: COLORS.magenta,
						letterSpacing: "-0.04em",
						marginBottom: 12,
					}}
				>
					<CountUp raw={scene.stat.value} durationFrames={durationFrames} />
				</div>
				<div
					style={{
						fontFamily: FONT_MONO,
						fontSize: 28,
						color: COLORS.textMuted,
						textTransform: "uppercase",
						letterSpacing: "0.16em",
					}}
				>
					{scene.stat.label}
				</div>
			</div>
		);
	}

	if (scene.type === "comparison" && scene.comparison) {
		return (
			<div style={{ display: "flex", gap: 36, flexDirection: "column" }}>
				<div
					style={{
						fontFamily: FONT_BODY,
						fontSize: 60,
						fontWeight: 600,
						color: COLORS.text,
						letterSpacing: "-0.02em",
					}}
				>
					{scene.text}
				</div>
				<div
					style={{
						display: "flex",
						gap: 32,
						alignItems: "stretch",
					}}
				>
					<div
						style={{
							flex: 1,
							padding: 28,
							border: `1px solid ${COLORS.border}`,
							borderRadius: 12,
							background: "rgba(255,255,255,0.02)",
						}}
					>
						<div
							style={{
								fontFamily: FONT_MONO,
								fontSize: 18,
								color: COLORS.textDim,
								textTransform: "uppercase",
								letterSpacing: "0.16em",
								marginBottom: 16,
							}}
						>
							Them
						</div>
						<div
							style={{
								fontFamily: FONT_BODY,
								fontSize: 32,
								color: COLORS.textMuted,
								lineHeight: 1.3,
							}}
						>
							{scene.comparison.them}
						</div>
					</div>
					<div
						style={{
							flex: 1,
							padding: 28,
							border: `1px solid ${COLORS.magenta}`,
							borderRadius: 12,
							background: COLORS.magentaSoft,
						}}
					>
						<div
							style={{
								fontFamily: FONT_MONO,
								fontSize: 18,
								color: COLORS.magenta,
								textTransform: "uppercase",
								letterSpacing: "0.16em",
								marginBottom: 16,
							}}
						>
							Us
						</div>
						<div
							style={{
								fontFamily: FONT_BODY,
								fontSize: 34,
								color: COLORS.text,
								lineHeight: 1.3,
								fontWeight: 600,
							}}
						>
							{scene.comparison.us}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (scene.type === "quote") {
		return (
			<div>
				<div
					style={{
						fontFamily: FONT_BODY,
						fontSize: 96,
						fontWeight: 700,
						color: COLORS.magenta,
						lineHeight: 1.05,
						marginBottom: 12,
					}}
				>
					“
				</div>
				<div
					style={{
						fontFamily: FONT_BODY,
						fontSize: 64,
						fontWeight: 600,
						lineHeight: 1.2,
						letterSpacing: "-0.02em",
						color: COLORS.text,
					}}
				>
					{scene.text}
				</div>
			</div>
		);
	}

	// feature / fact — same body style with optional bullets
	return (
		<div>
			<div
				style={{
					fontFamily: FONT_BODY,
					fontSize: 76,
					fontWeight: 600,
					lineHeight: 1.12,
					letterSpacing: "-0.02em",
					color: COLORS.text,
				}}
			>
				{scene.text}
			</div>
			{scene.bullets && scene.bullets.length > 0 ? (
				<ul
					style={{
						marginTop: 48,
						padding: 0,
						listStyle: "none",
						display: "flex",
						flexDirection: "column",
						gap: 20,
					}}
				>
					{scene.bullets.map((bullet, i) => (
						<li
							key={`${bullet}-${i}`}
							style={{
								fontFamily: FONT_MONO,
								fontSize: 30,
								lineHeight: 1.4,
								color: COLORS.text,
								display: "flex",
								gap: 18,
								alignItems: "flex-start",
							}}
						>
							<span style={{ color: COLORS.magenta, fontWeight: 700 }}>›</span>
							<span>{bullet}</span>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

const ClosingScene: React.FC<{
	cta: string;
	voiceover: string;
	durationSec: number;
	brandName: string;
	audioPath: string;
	repo?: { owner: string; name: string };
}> = ({ cta, voiceover, durationSec, brandName, audioPath, repo }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
	const opacity = interpolate(enter, [0, 1], [0, 1]);
	const scale = interpolate(enter, [0, 1], [0.96, 1]);

	return (
		<AbsoluteFill>
			<CtaBackground />
			<Audio src={resolveAsset(audioPath)} />
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
			<KaraokeCaption text={voiceover} durationSec={durationSec} />
		</AbsoluteFill>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Top-level composition
// ──────────────────────────────────────────────────────────────────────────────

export const ScriptVideo: React.FC<ScriptVideoProps> = ({
	script,
	brand,
	assets,
	repo,
}) => {
	const hookDur = assets.hook.durationSec + HOOK_PADDING_SEC;
	const sceneDurations = script.scenes.map((_, i) => {
		const a = assets.scenes[i];
		return (a ? a.durationSec : 4) + SCENE_PADDING_SEC;
	});
	const ctaDur = assets.cta.durationSec + CTA_PADDING_SEC;

	return (
		<AbsoluteFill style={{ background: COLORS.bg }}>
			{assets.musicPath ? (
				<Audio src={resolveAsset(assets.musicPath)} volume={0.12} loop />
			) : null}
			<Series>
				<Series.Sequence durationInFrames={Math.ceil(hookDur * FPS)}>
					<HookScene
						hookText={script.hook.text}
						voiceover={script.hook.voiceover}
						durationSec={hookDur}
						brandName={brand.name}
						stars={repo?.stars}
						primaryLanguage={repo?.primaryLanguage}
						audioPath={assets.hook.audioPath}
					/>
				</Series.Sequence>
				{script.scenes.map((scene, i) => {
					const dur = sceneDurations[i] ?? 4;
					const audioPath =
						assets.scenes[i]?.audioPath ?? assets.hook.audioPath;
					return (
						<Series.Sequence
							key={`scene-${i}-${scene.text.slice(0, 12)}`}
							durationInFrames={Math.max(1, Math.ceil(dur * FPS))}
						>
							<ContentScene
								scene={scene}
								index={i}
								total={script.scenes.length}
								durationSec={dur}
								brandName={brand.name}
								audioPath={audioPath}
							/>
						</Series.Sequence>
					);
				})}
				<Series.Sequence durationInFrames={Math.ceil(ctaDur * FPS)}>
					<ClosingScene
						cta={script.cta.text}
						voiceover={script.cta.voiceover}
						durationSec={ctaDur}
						brandName={brand.name}
						audioPath={assets.cta.audioPath}
						repo={repo}
					/>
				</Series.Sequence>
			</Series>
		</AbsoluteFill>
	);
};

export const computeScriptVideoDuration = (props: ScriptVideoProps): number => {
	const hookFrames = Math.ceil(
		(props.assets.hook.durationSec + HOOK_PADDING_SEC) * FPS,
	);
	const sceneFrames = props.script.scenes.reduce((acc, _, i) => {
		const a = props.assets.scenes[i];
		const sec = (a ? a.durationSec : 4) + SCENE_PADDING_SEC;
		return acc + Math.ceil(sec * FPS);
	}, 0);
	const ctaFrames = Math.ceil(
		(props.assets.cta.durationSec + CTA_PADDING_SEC) * FPS,
	);
	return hookFrames + sceneFrames + ctaFrames;
};

// Resolve an asset path. Server passes paths relative to public/ (e.g.
// "jobs/abc/hook.wav", "music/lofi.mp3"). Wrap with staticFile() so Remotion
// resolves them against the bundle's serveUrl. If a path is already absolute
// (http://, file://, /), pass it through untouched.
function resolveAsset(p: string): string {
	if (/^(https?:|file:|data:|\/)/.test(p)) return p;
	return staticFile(p);
}

// Map brand tone → music track filename in public/music/.
export function pickMusicTrack(tone: {
	formalCasual: number;
	seriousPlayful: number;
	directStorytelling: number;
}): string {
	if (tone.formalCasual >= 65 && tone.seriousPlayful >= 60) return "upbeat.mp3";
	if (tone.formalCasual <= 35 && tone.seriousPlayful <= 40)
		return "cinematic.mp3";
	if (tone.directStorytelling >= 65) return "ambient.mp3";
	return "lofi.mp3";
}

function formatStars(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
	return String(n);
}

// Default props — ensures Remotion Studio + selectComposition can resolve the
// composition even with no real job. Uses placeholder audio paths under
// public/sample/ that may not exist; Studio will warn but render still works
// with real inputProps in production renderMedia calls.
export const scriptVideoDefaultProps: ScriptVideoProps = {
	brand: {
		name: "Demo Brand",
		tone: { formalCasual: 60, seriousPlayful: 55, directStorytelling: 45 },
	},
	repo: {
		owner: "honojs",
		name: "hono",
		stars: 47000,
		primaryLanguage: "TypeScript",
	},
	assets: {
		hook: { audioPath: "sample/hook.wav", durationSec: 3 },
		scenes: [
			{ audioPath: "sample/scene-0.wav", durationSec: 4 },
			{ audioPath: "sample/scene-1.wav", durationSec: 4 },
			{ audioPath: "sample/scene-2.wav", durationSec: 4 },
			{ audioPath: "sample/scene-3.wav", durationSec: 4 },
		],
		cta: { audioPath: "sample/cta.wav", durationSec: 3 },
		musicPath: "music/lofi.mp3",
	},
	script: {
		hook: {
			text: "47k stars. Why?",
			voiceover:
				"Forty-seven thousand developers starred this repo. Here is what makes it different.",
		},
		scenes: [
			{
				type: "stat",
				text: "14kB",
				voiceover: "The entire framework is fourteen kilobytes.",
				stat: { value: "14kB", label: "core, zero dependencies" },
			},
			{
				type: "feature",
				text: "Runs anywhere JS runs.",
				voiceover:
					"One codebase, four runtimes. Workers, Deno, Bun, Node. Write once, deploy anywhere.",
				bullets: ["Cloudflare Workers", "Bun", "Deno"],
			},
			{
				type: "comparison",
				text: "Express vs Hono",
				voiceover:
					"Express ships forty-five megabytes. Hono ships fourteen kilobytes. Same ergonomics.",
				comparison: {
					them: "Express · 45 MB · 350ms cold start",
					us: "Hono · 14 kB · 4ms cold start",
				},
			},
			{
				type: "quote",
				text: "Type-safe by default.",
				voiceover:
					"Every route is fully typed end to end. No code generation. No runtime overhead.",
			},
		],
		cta: {
			text: "Try Hono today.",
			voiceover: "Run npm install hono and you have an API in five lines.",
		},
	},
};
