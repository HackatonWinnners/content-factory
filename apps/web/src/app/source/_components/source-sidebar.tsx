"use client";

import { useEffect, useState } from "react";

import {
	loadRecentProjects,
	type RecentProject,
	relativeTime,
} from "@/lib/recent-projects";

import { GithubIcon, LinearIcon, PdfIcon, SettingsIcon } from "./source-icons";

export function SourceSidebar({ activeKey }: { activeKey?: string | null }) {
	const [projects, setProjects] = useState<RecentProject[]>([]);

	useEffect(() => {
		setProjects(loadRecentProjects());
	}, []);

	return (
		<aside className="flex min-h-[calc(1024px-56px)] w-[240px] flex-col border-[var(--color-border)] border-r p-4">
			<button
				type="button"
				className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border-none bg-[var(--color-magenta)] font-medium text-[13px] text-white transition-[background-color,transform] duration-[120ms] hover:bg-[#ED2F86] active:translate-y-[1px]"
			>
				<span className="font-medium text-[14px] leading-none">+</span>
				<span>New project</span>
			</button>

			<div className="mono mx-1 mt-6 mb-2 font-medium text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.08em]">
				Recent projects
			</div>
			<div className="flex flex-col gap-0.5">
				{projects.length === 0 ? (
					<div className="px-2 py-3 text-[12px] text-[var(--color-text-dim)] leading-[1.4]">
						Nothing yet. Submit a repo to see it pinned here.
					</div>
				) : null}
				{projects.map((p, i) => {
					const key = `${p.owner}/${p.name}`;
					const active = activeKey === key;
					return (
						<div
							key={key}
							className={`relative flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-md p-2 transition-colors duration-[120ms] ${
								active
									? "bg-[var(--color-elev-2)]"
									: "hover:bg-[rgba(255,255,255,0.025)]"
							}`}
						>
							{active ? (
								<span
									aria-hidden="true"
									className="absolute top-[6px] bottom-[6px] left-[-16px] w-[2px] rounded-r-[2px] bg-[var(--color-magenta)]"
								/>
							) : null}
							<Thumb i={i} />
							<div className="min-w-0 flex-1">
								<div className="mono truncate font-medium text-[13px] text-[var(--color-text)] leading-[1.3]">
									{p.name}
								</div>
								<div className="mt-[3px] flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
									<SourceIcon source={p.source} />
									<span className="mono text-[11px] text-[var(--color-text-dim)]">
										{relativeTime(p.createdAt)}
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-auto border-[rgba(255,255,255,0.06)] border-t pt-3">
				<button
					type="button"
					className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border-none bg-transparent p-2 text-[13px] text-[var(--color-text-muted)] transition-colors duration-[120ms] hover:bg-[rgba(255,255,255,0.025)] hover:text-[var(--color-text)]"
				>
					<SettingsIcon />
					<span>Settings</span>
				</button>
			</div>
		</aside>
	);
}

// Tiny abstract thumbnail — deterministic by index.
function Thumb({ i }: { i: number }) {
	const palettes: [string, string][] = [
		["#1F2A2E", "#2A3F44"],
		["#241F2E", "#3A2F49"],
		["#2E1F26", "#49303B"],
		["#1F2E29", "#2F4940"],
		["#2E281F", "#494030"],
		["#1F232E", "#303949"],
	];
	const [a, b] = palettes[i % palettes.length] ?? ["#1F232E", "#303949"];
	return (
		<div
			className="relative h-[24px] w-[40px] shrink-0 overflow-hidden rounded-[3px] border border-[var(--color-border)]"
			style={{ background: "#1A1A1F" }}
		>
			<svg
				viewBox="0 0 40 24"
				preserveAspectRatio="none"
				className="block h-full w-full"
				aria-hidden="true"
			>
				<rect width="40" height="24" fill={a} />
				<rect x={4 + i * 3} y={4} width={16} height={2} fill={b} />
				<rect
					x={4 + i * 2}
					y={9}
					width={24}
					height={1.5}
					fill={b}
					opacity="0.7"
				/>
				<rect
					x={4}
					y={14}
					width={10 + i * 2}
					height={1.5}
					fill={b}
					opacity="0.5"
				/>
				<circle cx={34} cy={18} r={2} fill={b} opacity="0.8" />
			</svg>
		</div>
	);
}

function SourceIcon({ source }: { source: RecentProject["source"] }) {
	if (source === "github") return <GithubIcon size={11} />;
	if (source === "linear") return <LinearIcon size={11} />;
	return <PdfIcon size={11} />;
}
