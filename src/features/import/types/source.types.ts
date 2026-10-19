/**
 * Shared types for the generic import engine's file-parsing layer.
 * Every parser (CSV, Excel, PDF, Google Sheets, ...) normalizes its source
 * into the same `ParsedFile` shape so the rest of the pipeline (mapping,
 * preview, import) never needs to know where the data came from.
 */

export type ParsedCellValue = string | number | boolean | null;

export type ParsedRow = Record<string, ParsedCellValue>;

export interface ParsedFile {
	/** Column headers detected in the source, in original order. */
	headers: string[];
	/** Raw rows keyed by source header. */
	rows: ParsedRow[];
	/** Non-fatal issues surfaced while parsing (shown to the user, don't block the flow). */
	warnings: string[];
}

/**
 * A pluggable source parser. New import sources (e.g. a JSON importer) are
 * added by implementing this interface and registering it in `parsers/index.ts`
 * — nothing else in the import engine needs to change.
 */
export interface ImportSourceParser {
	/** Lowercase file extensions (without the dot) this parser handles. */
	extensions: string[];
	/** MIME types this parser handles, matched as a fallback to extension sniffing. */
	mimeTypes: string[];
	parse(file: File): Promise<ParsedFile>;
}
