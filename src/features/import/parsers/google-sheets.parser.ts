import { routes } from "@/lib/routes";
import type { ParsedFile } from "../types/source.types";
import { parseCsvText } from "./csv.parser";

/**
 * Imports a public Google Sheets document by URL. The sheet must be shared
 * as "Anyone with the link" — the server proxies Google's CSV export
 * endpoint (browser fetches to it are blocked by CORS) and the result is
 * parsed with the same CSV parser used for uploaded files.
 */
export async function parseGoogleSheetUrl(url: string): Promise<ParsedFile> {
	const response = await fetch(routes.api.import.googleSheet.route(), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url }),
	});

	const payload: { text?: string; error?: string } = await response.json();

	if (!response.ok || typeof payload.text !== "string") {
		throw new Error(payload.error ?? "Failed to import from Google Sheets.");
	}

	return parseCsvText(payload.text);
}
