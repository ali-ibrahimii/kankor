/**
 * rehype plugin: transforms sanitized `<pre><code>` blocks into rich code/text
 * cards with:
 *   1. A top header bar showing the block kind (`text` vs `code`), language
 *      label (e.g. `{} text`, `</> html`), and a one-click copy button.
 *   2. Safe AST-based Prism syntax highlighting for programming languages,
 *      while keeping `text` / folder-tree blocks crisp uncolored monospace.
 *   3. Forced LTR direction and `not-prose` isolation so code and box-drawing
 *      directory trees (`├──`, `└──`, `│`) align cleanly on RTL pages.
 *
 * Must run AFTER `rehype-sanitize` so user-supplied HTML can never spoof card
 * markup or inject arbitrary classes/buttons, while our generated token spans
 * and copy button pass straight through to `rehype-stringify`.
 */

import type Prism from "prismjs";
import { resolveCodeBlockMeta, tokenizeCode } from "./code-highlight";

type HastNode = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
};

function h(
	tagName: string,
	properties: Record<string, unknown>,
	children: HastNode[] = []
): HastNode {
	return { type: "element", tagName, properties, children };
}

function text(value: string): HastNode {
	return { type: "text", value };
}

function extractText(node: HastNode): string {
	if (node.type === "text") return node.value ?? "";
	if (!node.children) return "";
	return node.children.map(extractText).join("");
}

function extractLanguage(codeNode: HastNode): string | null {
	const raw = codeNode.properties?.className;
	const classes = Array.isArray(raw)
		? raw
		: typeof raw === "string"
			? raw.split(/\s+/)
			: [];
	for (const cls of classes) {
		if (typeof cls === "string" && cls.startsWith("language-")) {
			return cls.slice("language-".length);
		}
	}
	return null;
}

function prismTokensToHast(
	stream: string | Prism.Token | Array<string | Prism.Token>
): HastNode[] {
	if (typeof stream === "string") {
		return stream ? [text(stream)] : [];
	}
	if (Array.isArray(stream)) {
		const out: HastNode[] = [];
		for (const item of stream) {
			out.push(...prismTokensToHast(item));
		}
		return out;
	}

	const aliases = Array.isArray(stream.alias)
		? stream.alias
		: stream.alias
			? [stream.alias]
			: [];
	const className = ["token", stream.type, ...aliases];

	return [
		h(
			"span",
			{ className },
			prismTokensToHast(
				stream.content as string | Prism.Token | Array<string | Prism.Token>
			)
		),
	];
}

function buildCopyButton(kind: "text" | "code"): HastNode {
	const copySvg = h(
		"svg",
		{
			xmlns: "http://www.w3.org/2000/svg",
			width: "15",
			height: "15",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.8",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			className: ["code-block-icon-copy"],
			"aria-hidden": "true",
		},
		[
			h("rect", {
				width: "14",
				height: "14",
				x: "8",
				y: "8",
				rx: "2",
				ry: "2",
			}),
			h("path", {
				d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
			}),
		]
	);

	const checkSvg = h(
		"svg",
		{
			xmlns: "http://www.w3.org/2000/svg",
			width: "15",
			height: "15",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2.1",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			className: ["code-block-icon-check"],
			"aria-hidden": "true",
		},
		[h("path", { d: "M20 6 9 17l-5-5" })]
	);

	return h(
		"button",
		{
			type: "button",
			className: ["code-block-copy"],
			"data-copy-code": "",
			"aria-label": kind === "code" ? "Copy code" : "Copy text",
			title: kind === "code" ? "Copy code" : "Copy text",
		},
		[copySvg, checkSvg]
	);
}

export function buildCodeBlockCardNode(
	rawCode: string,
	rawLang?: string | null
): HastNode {
	// Strip the single trailing newline appended by markdown fenced blocks so
	// one-line snippets (`index.html`) stay compact and copy cleanly.
	const normalizedCode = rawCode.replace(/\r\n/g, "\n").replace(/\n$/, "");
	const meta = resolveCodeBlockMeta(rawLang);
	const tokens = tokenizeCode(normalizedCode, meta.language);
	const highlightedChildren = prismTokensToHast(tokens);

	const metaChildren: HastNode[] = [
		h("span", { className: ["code-block-glyph"], "aria-hidden": "true" }, [
			text(meta.kind === "text" ? "{}" : "</>"),
		]),
		h("span", { className: ["code-block-lang"] }, [text(meta.displayLabel)]),
	];

	if (meta.kind === "code" && meta.displayLabel !== "code") {
		metaChildren.push(
			h("span", { className: ["code-block-kind"] }, [text("code")])
		);
	}

	const header = h("div", { className: ["code-block-header"] }, [
		h("div", { className: ["code-block-meta"] }, metaChildren),
		buildCopyButton(meta.kind),
	]);

	const pre = h("pre", {}, [
		h(
			"code",
			{ className: [`language-${meta.language}`] },
			highlightedChildren
		),
	]);

	return h(
		"div",
		{
			className: ["code-block", "not-prose"],
			"data-code-kind": meta.kind,
			"data-code-lang": meta.language,
			dir: "ltr",
		},
		[header, pre]
	);
}

function walk(node: HastNode): void {
	if (!node.children) return;
	for (let i = 0; i < node.children.length; i += 1) {
		const child = node.children[i];
		if (!child) continue;

		if (child.type === "element" && child.tagName === "pre") {
			const codeEl = child.children?.find(
				(c) => c.type === "element" && c.tagName === "code"
			);
			if (codeEl) {
				const rawCode = extractText(codeEl);
				const rawLang = extractLanguage(codeEl);
				node.children[i] = buildCodeBlockCardNode(rawCode, rawLang);
				continue;
			}
		}

		walk(child);
	}
}

export function rehypeCodeBlocks() {
	return (tree: HastNode) => {
		walk(tree);
	};
}
