import { Composition } from "remotion";
import { HelloWorld, helloWorldSchema } from "./compositions/hello-world";

export const RemotionRoot: React.FC = () => {
	return (
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
	);
};
