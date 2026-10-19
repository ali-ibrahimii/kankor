import { insertTableRows } from "./import.actions";
import type {
	ImportableRow,
	ImportBatchOutcome,
	ImportTarget,
} from "./import-target";

/** Default `ImportTarget`: inserts directly into Supabase via a server action. */
export const supabaseImportTarget: ImportTarget = {
	async insertBatch(table, rows): Promise<ImportBatchOutcome> {
		const result = await insertTableRows(
			table,
			rows.map((row) => row.values)
		);

		return {
			insertedCount: result.insertedCount,
			errors: result.errors.map((error) => ({
				sourceRowIndex:
					(rows[error.index] as ImportableRow | undefined)?.sourceRowIndex ??
					error.index,
				message: error.message,
			})),
		};
	},
};
