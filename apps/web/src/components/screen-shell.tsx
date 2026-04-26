import type { ReactNode } from "react";

import { Header } from "./header";

type Props = {
	children: ReactNode;
	sidebar?: ReactNode;
	right?: ReactNode;
	topStrip?: ReactNode;
	header?: ReactNode;
};

export function ScreenShell({
	children,
	sidebar,
	right,
	topStrip,
	header,
}: Props) {
	const hasColumns = sidebar !== undefined && right !== undefined;

	return (
		<div className="mx-auto flex min-h-[1024px] w-[1440px] flex-col">
			{header === undefined ? <Header /> : header}
			{topStrip}
			{hasColumns ? (
				<div className="grid flex-1 grid-cols-[240px_1fr_320px]">
					{sidebar}
					{children}
					{right}
				</div>
			) : (
				children
			)}
		</div>
	);
}

export default ScreenShell;
