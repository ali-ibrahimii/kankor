"use client";

import { useEffect, useState } from "react";
import type { ClassValue } from "tailwind-variants";
import { markdownToHTML } from "@/lib/markdown-to-html";
import { cn } from "@/lib/utils";

type Props = {
	markdown: string;
	className?: ClassValue;
};
export function MDXView({ markdown, className }: Props) {
	const [html, setHtml] = useState("Rendering...");

	useEffect(() => {
		markdownToHTML(markdown).then((html) => setHtml(String(html)));
	}, [markdown]);

	return (
		<div
			className={cn("prose whitespace-pre-line", className)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: markdownToHTML sanitizes the markdown
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
