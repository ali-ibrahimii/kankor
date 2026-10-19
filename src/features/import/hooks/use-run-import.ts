"use client";

import * as React from "react";
import type { ColumnMetadata } from "@/lib/generated/table-schema";
import type { ImportTarget } from "../services/import-target";
import { toInsertPayload } from "../services/row-mapper";
import { supabaseImportTarget } from "../services/supabase-import-target";
import type {
	ImportProgress,
	ImportRowError,
	ImportRunSummary,
	PreviewRow,
} from "../types/validation.types";

const DEFAULT_BATCH_SIZE = 50;

/**
 * Runs the import: skips rows that failed pre-import validation (reporting
 * them alongside real insert failures), inserts the rest in batches via the
 * injected `ImportTarget`, and tracks progress/summary for the UI.
 */
export function useRunImport(target: ImportTarget = supabaseImportTarget) {
	const [isRunning, setIsRunning] = React.useState(false);
	const [progress, setProgress] = React.useState<ImportProgress | null>(null);
	const [summary, setSummary] = React.useState<ImportRunSummary | null>(null);

	const run = React.useCallback(
		async (
			table: string,
			rows: PreviewRow[],
			columns: ColumnMetadata[],
			batchSize = DEFAULT_BATCH_SIZE
		) => {
			const importableRows = rows.filter((row) => row.issues.length === 0);
			const skippedErrors: ImportRowError[] = rows
				.filter((row) => row.issues.length > 0)
				.map((row) => ({
					sourceRowIndex: row.sourceRowIndex,
					message: row.issues
						.map((issue) => `${issue.column}: ${issue.message}`)
						.join("; "),
				}));

			setIsRunning(true);
			setSummary(null);
			setProgress({ processed: 0, total: importableRows.length });

			let insertedCount = 0;
			const errors: ImportRowError[] = [...skippedErrors];

			for (let start = 0; start < importableRows.length; start += batchSize) {
				const batch = importableRows
					.slice(start, start + batchSize)
					.map((row) => ({
						sourceRowIndex: row.sourceRowIndex,
						values: toInsertPayload(row.values, columns),
					}));

				const outcome = await target.insertBatch(table, batch);
				insertedCount += outcome.insertedCount;
				errors.push(...outcome.errors);

				setProgress({
					processed: Math.min(start + batchSize, importableRows.length),
					total: importableRows.length,
				});
			}

			const result: ImportRunSummary = {
				insertedCount,
				failedCount: rows.length - insertedCount,
				errors,
			};
			setSummary(result);
			setIsRunning(false);
			return result;
		},
		[target]
	);

	const reset = React.useCallback(() => {
		setProgress(null);
		setSummary(null);
	}, []);

	return { run, isRunning, progress, summary, reset };
}
