import { describe, expect, it } from "vitest";
import type { ColumnMetadata } from "@/lib/generated/table-schema";
import { transformValue } from "./transformers";

function column(overrides: Partial<ColumnMetadata>): ColumnMetadata {
	return {
		name: "field",
		type: "string",
		dataType: "string",
		nullable: false,
		optional: false,
		...overrides,
	};
}

describe("transformValue", () => {
	it("flags a required column as missing when the value is empty", () => {
		const result = transformValue(
			null,
			column({ nullable: false, optional: false })
		);
		expect(result.value).toBeNull();
		expect(result.error).toMatch(/required/);
	});

	it("allows an empty value for optional/nullable columns", () => {
		const result = transformValue(
			"",
			column({ nullable: true, optional: true })
		);
		expect(result).toEqual({ value: null });
	});

	it("passes strings through unchanged", () => {
		const result = transformValue("hello", column({ dataType: "string" }));
		expect(result).toEqual({ value: "hello" });
	});

	it("coerces numeric strings, including thousands separators", () => {
		const result = transformValue("1,234", column({ dataType: "number" }));
		expect(result).toEqual({ value: 1234 });
	});

	it("errors on an invalid number", () => {
		const result = transformValue(
			"not-a-number",
			column({ dataType: "number" })
		);
		expect(result.value).toBeNull();
		expect(result.error).toMatch(/not a valid number/);
	});

	it.each([
		["true", true],
		["Yes", true],
		["1", true],
		["false", false],
		["No", false],
		["0", false],
	])("coerces boolean-like value %s to %s", (input, expected) => {
		const result = transformValue(input, column({ dataType: "boolean" }));
		expect(result).toEqual({ value: expected });
	});

	it("errors on an unrecognized boolean value", () => {
		const result = transformValue("maybe", column({ dataType: "boolean" }));
		expect(result.value).toBeNull();
		expect(result.error).toMatch(/true\/false/);
	});

	it("matches enum values case-insensitively", () => {
		const result = transformValue(
			"ATTEMPT",
			column({ dataType: "enum", enumValues: ["attempt", "never"] })
		);
		expect(result).toEqual({ value: "attempt" });
	});

	it("errors when the value isn't one of the allowed enum values", () => {
		const result = transformValue(
			"sometimes",
			column({ dataType: "enum", enumValues: ["attempt", "never"] })
		);
		expect(result.value).toBeNull();
		expect(result.error).toMatch(/must be one of/);
	});

	it("parses JSON-array syntax for array columns", () => {
		const result = transformValue('["a","b"]', column({ dataType: "array" }));
		expect(result).toEqual({ value: ["a", "b"] });
	});

	it("falls back to comma-splitting for array columns given plain text", () => {
		const result = transformValue("a, b, c", column({ dataType: "array" }));
		expect(result).toEqual({ value: ["a", "b", "c"] });
	});

	it("parses JSON objects for json columns", () => {
		const result = transformValue('{"a":1}', column({ dataType: "json" }));
		expect(result).toEqual({ value: { a: 1 } });
	});
});
