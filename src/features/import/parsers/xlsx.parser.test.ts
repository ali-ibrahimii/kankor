import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { xlsxParser } from "./xlsx.parser";

async function buildWorkbookFile(rows: unknown[][]): Promise<File> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Sheet1");
	for (const row of rows) sheet.addRow(row);
	const buffer = await workbook.xlsx.writeBuffer();
	return new File([buffer], "quizzes.xlsx", {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
}

describe("xlsxParser", () => {
	it("parses the first row as headers and the rest as rows", async () => {
		const file = await buildWorkbookFile([
			["title", "max_attempts"],
			["Chapter 1", 3],
			["Chapter 2", 5],
		]);

		const result = await xlsxParser.parse(file);

		expect(result.headers).toEqual(["title", "max_attempts"]);
		expect(result.rows).toEqual([
			{ title: "Chapter 1", max_attempts: 3 },
			{ title: "Chapter 2", max_attempts: 5 },
		]);
	});

	it("skips fully empty rows", async () => {
		const file = await buildWorkbookFile([
			["title"],
			["Chapter 1"],
			[],
			["Chapter 2"],
		]);

		const result = await xlsxParser.parse(file);

		expect(result.rows).toHaveLength(2);
	});

	it("warns when the workbook has no sheets", async () => {
		const workbook = new ExcelJS.Workbook();
		const buffer = await workbook.xlsx.writeBuffer();
		const file = new File([buffer], "empty.xlsx", {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});

		const result = await xlsxParser.parse(file);

		expect(result.headers).toEqual([]);
		expect(result.warnings.length).toBeGreaterThan(0);
	});
});
