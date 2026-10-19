import { describe, expect, it } from "vitest";
import { parseCsvText } from "./csv.parser";

describe("parseCsvText", () => {
	it("parses headers and rows", () => {
		const result = parseCsvText(
			"title,max_attempts\nChapter 1,3\nChapter 2,5\n"
		);
		expect(result.headers).toEqual(["title", "max_attempts"]);
		expect(result.rows).toEqual([
			{ title: "Chapter 1", max_attempts: "3" },
			{ title: "Chapter 2", max_attempts: "5" },
		]);
		expect(result.warnings).toEqual([]);
	});

	it("trims whitespace from header names", () => {
		const result = parseCsvText(" title , max_attempts \nChapter 1,3\n");
		expect(result.headers).toEqual(["title", "max_attempts"]);
	});

	it("skips blank lines", () => {
		const result = parseCsvText("title\nChapter 1\n\nChapter 2\n");
		expect(result.rows).toHaveLength(2);
	});

	it("returns no headers for empty input", () => {
		const result = parseCsvText("");
		expect(result.headers).toEqual([]);
		expect(result.rows).toEqual([]);
	});
});
