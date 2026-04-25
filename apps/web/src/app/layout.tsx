import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

const inter = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
	title: "content-factory",
	description: "content-factory",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
				style={{
					fontFeatureSettings: "'cv02','cv03','cv04','cv11'",
				}}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
