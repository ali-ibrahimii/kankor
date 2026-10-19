import { describe, expect, it } from "vitest";
import { type PositionedText, reconstructTable } from "./pdf.parser";

/** Builds a simple two-column table's positioned text items, header row at the top (largest y). */
function tableItems(): PositionedText[] {
	return [
		// header row (y = 100)
		{ text: "Title", x: 0, y: 100 },
		{ text: "Score", x: 100, y: 100 },
		// row 1 (y = 90)
		{ text: "Chapter", x: 0, y: 90 },
		{ text: "1", x: 1, y: 90 }, // same cell, wraps onto a second word near x=0
		{ text: "80", x: 100, y: 90 },
		// row 2 (y = 80)
		{ text: "Chapter 2", x: 0, y: 80 },
		{ text: "90", x: 100, y: 80 },
	];
}

describe("reconstructTable", () => {
	it("uses the topmost row as headers", () => {
		const result = reconstructTable(tableItems());
		expect(result.headers).toEqual(["Title", "Score"]);
	});

	it("buckets subsequent rows into columns by nearest x-position", () => {
		const result = reconstructTable(tableItems());
		expect(result.rows).toEqual([
			{ Title: "Chapter 1", Score: "80" },
			{ Title: "Chapter 2", Score: "90" },
		]);
	});

	it("falls back to a generated column name when a header column gets no text", () => {
		// Both header items share the same x, so they collide into one column
		// bucket and leave the other bucket empty.
		const items: PositionedText[] = [
			{ text: "A", x: 0, y: 100 },
			{ text: "B", x: 0, y: 100 },
		];
		const result = reconstructTable(items);
		expect(result.headers).toEqual(["A B", "Column 2"]);
	});

	it("always includes the best-effort warning", () => {
		const result = reconstructTable(tableItems());
		expect(result.warnings[0]).toMatch(/best-effort/i);
	});
});
