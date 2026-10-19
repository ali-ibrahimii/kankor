import type { ColumnMetadata } from "@/lib/generated/table-schema";

/** How a single destination column is resolved from the uploaded source. */
export interface ColumnMapping {
	/** Destination column name (matches ColumnMetadata["name"]). */
	targetColumn: string;
	/** Selected source header, or null when unmapped/ignored. */
	sourceHeader: string | null;
	/** Fallback value (raw string, coerced at import time) used when a row's source cell is empty. */
	defaultValue: string;
}

/** Field mapping state, keyed by destination column name. */
export type FieldMappingState = Record<string, ColumnMapping>;

export interface MappingCandidate {
	column: ColumnMetadata;
	/** Best-guess source header for this column, chosen by fuzzy name matching. */
	suggestedHeader: string | null;
}
