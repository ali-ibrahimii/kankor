"use client";

import { useEffect, useState } from "react";
import type { ClassValue } from "tailwind-variants";
import { markdownToHTML } from "@/lib/markdown-to-html";
import { cn } from "@/lib/utils";

type Props = {
	markdown: string;
	className?: ClassValue;
};

/**
 * Renders sanitized markdown (headings, lists, tables, callouts, code) with
 * the typography plugin. Note: no `whitespace-pre-line` here — the markdown
 * pipeline already produces block elements, and pre-line would render the
 * newlines between them as extra blank lines.
 */
export function MDXView({ markdown, className }: Props) {
	const [html, setHtml] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		markdownToHTML(markdown).then((file) => {
			if (alive) setHtml(String(file));
		});
		return () => {
			alive = false;
		};
	}, [markdown]);

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
		<div
			className={cn("prose max-w-none dark:prose-invert", className)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: markdownToHTML sanitizes the markdown
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
