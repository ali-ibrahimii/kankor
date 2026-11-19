"use client";

import {
	type MouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { ClassValue } from "tailwind-variants";
import { copyTextToClipboard } from "@/lib/code-highlight";
import { markdownToHTML } from "@/lib/markdown-to-html";
import { cn } from "@/lib/utils";

type Props = {
	markdown: string;
	className?: ClassValue;
};

/**
 * Renders sanitized markdown (headings, lists, tables, callouts, typed
 * syntax-highlighted code blocks, and plain-text / project-tree blocks) with
 * the typography plugin and delegated one-click copy buttons.
 *
 * Note: no `whitespace-pre-line` here — the markdown pipeline already produces
 * block elements, and pre-line would render newlines between them as extra
 * blank lines.
 */
export function MDXView({ markdown, className }: Props) {
	const [html, setHtml] = useState<string | null>(null);
	const timersRef = useRef<Map<HTMLButtonElement, number>>(new Map());

	useEffect(() => {
		let alive = true;
		markdownToHTML(markdown).then((file) => {
			if (alive) setHtml(String(file));
		});
		return () => {
			alive = false;
		};
	}, [markdown]);

	useEffect(() => {
		const timers = timersRef.current;
		return () => {
			for (const id of timers.values()) {
				window.clearTimeout(id);
			}
			timers.clear();
		};
	}, []);

	const handleClick = useCallback(async (event: MouseEvent<HTMLDivElement>) => {
		const target = event.target as Element | null;
		const copyBtn = target?.closest?.(
			"button[data-copy-code]"
		) as HTMLButtonElement | null;
		if (!copyBtn) return;

		event.preventDefault();
		const card = copyBtn.closest(".code-block");
		const codeEl = card?.querySelector("pre > code");
		const raw = codeEl?.textContent ?? "";

		const copied = await copyTextToClipboard(raw);
		if (!copied) return;

		copyBtn.setAttribute("data-copied", "true");
		const existing = timersRef.current.get(copyBtn);
		if (existing !== undefined) {
			window.clearTimeout(existing);
		}
		const timerId = window.setTimeout(() => {
			copyBtn.removeAttribute("data-copied");
			timersRef.current.delete(copyBtn);
		}, 1800);
		timersRef.current.set(copyBtn, timerId);
	}, []);

	if (html === null) {
		return (
			<div
				className={cn("prose max-w-none dark:prose-invert", className)}
				aria-hidden="true"
			>
				<div className="space-y-2">
					<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
					<div className="h-4 w-full animate-pulse rounded bg-muted" />
					<div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
				</div>
			</div>
		);
	}

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: delegated click activates native <button data-copy-code> elements which already trigger click on Enter/Space
		// biome-ignore lint/a11y/noStaticElementInteractions: delegated click listener for native <button> children inside sanitized HTML
		<div
			onClick={handleClick}
			className={cn("prose max-w-none dark:prose-invert", className)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: markdownToHTML sanitizes the markdown before wrapping code blocks
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
