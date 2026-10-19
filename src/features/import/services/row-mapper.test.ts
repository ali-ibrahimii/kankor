import { describe, expect, it } from "vitest";
import type { ColumnMetadata } from "@/lib/generated/table-schema";
import type { FieldMappingState } from "../types/mapping.types";
import {
	buildPreviewRow,
	buildPreviewRows,
	toInsertPayload,
} from "./row-mapper";

const columns: ColumnMetadata[] = [
	{
		name: "title",
		type: "string",
		dataType: "string",
		nullable: false,
		optional: false,
	},
	{
		name: "max_attempts",
		type: "number",
		dataType: "number",
		nullable: true,
		optional: true,
	},
];

const mapping: FieldMappingState = {
	title: {
		targetColumn: "title",
		sourceHeader: "Quiz Title",
		defaultValue: "",
	},
	max_attempts: {
		targetColumn: "max_attempts",
		sourceHeader: null,
		defaultValue: "3",
	},
};

describe("buildPreviewRow", () => {
	it("resolves mapped source values into destination-shaped values", () => {
		const row = buildPreviewRow(
			{ "Quiz Title": "Chapter 1" },
			0,
			columns,
			mapping
		);
		expect(row.values).toEqual({ title: "Chapter 1", max_attempts: 3 });
		expect(row.issues).toEqual([]);
	});

	it("falls back to the configured default value when the source cell is empty", () => {
		const row = buildPreviewRow(
			{ "Quiz Title": "Chapter 2" },
			1,
			columns,
			mapping
		);
		expect(row.values.max_attempts).toBe(3);
	});

	it("reports a validation issue for a missing required column", () => {
		const row = buildPreviewRow({ "Quiz Title": "" }, 2, columns, mapping);
		expect(row.issues).toEqual([
			{ column: "title", message: "title is required." },
		]);
	});

	it("carries the source row index through for every row", () => {
		const rows = buildPreviewRows(
			[{ "Quiz Title": "A" }, { "Quiz Title": "B" }],
			columns,
			mapping
		);
		expect(rows.map((r) => r.sourceRowIndex)).toEqual([0, 1]);
	});
});

describe("toInsertPayload", () => {
	const entranceCode: ColumnMetadata = {
		name: "entrance_code",
		type: "string",
		dataType: "string",
		nullable: false,
		optional: true, // optional only because the DB generates a default
	};
	const description: ColumnMetadata = {
		name: "description",
		type: "string",
		dataType: "string",
		nullable: true,
		optional: true,
	};

	it("omits an optional, non-nullable column resolved to null so its DB default applies", () => {
		const payload = toInsertPayload(
			{ title: "Chapter 1", entrance_code: null },
			[columns[0], entranceCode]
		);
		expect(payload).toEqual({ title: "Chapter 1" });
	});

	it("omits an optional, nullable column resolved to null the same way", () => {
		const payload = toInsertPayload({ title: "Chapter 1", description: null }, [
			columns[0],
			description,
		]);
		expect(payload).toEqual({ title: "Chapter 1" });
	});

	it("keeps a non-null value even when the column is optional", () => {
		const payload = toInsertPayload(
			{ title: "Chapter 1", entrance_code: "ABC123" },
			[columns[0], entranceCode]
		);
		expect(payload).toEqual({ title: "Chapter 1", entrance_code: "ABC123" });
	});
});
