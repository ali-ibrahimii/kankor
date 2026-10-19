import ExcelJS from "exceljs";
import type {
	ImportSourceParser,
	ParsedCellValue,
	ParsedRow,
} from "../types/source.types";

export const xlsxParser: ImportSourceParser = {
	extensions: ["xlsx", "xls"],
	mimeTypes: [
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-excel",
	],
	async parse(file) {
		const buffer = await file.arrayBuffer();
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);
		const worksheet = workbook.worksheets[0];

		if (!worksheet) {
			return {
				headers: [],
				rows: [],
				warnings: ["The workbook doesn't contain any sheets."],
			};
		}

		let headers: string[] = [];
		const rows: ParsedRow[] = [];

		worksheet.eachRow((row, rowNumber) => {
			const values = normalizeRow(row);
			if (rowNumber === 1) {
				headers = values.map((value, index) =>
					value != null && value !== "" ? String(value) : `Column ${index + 1}`
				);
				return;
			}
			if (values.every((value) => value === null)) return; // skip fully empty rows

			const record: ParsedRow = {};
			headers.forEach((header, index) => {
				record[header] = values[index] ?? null;
			});
			rows.push(record);
		});

		const warnings =
			worksheet.rowCount > 1
				? []
				: ["Only a header row was found — no data rows to import."];

		return { headers, rows, warnings };
	},
};

/** ExcelJS `row.values` is 1-indexed with a sparse hole at index 0. */
function normalizeRow(row: ExcelJS.Row): ParsedCellValue[] {
	const raw = row.values as unknown[];
	const values: ParsedCellValue[] = [];
	for (let i = 1; i < raw.length; i++) {
		values.push(normalizeCell(raw[i]));
	}
	return values;
}

function normalizeCell(value: unknown): ParsedCellValue {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value.toISOString();
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return value;
	}
	if (typeof value === "object") {
		const obj = value as Record<string, unknown>;
		// Formula cells: prefer the computed result.
		if ("result" in obj) return normalizeCell(obj.result);
		// Rich text / hyperlink cells.
		if ("text" in obj) return normalizeCell(obj.text);
		if (Array.isArray(obj.richText)) {
			return (obj.richText as Array<{ text?: string }>)
				.map((part) => part.text ?? "")
				.join("");
		}
	}
	return String(value);
}
