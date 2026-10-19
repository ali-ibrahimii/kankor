import type { ColumnMetadata } from "@/lib/generated/table-schema";
import type { FieldMappingState } from "../types/mapping.types";
import type { ParsedRow } from "../types/source.types";
import type { PreviewRow } from "../types/validation.types";
import { transformValue } from "./transformers";

/**
 * Resolves one source row into destination-shaped, validated values using
 * the current field mapping: looks up each column's mapped source header
 * (falling back to its configured default value when the cell is empty),
 * then coerces/validates it against the column's schema.
 */
export function buildPreviewRow(
	row: ParsedRow,
	sourceRowIndex: number,
	columns: ColumnMetadata[],
	mapping: FieldMappingState
): PreviewRow {
	const values: Record<string, unknown> = {};
	const issues: PreviewRow["issues"] = [];

	for (const column of columns) {
		const columnMapping = mapping[column.name];
		const sourceValue = columnMapping?.sourceHeader
			? row[columnMapping.sourceHeader]
			: null;

		const raw =
			sourceValue === null || sourceValue === undefined || sourceValue === ""
				? (columnMapping?.defaultValue ?? null)
				: sourceValue;

		const result = transformValue(raw, column);
		values[column.name] = result.value;
		if (result.error) {
			issues.push({ column: column.name, message: result.error });
		}
	}

	return { sourceRowIndex, values, issues };
}

export function buildPreviewRows(
	rows: ParsedRow[],
	columns: ColumnMetadata[],
	mapping: FieldMappingState
): PreviewRow[] {
	return rows.map((row, index) =>
		buildPreviewRow(row, index, columns, mapping)
	);
}

/**
 * Strips optional columns resolved to `null` (unmapped, no default) from a
 * preview row's values before sending it to the database. Sending an
 * explicit `null` for a column that's optional only because it has a DB
 * default (e.g. a generated id or entrance code) would override that default
 * and violate its NOT NULL constraint — omitting the key lets Postgres fill
 * it in instead.
 */
export function toInsertPayload(
	values: Record<string, unknown>,
	columns: ColumnMetadata[]
): Record<string, unknown> {
	const payload: Record<string, unknown> = {};
	for (const column of columns) {
		const value = values[column.name];
		if (value === null && column.optional) continue;
		payload[column.name] = value;
	}
	return payload;
}
