"use client";

import * as React from "react";
import type { ColumnMetadata } from "@/lib/generated/table-schema";
import { buildPreviewRows } from "../services/row-mapper";
import type { FieldMappingState } from "../types/mapping.types";
import type { ParsedRow } from "../types/source.types";

/** Resolves every parsed row into destination-shaped, validated preview rows. */
export function useImportPreview(
	rows: ParsedRow[],
	columns: ColumnMetadata[],
	mapping: FieldMappingState
) {
	const previewRows = React.useMemo(
		() => buildPreviewRows(rows, columns, mapping),
		[rows, columns, mapping]
	);

	const invalidRowCount = React.useMemo(
		() => previewRows.filter((row) => row.issues.length > 0).length,
		[previewRows]
	);

	return {
		previewRows,
		totalRowCount: previewRows.length,
		invalidRowCount,
		validRowCount: previewRows.length - invalidRowCount,
	};
}
