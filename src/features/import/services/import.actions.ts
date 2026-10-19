"use server";

import { TABLE_SCHEMA } from "@/lib/generated/table-schema";
import { createClient } from "@/lib/supabase/server";

export interface InsertRowsErrorEntry {
	/** Index within the `rows` array passed to this call (not the source file). */
	index: number;
	message: string;
}

export interface InsertRowsResult {
	insertedCount: number;
	errors: InsertRowsErrorEntry[];
}

/**
 * Inserts a batch of rows into a Supabase table on behalf of the generic
 * import engine.
 *
 * `table` is only known at runtime (it comes from whichever page opened
 * `<ImportDialog table="..." />`), so it's validated against the generated
 * `TABLE_SCHEMA` allowlist before touching the database — this is also what
 * keeps the dialog itself free of any table-specific knowledge. Row Level
 * Security still governs what the caller is actually allowed to insert.
 */
export async function insertTableRows(
	table: string,
	rows: Record<string, unknown>[]
): Promise<InsertRowsResult> {
	if (
		!(table in TABLE_SCHEMA) ||
		TABLE_SCHEMA[table as keyof typeof TABLE_SCHEMA].kind !== "table"
	) {
		return {
			insertedCount: 0,
			errors: rows.map((_, index) => ({
				index,
				message: `"${table}" is not an importable table.`,
			})),
		};
	}

	const supabase = await createClient();
	// The table name is only known at runtime and validated above against the
	// generated schema allowlist, so the row shape can't be statically typed
	// per-table here — this is the single, intentional escape hatch that
	// makes the import engine table-agnostic.
	const query = supabase.from(table as never);

	let insertedCount = 0;
	const errors: InsertRowsErrorEntry[] = [];

	const { error: batchError } = await query.insert(rows as never);

	if (!batchError) {
		return { insertedCount: rows.length, errors: [] };
	}

	// The batch failed as a unit (e.g. one bad row aborts the whole request) —
	// retry row-by-row so a single invalid row doesn't sink the entire import.
	for (let index = 0; index < rows.length; index++) {
		const { error } = await supabase
			.from(table as never)
			.insert(rows[index] as never);
		if (error) {
			errors.push({ index, message: error.message });
		} else {
			insertedCount += 1;
		}
	}

	return { insertedCount, errors };
}
