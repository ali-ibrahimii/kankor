import { describe, expect, it } from "vitest";
import type { ColumnMetadata } from "@/lib/generated/table-schema";
import { autoDetectColumnMapping } from "./column-matcher";

function column(
	name: string,
	overrides: Partial<ColumnMetadata> = {}
): ColumnMetadata {
	return {
		name,
		type: "string",
		dataType: "string",
		nullable: false,
		optional: true,
		...overrides,
	};
}

describe("autoDetectColumnMapping", () => {
	it("matches identical column names", () => {
		const columns = [column("title"), column("description")];
		const result = autoDetectColumnMapping(columns, ["title", "description"]);
		expect(result).toEqual({ title: "title", description: "description" });
	});

	it("matches case- and separator-insensitive variants", () => {
		const columns = [column("time_limit_minutes")];
		const result = autoDetectColumnMapping(columns, ["Time Limit Minutes"]);
		expect(result.time_limit_minutes).toBe("Time Limit Minutes");
	});

	it("matches near-miss headers via fuzzy scoring", () => {
		const columns = [column("title")];
		const result = autoDetectColumnMapping(columns, ["Quiz Title"]);
		expect(result.title).toBe("Quiz Title");
	});

	it("leaves a column unmapped when no header is close enough", () => {
		const columns = [column("passing_score_percentage")];
		const result = autoDetectColumnMapping(columns, ["unrelated_column"]);
		expect(result.passing_score_percentage).toBeNull();
	});

	it("never assigns the same source header to two destination columns", () => {
		const columns = [column("title"), column("subtitle")];
		const result = autoDetectColumnMapping(columns, ["title"]);
		const assignedHeaders = Object.values(result).filter(Boolean);
		expect(new Set(assignedHeaders).size).toBe(assignedHeaders.length);
	});
});
