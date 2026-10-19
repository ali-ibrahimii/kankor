import type { ImportSourceParser } from "../types/source.types";
import { csvParser } from "./csv.parser";
import { pdfParser } from "./pdf.parser";
import { xlsxParser } from "./xlsx.parser";

export { parseCsvText } from "./csv.parser";
export { parseGoogleSheetUrl } from "./google-sheets.parser";

/**
 * Registered file parsers. Add a new source (e.g. a JSON importer) by
 * implementing `ImportSourceParser` and appending it here — nothing else in
 * the import engine needs to change.
 */
export const FILE_PARSERS: ImportSourceParser[] = [
	csvParser,
	xlsxParser,
	pdfParser,
];

export function getParserForFile(file: File): ImportSourceParser | null {
	const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
	return (
		FILE_PARSERS.find((parser) => parser.extensions.includes(extension)) ??
		FILE_PARSERS.find((parser) => parser.mimeTypes.includes(file.type)) ??
		null
	);
}

export const ACCEPTED_FILE_EXTENSIONS = FILE_PARSERS.flatMap(
	(parser) => parser.extensions
).map((ext) => `.${ext}`);
