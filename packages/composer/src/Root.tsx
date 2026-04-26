import { Composition } from "remotion";
import { HelloWorld, helloWorldSchema } from "./compositions/hello-world";
import {
	computeScriptVideoDuration,
	ScriptVideo,
	scriptVideoDefaultProps,
	scriptVideoSchema,
} from "./compositions/script-video";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="hello-world"
				component={HelloWorld}
				durationInFrames={150}
				fps={30}
				width={1080}
				height={1920}
				schema={helloWorldSchema}
				defaultProps={{ title: "Content Factory" }}
			/>
			<Composition
				id="script-video"
				component={ScriptVideo}
				schema={scriptVideoSchema}
				width={1080}
				height={1920}
				fps={30}
				durationInFrames={computeScriptVideoDuration(scriptVideoDefaultProps)}
				defaultProps={scriptVideoDefaultProps}
				calculateMetadata={({ props }) => ({
					durationInFrames: computeScriptVideoDuration(props),
				})}
			/>
		</>
	);
};
