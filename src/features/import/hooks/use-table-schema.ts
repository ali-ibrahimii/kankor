import {
	type ImportableTableName,
	TABLE_SCHEMA,
	type TableMetadata,
} from "@/lib/generated/table-schema";

/**
 * Loads the generated schema metadata for a table. Kept as a hook (rather
 * than a plain import) so the import engine has a single seam to swap in an
 * async/remote schema source later without touching any consumer.
 */
export function useTableSchema(table: ImportableTableName): TableMetadata {
	return TABLE_SCHEMA[table];
}
