import ts from "typescript";
import { describe, expect, it } from "vitest";
import generator from "./generate-tables-metadata.js";

const { extractSchema } = generator;

const FIXTURE = `
export type Database = {
	public: {
		Tables: {
			widgets: {
				Row: {
					id: string;
					title: string;
					description: string | null;
					price: number;
					in_stock: boolean | null;
					status: Database["public"]["Enums"]["widget_status"];
					tags: string[] | null;
					metadata: Json | null;
				};
				Insert: {
					id?: string;
					title: string;
					description?: string | null;
					price: number;
					in_stock?: boolean | null;
					status?: Database["public"]["Enums"]["widget_status"];
					tags?: string[] | null;
					metadata?: Json | null;
				};
				Update: {
					id?: string;
					title?: string;
					description?: string | null;
					price?: number;
					in_stock?: boolean | null;
					status?: Database["public"]["Enums"]["widget_status"];
					tags?: string[] | null;
					metadata?: Json | null;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Enums: {
			widget_status: "draft" | "published";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};
`;

function parseFixture() {
	const sourceFile = ts.createSourceFile(
		"database.types.ts",
		FIXTURE,
		ts.ScriptTarget.Latest,
		true
	);
	return extractSchema(sourceFile);
}

describe("generate-tables-metadata: extractSchema", () => {
	it("extracts a table with its column metadata", () => {
		const schema = parseFixture();
		expect(Object.keys(schema)).toEqual(["widgets"]);
		expect(schema.widgets.kind).toBe("table");
	});

	it("marks a column required only when it's non-nullable and non-optional on insert", () => {
		const { columns } = parseFixture().widgets;
		const title = columns.find((c) => c.name === "title");
		expect(title).toMatchObject({
			dataType: "string",
			nullable: false,
			optional: false,
		});
	});

	it("marks generated/default columns (id) as optional despite being non-nullable", () => {
		const { columns } = parseFixture().widgets;
		const id = columns.find((c) => c.name === "id");
		expect(id).toMatchObject({
			dataType: "string",
			nullable: false,
			optional: true,
		});
	});

	it("detects nullable columns", () => {
		const { columns } = parseFixture().widgets;
		const description = columns.find((c) => c.name === "description");
		expect(description).toMatchObject({ nullable: true, optional: true });
	});

	it("classifies number and boolean columns", () => {
		const { columns } = parseFixture().widgets;
		expect(columns.find((c) => c.name === "price")).toMatchObject({
			dataType: "number",
			optional: false,
		});
		expect(columns.find((c) => c.name === "in_stock")).toMatchObject({
			dataType: "boolean",
			nullable: true,
		});
	});

	it("resolves enum references against the Enums map", () => {
		const { columns } = parseFixture().widgets;
		const status = columns.find((c) => c.name === "status");
		expect(status.dataType).toBe("enum");
		expect(status.enumValues).toEqual(["draft", "published"]);
	});

	it("classifies array and Json columns", () => {
		const { columns } = parseFixture().widgets;
		expect(columns.find((c) => c.name === "tags")).toMatchObject({
			dataType: "array",
			elementDataType: "string",
		});
		expect(columns.find((c) => c.name === "metadata")).toMatchObject({
			dataType: "json",
		});
	});
});
