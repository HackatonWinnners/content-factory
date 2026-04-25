import type { ReactNode } from "react";

import { Header } from "./header";

type Props = {
	children: ReactNode;
	sidebar?: ReactNode;
	right?: ReactNode;
	topStrip?: ReactNode;
};

export function ScreenShell({ children, sidebar, right, topStrip }: Props) {
	const hasColumns = sidebar !== undefined && right !== undefined;

	return (
		<div className="mx-auto flex min-h-[1024px] w-[1440px] flex-col">
			<Header />
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
