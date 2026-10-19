import type { ColumnMetadata } from "@/lib/generated/table-schema";
import type { ParsedCellValue } from "../types/source.types";

export interface TransformResult {
	value: unknown;
	error?: string;
}

const TRUTHY = new Set(["true", "1", "yes", "y"]);
const FALSY = new Set(["false", "0", "no", "n"]);

function isEmptyValue(raw: ParsedCellValue): boolean {
	return (
		raw === null ||
		raw === undefined ||
		(typeof raw === "string" && raw.trim() === "")
	);
}

function coerceBoolean(raw: ParsedCellValue): boolean | null {
	if (typeof raw === "boolean") return raw;
	const normalized = String(raw).trim().toLowerCase();
	if (TRUTHY.has(normalized)) return true;
	if (FALSY.has(normalized)) return false;
	return null;
}

function coerceArray(raw: ParsedCellValue): unknown[] {
	const text = String(raw).trim();
	try {
		const parsed = JSON.parse(text);
		if (Array.isArray(parsed)) return parsed;
	} catch {
		// not JSON — fall back to a comma-separated list
	}
	return text
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
}

/**
 * Coerces a raw parsed cell value into the shape expected by a destination
 * column, based on its normalized `dataType`. Returns a validation `error`
 * instead of throwing so the caller can collect issues per-row for the
 * preview step.
 */
export function transformValue(
	raw: ParsedCellValue,
	column: ColumnMetadata
): TransformResult {
	if (isEmptyValue(raw)) {
		if (!column.nullable && !column.optional) {
			return { value: null, error: `${column.name} is required.` };
		}
		return { value: null };
	}

	switch (column.dataType) {
		case "string":
			return { value: String(raw) };

		case "number": {
			const num =
				typeof raw === "number"
					? raw
					: Number(String(raw).replace(/,/g, "").trim());
			if (Number.isNaN(num)) {
				return { value: null, error: `"${raw}" is not a valid number.` };
			}
			return { value: num };
		}

		case "boolean": {
			const bool = coerceBoolean(raw);
			if (bool === null) {
				return {
					value: null,
					error: `"${raw}" is not a valid true/false value.`,
				};
			}
			return { value: bool };
		}

		case "enum": {
			const text = String(raw).trim();
			const match = column.enumValues?.find(
				(allowed) => allowed.toLowerCase() === text.toLowerCase()
			);
			if (!match) {
				return {
					value: null,
					error: `"${raw}" must be one of: ${column.enumValues?.join(", ") ?? ""}.`,
				};
			}
			return { value: match };
		}

		case "array":
			return { value: coerceArray(raw) };

		case "json": {
			if (typeof raw !== "string") return { value: raw };
			try {
				return { value: JSON.parse(raw) };
			} catch {
				return { value: raw };
			}
		}

		default:
			return { value: raw };
	}
}
