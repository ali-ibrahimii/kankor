import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ColumnMetadata } from "@/lib/generated/table-schema";
import { useColumnMapping } from "./use-column-mapping";

const columns: ColumnMetadata[] = [
	{
		name: "title",
		type: "string",
		dataType: "string",
		nullable: false,
		optional: false,
	},
	{
		name: "description",
		type: "string",
		dataType: "string",
		nullable: true,
		optional: true,
	},
];

describe("useColumnMapping", () => {
	it("auto-detects mappings for matching source headers", () => {
		const { result } = renderHook(() =>
			useColumnMapping(columns, ["title", "description"])
		);
		expect(result.current.mapping.title.sourceHeader).toBe("title");
		expect(result.current.mapping.description.sourceHeader).toBe("description");
	});

	it("flags the required column as unmapped when no header matches", () => {
		const { result } = renderHook(() =>
			useColumnMapping(columns, ["unrelated"])
		);
		expect(result.current.unmappedRequiredColumns.map((c) => c.name)).toEqual([
			"title",
		]);
	});

	it("clears the unmapped-required flag once a default value is set", () => {
		const { result } = renderHook(() =>
			useColumnMapping(columns, ["unrelated"])
		);
		act(() => result.current.setDefaultValue("title", "Untitled"));
		expect(result.current.unmappedRequiredColumns).toEqual([]);
	});

	it("lets the user manually override a source header", () => {
		const { result } = renderHook(() =>
			useColumnMapping(columns, ["title", "desc"])
		);
		act(() => result.current.setSourceHeader("description", "desc"));
		expect(result.current.mapping.description.sourceHeader).toBe("desc");
	});

	it("re-detects mappings when the source headers change (new file uploaded)", () => {
		const { result, rerender } = renderHook(
			({ headers }) => useColumnMapping(columns, headers),
			{ initialProps: { headers: ["unrelated"] } }
		);
		expect(result.current.mapping.title.sourceHeader).toBeNull();

		rerender({ headers: ["title"] });
		expect(result.current.mapping.title.sourceHeader).toBe("title");
	});
});
