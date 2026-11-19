import { $createCodeNode, $isCodeNode, CodeNode } from "@lexical/code";
import type {
	ElementTransformer,
	MultilineElementTransformer,
} from "@lexical/markdown";
import { CODE, isTableRowDivider, TRANSFORMERS } from "@lexical/markdown";
import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
	HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import {
	$createTableCellNode,
	$createTableNode,
	$createTableRowNode,
	$isTableCellNode,
	$isTableNode,
	$isTableRowNode,
	TableCellHeaderStates,
	TableCellNode,
	TableNode,
	TableRowNode,
} from "@lexical/table";
import {
	$createParagraphNode,
	$createTextNode,
	$isElementNode,
	type ElementNode,
	type LexicalNode,
} from "lexical";

// ─── GFM table ⇄ Lexical table ──────────────────────────────────────────────
//
// @lexical/markdown ships no TABLE transformer, so tables inserted through
// the editor were silently dropped on markdown export. This transformer
// round-trips them: `| a | b |` rows with a `| --- |` divider become
// TableNodes on import and markdown on export.

const TABLE_ROW_REGEXP = /^\s*\|(.+)\|\s*$/;

function parseRow(line: string): string[] {
	const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
	// Split on unescaped pipes, then unescape "\|".
	return inner
		.split(/(?<!\\)\|/)
		.map((cell) => cell.replace(/\\\|/g, "|").trim());
}

function serializeCell(
	node: LexicalNode,
	traverseChildren: (n: never) => string
): string {
	const raw = $isElementNode(node)
		? (traverseChildren as (n: typeof node) => string)(node)
		: node.getTextContent();
	return raw.replace(/\n/g, " ").replace(/\|/g, "\\|").trim();
}

function buildTable(
	rootNode: ElementNode,
	rows: string[][],
	hasHeader: boolean
): void {
	const table = $createTableNode();
	rows.forEach((cells, rowIndex) => {
		const row = $createTableRowNode();
		for (const text of cells) {
			const cell = $createTableCellNode(
				hasHeader && rowIndex === 0
					? TableCellHeaderStates.ROW
					: TableCellHeaderStates.NO_STATUS
			);
			const paragraph = $createParagraphNode();
			if (text) paragraph.append($createTextNode(text));
			cell.append(paragraph);
			row.append(cell);
		}
		table.append(row);
	});
	rootNode.append(table);
}

export const TABLE_TRANSFORMER: MultilineElementTransformer = {
	type: "multiline-element",
	dependencies: [TableNode, TableRowNode, TableCellNode],
	regExpStart: TABLE_ROW_REGEXP,

	handleImportAfterStartMatch: ({ lines, rootNode, startLineIndex }) => {
		const rows: string[][] = [];
		let hasHeader = false;
		let i = startLineIndex;
		for (; i < lines.length; i += 1) {
			const line = lines[i] ?? "";
			if (!TABLE_ROW_REGEXP.test(line)) break;
			if (i === startLineIndex + 1 && isTableRowDivider(line)) {
				hasHeader = true;
				continue;
			}
			rows.push(parseRow(line));
		}
		// A GFM table needs a divider row right under the first row.
		if (rows.length === 0 || !hasHeader) return null;

		buildTable(rootNode, rows, true);
		return [true, i - 1];
	},

	replace: (
		rootNode,
		_children,
		startMatch,
		_endMatch,
		linesInBetween,
		isImport
	) => {
		if (!isImport || !linesInBetween) return false;
		const rows = [
			parseRow(startMatch[0] ?? ""),
			...linesInBetween.map(parseRow),
		].filter((cells) => cells.length > 0);
		if (rows.length === 0) return false;
		buildTable(rootNode, rows, true);
	},

	export: (node, traverseChildren) => {
		if (!$isTableNode(node)) return null;
		const lines: string[] = [];
		const rowNodes = node.getChildren().filter($isTableRowNode);
		rowNodes.forEach((row, rowIndex) => {
			const cells = row
				.getChildren()
				.filter($isTableCellNode)
				.map((cell) => serializeCell(cell, traverseChildren as never));
			lines.push(`| ${cells.join(" | ")} |`);
			if (rowIndex === 0) {
				lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
			}
		});
		return lines.join("\n");
	},
};

// ─── Horizontal rule ⇄ Markdown `---` ───────────────────────────────────────
//
// @lexical/markdown ships no HR transformer, so `---` lines were left as
// plain text. This round-trips them with the HorizontalRuleNode.

const HR_REGEXP = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

export const HR_TRANSFORMER: ElementTransformer = {
	type: "element",
	dependencies: [HorizontalRuleNode],
	regExp: HR_REGEXP,
	replace: (parentNode) => {
		parentNode.append($createHorizontalRuleNode());
		return true;
	},
	export: (node) => ($isHorizontalRuleNode(node) ? "---" : null),
};

// ─── Fenced code / text block ⇄ Lexical CodeNode ─────────────────────────────
//
// Preserves exact leading indentation on every line (fixing @lexical/markdown's
// built-in CODE transformer trimming a leading space from line 1), defaults
// untagged fences to `text`, and escapes nested backtick fences on export.

const CODE_START_REGEXP = /^([ \t]*`{3,})([\w#+-]+)?[ \t]?/;
const CODE_END_REGEXP = /^[ \t]*`{3,}[ \t]*$/;

export const CODE_BLOCK_TRANSFORMER: MultilineElementTransformer = {
	type: "multiline-element",
	dependencies: [CodeNode],
	regExpStart: CODE_START_REGEXP,
	regExpEnd: { optional: true, regExp: CODE_END_REGEXP },

	handleImportAfterStartMatch: ({
		lines,
		rootNode,
		startLineIndex,
		startMatch,
	}) => {
		const rawFence = startMatch[1] ?? "```";
		const fenceLength = rawFence.trim().length;
		const currentLine = lines[startLineIndex] ?? "";
		const language = (startMatch[2] ?? "").trim() || "text";
		const endRegex = new RegExp(`^[ \\t]*\`{${fenceLength},}[ \\t]*$`);

		for (let i = startLineIndex + 1; i < lines.length; i += 1) {
			const line = lines[i] ?? "";
			if (endRegex.test(line)) {
				const bodyLines = lines.slice(startLineIndex + 1, i);
				const codeNode = $createCodeNode(language);
				const body = bodyLines.join("\n");
				if (body.length > 0) {
					codeNode.append($createTextNode(body));
				}
				rootNode.append(codeNode);
				return [true, i];
			}
		}

		// Handle single-line ```` ```content``` ```` fences gracefully.
		const afterFence = currentLine.slice(
			(startMatch.index ?? 0) + rawFence.length
		);
		const inlineEndRegex = new RegExp(`\`{${fenceLength},}[ \\t]*$`);
		const inlineEnd = inlineEndRegex.exec(afterFence);
		if (inlineEnd) {
			const content = afterFence.slice(0, inlineEnd.index).trim();
			const codeNode = $createCodeNode("text");
			if (content) codeNode.append($createTextNode(content));
			rootNode.append(codeNode);
			return [true, startLineIndex];
		}

		// Unclosed fence: consume through EOF.
		const bodyLines = lines.slice(startLineIndex + 1);
		const codeNode = $createCodeNode(language);
		const body = bodyLines.join("\n");
		if (body.length > 0) {
			codeNode.append($createTextNode(body));
		}
		rootNode.append(codeNode);
		return [true, lines.length - 1];
	},

	replace: (
		rootNode,
		children,
		startMatch,
		_endMatch,
		linesInBetween,
		isImport
	) => {
		const language = (startMatch[2] ?? "").trim() || "text";
		if (!children && linesInBetween) {
			const codeNode = $createCodeNode(language);
			const body = linesInBetween.join("\n");
			if (body.length > 0) {
				codeNode.append($createTextNode(body));
			}
			rootNode.append(codeNode);
			return;
		}
		if (children) {
			const codeNode = $createCodeNode(language);
			codeNode.append(...children);
			rootNode.replace(codeNode);
			if (!isImport) {
				codeNode.select(0, 0);
			}
		}
	},

	export: (node) => {
		if (!$isCodeNode(node)) return null;
		const textContent = node.getTextContent();
		const lang = (node.getLanguage() || "text").trim();
		let fence = "```";
		const backticks = textContent.match(/`{3,}/g);
		if (backticks) {
			const longest = Math.max(...backticks.map((b) => b.length));
			fence = "`".repeat(longest + 1);
		}
		return `${fence}${lang}${textContent ? `\n${textContent}` : ""}\n${fence}`;
	},
};

/**
 * The markdown transformers used across the course editor: the standard
 * set (with improved fenced code/text round-tripping) plus GFM table
 * round-tripping and horizontal rules.
 */
export const MD_TRANSFORMERS = [
	...TRANSFORMERS.filter((t) => t !== CODE),
	CODE_BLOCK_TRANSFORMER,
	TABLE_TRANSFORMER,
	HR_TRANSFORMER,
];
