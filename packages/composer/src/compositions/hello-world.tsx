import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";

export const helloWorldSchema = z.object({
	title: z.string(),
});

export type HelloWorldProps = z.infer<typeof helloWorldSchema>;

export const HelloWorld: React.FC<HelloWorldProps> = ({ title }) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 30], [0, 1], {
		extrapolateRight: "clamp",
	});
	const translateY = interpolate(frame, [0, 30], [40, 0], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor: "#0a0a0a",
				justifyContent: "center",
				alignItems: "center",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<h1
				style={{
					color: "white",
					fontSize: 96,
					fontWeight: 700,
					opacity,
					transform: `translateY(${translateY}px)`,
					margin: 0,
				}}
			>
				{title}
			</h1>
		</AbsoluteFill>
	);
};
