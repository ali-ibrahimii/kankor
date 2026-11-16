import type { MultilineElementTransformer } from "@lexical/markdown";
import { isTableRowDivider, TRANSFORMERS } from "@lexical/markdown";
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

/**
 * The markdown transformers used across the course editor: the standard
 * set plus GFM table round-tripping (tables would otherwise be dropped on
 * export).
 */
export const MD_TRANSFORMERS = [...TRANSFORMERS, TABLE_TRANSFORMER];
