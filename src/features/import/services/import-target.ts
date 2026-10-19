import type { ImportRowError } from "../types/validation.types";

export interface ImportableRow {
	/** Index of this row within the originally parsed source file — carried through for error reporting. */
	sourceRowIndex: number;
	values: Record<string, unknown>;
}

export interface ImportBatchOutcome {
	insertedCount: number;
	errors: ImportRowError[];
}

/**
 * Abstraction over "however rows actually get persisted". The dialog and its
 * hooks only depend on this interface, so swapping direct Supabase inserts
 * for a future bulk-import API (queue, edge function, CSV COPY, ...) is a
 * matter of providing a new implementation — no changes to the UI layer.
 */
export interface ImportTarget {
	insertBatch(
		table: string,
		rows: ImportableRow[]
	): Promise<ImportBatchOutcome>;
}
