export interface CellValidationIssue {
	column: string;
	message: string;
}

/** A single source row, transformed into destination-shaped values and validated. */
export interface PreviewRow {
	/** Index of this row within the parsed source file (0-based). */
	sourceRowIndex: number;
	/** Transformed values keyed by destination column name. */
	values: Record<string, unknown>;
	issues: CellValidationIssue[];
}

export interface ImportRowError {
	sourceRowIndex: number;
	message: string;
}

export interface ImportRunSummary {
	insertedCount: number;
	failedCount: number;
	errors: ImportRowError[];
}

export interface ImportProgress {
	processed: number;
	total: number;
}
