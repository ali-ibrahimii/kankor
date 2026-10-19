import fuzzysort from "fuzzysort";
import type { ColumnMetadata } from "@/lib/generated/table-schema";

/** Minimum fuzzysort score (0..1, 1 = perfect) to accept an auto-detected match. */
const MATCH_THRESHOLD = 0.55;

function normalize(label: string): string {
	return label
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

/**
 * Auto-detects the best source header for each destination column by fuzzy
 * name matching (normalized snake_case comparison, then fuzzysort as a
 * fallback for near-matches like "Quiz Title" vs "title").
 *
 * Uses greedy bipartite assignment: the single best (column, header) pair is
 * committed first, then the next best among what's left, so no header is
 * suggested for two different columns.
 */
export function autoDetectColumnMapping(
	columns: ColumnMetadata[],
	sourceHeaders: string[]
): Record<string, string | null> {
	const normalizedHeaders = sourceHeaders.map((header) => ({
		header,
		normalized: normalize(header),
	}));

	type Candidate = { column: string; header: string; score: number };
	const candidates: Candidate[] = [];

	for (const column of columns) {
		const normalizedColumn = normalize(column.name);

		for (const { header, normalized } of normalizedHeaders) {
			if (normalized === normalizedColumn) {
				candidates.push({ column: column.name, header, score: 1 });
				continue;
			}
			const result = fuzzysort.single(normalizedColumn, normalized);
			if (result && result.score >= MATCH_THRESHOLD) {
				candidates.push({ column: column.name, header, score: result.score });
			}
		}
	}

	candidates.sort((a, b) => b.score - a.score);

	const assignment: Record<string, string | null> = {};
	for (const column of columns) assignment[column.name] = null;

	const usedHeaders = new Set<string>();
	const assignedColumns = new Set<string>();

	for (const candidate of candidates) {
		if (
			assignedColumns.has(candidate.column) ||
			usedHeaders.has(candidate.header)
		) {
			continue;
		}
		assignment[candidate.column] = candidate.header;
		assignedColumns.add(candidate.column);
		usedHeaders.add(candidate.header);
	}

	return assignment;
}
