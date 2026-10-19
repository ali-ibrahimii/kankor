"use client";

import * as React from "react";
import { getParserForFile } from "../parsers";
import { parseGoogleSheetUrl } from "../parsers/google-sheets.parser";
import type { ParsedFile } from "../types/source.types";

export interface UseFileParserResult {
	parsedFile: ParsedFile | null;
	sourceLabel: string | null;
	isParsing: boolean;
	error: string | null;
	/** Resolves to the parsed file on success, or null if parsing failed (see `error`). */
	parseFile: (file: File) => Promise<ParsedFile | null>;
	parseGoogleSheet: (url: string) => Promise<ParsedFile | null>;
	reset: () => void;
}

/** Parses an uploaded file or a Google Sheets URL into a normalized `ParsedFile`. */
export function useFileParser(): UseFileParserResult {
	const [parsedFile, setParsedFile] = React.useState<ParsedFile | null>(null);
	const [sourceLabel, setSourceLabel] = React.useState<string | null>(null);
	const [isParsing, setIsParsing] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const execute = React.useCallback(
		async (label: string, task: () => Promise<ParsedFile>) => {
			setIsParsing(true);
			setError(null);
			try {
				const result = await task();
				if (result.headers.length === 0) {
					setError("No columns could be detected in this file.");
					setParsedFile(null);
					return null;
				}
				setParsedFile(result);
				setSourceLabel(label);
				return result;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to parse the file."
				);
				setParsedFile(null);
				return null;
			} finally {
				setIsParsing(false);
			}
		},
		[]
	);

	const parseFile = React.useCallback(
		async (file: File) => {
			const parser = getParserForFile(file);
			if (!parser) {
				setError(`Unsupported file type: "${file.name}".`);
				return null;
			}
			return execute(file.name, () => parser.parse(file));
		},
		[execute]
	);

	const parseGoogleSheet = React.useCallback(
		async (url: string) => {
			return execute("Google Sheet", () => parseGoogleSheetUrl(url));
		},
		[execute]
	);

	const reset = React.useCallback(() => {
		setParsedFile(null);
		setSourceLabel(null);
		setError(null);
	}, []);

	return {
		parsedFile,
		sourceLabel,
		isParsing,
		error,
		parseFile,
		parseGoogleSheet,
		reset,
	};
}
