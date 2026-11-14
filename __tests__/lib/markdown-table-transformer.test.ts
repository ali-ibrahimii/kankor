/**
 * GFM table round-trip through the course editor's markdown transformers.
 * (@lexical/markdown ships no TABLE transformer — without ours, tables are
 * silently dropped when the builder saves.)
 */

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
	$isTableCellNode,
	$isTableNode,
	$isTableRowNode,
	TableCellNode,
	TableNode,
	TableRowNode,
} from "@lexical/table";
import { $getRoot, createEditor } from "lexical";
import { describe, expect, it } from "vitest";

import {
	MD_TRANSFORMERS,
	TABLE_TRANSFORMER,
} from "@/features/editor/markdown-table-transformer";

function makeEditor() {
	return createEditor({
		nodes: [
			TableNode,
			TableRowNode,
			TableCellNode,
			HeadingNode,
			QuoteNode,
			ListNode,
			ListItemNode,
			CodeNode,
			CodeHighlightNode,
			LinkNode,
			AutoLinkNode,
		],
	});
}

const SAMPLE = [
	"پیش از جدول",
	"",
	"| فصل | موضوع | چه یاد می‌گیرید |",
	"| --- | --- | --- |",
	"| ۱ | HTML | ساختار صفحه |",
	"| ۲ | CSS | استایل‌دهی |",
	"",
	"بعد از جدول",
].join("\n");

describe("TABLE_TRANSFORMER", () => {
	it("imports a GFM table as a Lexical table with a header row", () => {
		const editor = makeEditor();
		editor.update(
			() => {
				$convertFromMarkdownString(SAMPLE, MD_TRANSFORMERS);
			},
			{ discrete: true }
		);

		editor.getEditorState().read(() => {
			const tables = $getRoot().getChildren().filter($isTableNode);
			expect(tables).toHaveLength(1);
			const rows = tables[0].getChildren().filter($isTableRowNode);
			expect(rows).toHaveLength(3);
			const firstRowCells = rows[0].getChildren().filter($isTableCellNode);
			expect(firstRowCells.map((c) => c.getTextContent())).toEqual([
				"فصل",
				"موضوع",
				"چه یاد می‌گیرید",
			]);
		});
	});

	it("round-trips table → markdown → table without losing cells", () => {
		const editor = makeEditor();
		editor.update(
			() => {
				$convertFromMarkdownString(SAMPLE, MD_TRANSFORMERS);
			},
			{ discrete: true }
		);

		let exported = "";
		editor.getEditorState().read(() => {
			exported = $convertToMarkdownString(MD_TRANSFORMERS);
		});

		expect(exported).toContain("| فصل | موضوع | چه یاد می‌گیرید |");
		expect(exported).toContain("| --- | --- | --- |");
		expect(exported).toContain("| ۱ | HTML | ساختار صفحه |");

		// Second pass: parse the export again and compare the table cells.
		const editor2 = makeEditor();
		editor2.update(
			() => {
				$convertFromMarkdownString(exported, MD_TRANSFORMERS);
			},
			{ discrete: true }
		);
		editor2.getEditorState().read(() => {
			const tables = $getRoot().getChildren().filter($isTableNode);
			expect(tables).toHaveLength(1);
			const rows = tables[0].getChildren().filter($isTableRowNode);
			expect(rows).toHaveLength(3);
			expect(
				rows[2]
					.getChildren()
					.filter($isTableCellNode)
					.map((c) => c.getTextContent())
			).toEqual(["۲", "CSS", "استایل‌دهی"]);
		});
	});

	it("escapes pipes inside cells", () => {
		const editor = makeEditor();
		editor.update(
			() => {
				$convertFromMarkdownString(
					["| a | b |", "| --- | --- |", "| x \\| y | z |"].join("\n"),
					MD_TRANSFORMERS
				);
			},
			{ discrete: true }
		);
		let exported = "";
		editor.getEditorState().read(() => {
			exported = $convertToMarkdownString(MD_TRANSFORMERS);
		});
		expect(exported).toContain("x \\| y");
	});

	it("is part of MD_TRANSFORMERS", () => {
		expect(MD_TRANSFORMERS).toContain(TABLE_TRANSFORMER);
	});
});
