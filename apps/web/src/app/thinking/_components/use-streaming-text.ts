"use client";

import { useEffect, useState } from "react";

// Typewriter that reveals `full` one character at a time.
// charDelay is the base ms-per-char; whitespace runs ~40% faster.
export function useStreamingText(
	full: string,
	opts: { charDelay?: number; startDelay?: number; enabled?: boolean } = {},
): { text: string; done: boolean } {
	const { charDelay = 32, startDelay = 600, enabled = true } = opts;
	const [text, setText] = useState("");
	const [done, setDone] = useState(false);

	useEffect(() => {
		if (!enabled) {
			setText("");
			setDone(false);
			return;
		}
		let cancelled = false;
		let i = 0;
		let timer: ReturnType<typeof setTimeout> | null = null;
		const tick = () => {
			if (cancelled) return;
			if (i >= full.length) {
				setDone(true);
				return;
			}
			const ch = full[i] ?? "";
			i += 1;
			setText(full.slice(0, i));
			const jitter = Math.random() * 18 - 6;
			const next = ch === " " ? charDelay * 0.6 : charDelay + jitter;
			timer = setTimeout(tick, next);
		};
		const start = setTimeout(tick, startDelay);
		return () => {
			cancelled = true;
			clearTimeout(start);
			if (timer) clearTimeout(timer);
		};
	}, [full, charDelay, startDelay, enabled]);

	return { text, done };
}
