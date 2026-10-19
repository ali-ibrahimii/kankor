import Papa from "papaparse";
import type { ImportSourceParser, ParsedFile } from "../types/source.types";

/** Parses raw CSV text — shared by the file parser and the Google Sheets source. */
export function parseCsvText(text: string): ParsedFile {
	const result = Papa.parse<Record<string, string>>(text, {
		header: true,
		skipEmptyLines: "greedy",
		transformHeader: (header) => header.trim(),
	});

	const headers = result.meta.fields ?? [];
	const warnings = result.errors.map(
		(error) =>
			`Row ${error.row != null ? error.row + 2 : "?"}: ${error.message}`
	);

	return { headers, rows: result.data, warnings };
}

export const csvParser: ImportSourceParser = {
	extensions: ["csv"],
	mimeTypes: ["text/csv", "application/vnd.ms-excel", "text/plain"],
	async parse(file) {
		const text = await file.text();
		return parseCsvText(text);
	},
};
