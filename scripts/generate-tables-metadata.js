#!/usr/bin/env node

/**
 * Generates `src/lib/generated/table-schema.ts` from the Supabase-generated
 * `src/lib/supabase/database.types.ts` file.
 *
 * The output is a plain, serializable metadata object describing every
 * table/view in the `public` schema (columns, TypeScript types, nullability,
 * insert-optionality, and a normalized `dataType` used by the generic import
 * engine for auto-mapping/validation/coercion).
 *
 * Usage:
 *   node scripts/generate-tables-metadata.js
 *
 * This runs automatically as part of `pnpm gen:types`, so the metadata stays
 * in sync whenever the Supabase types are regenerated. Run it on its own via
 * `pnpm gen:table-schema` after manually editing `database.types.ts`.
 */

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.join(__dirname, "..");
const DATABASE_TYPES_PATH = path.join(
	ROOT,
	"src/lib/supabase/database.types.ts"
);
const OUTPUT_PATH = path.join(ROOT, "src/lib/generated/table-schema.ts");

// ─────────────────────────────────────────────
// AST helpers
// ─────────────────────────────────────────────

/** Reads the textual name of a PropertySignature/TypeElement name node. */
function getPropertyName(name) {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
	return name.getText();
}

/** Finds a member with the given name inside a TypeLiteralNode. */
function findMember(typeLiteral, name) {
	if (!typeLiteral || !ts.isTypeLiteralNode(typeLiteral)) return undefined;
	return typeLiteral.members.find(
		(m) => m.name && getPropertyName(m.name) === name
	);
}

/**
 * Strips a `| null` union member from a type node.
 * Returns the remaining type node(s) joined back as text, plus whether null
 * was present.
 */
function unwrapNullable(typeNode, sourceFile) {
	if (!ts.isUnionTypeNode(typeNode)) {
		return { typeNode, nullable: false, text: typeNode.getText(sourceFile) };
	}

	const isNullLiteral = (t) =>
		ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword;

	const remaining = typeNode.types.filter((t) => !isNullLiteral(t));
	const nullable = remaining.length !== typeNode.types.length;

	if (remaining.length === 1) {
		return {
			typeNode: remaining[0],
			nullable,
			text: remaining[0].getText(sourceFile),
		};
	}

	return {
		typeNode: remaining[0],
		nullable,
		text: remaining.map((t) => t.getText(sourceFile)).join(" | "),
	};
}

/**
 * Walks an `A["b"]["c"]` IndexedAccessType chain and returns the string keys
 * in order, e.g. `["public", "Enums", "show_correct_answers"]`.
 */
function collectIndexChain(node) {
	if (ts.isIndexedAccessTypeNode(node)) {
		const key = ts.isLiteralTypeNode(node.indexType)
			? node.indexType.literal.text
			: node.indexType.getText();
		return [...collectIndexChain(node.objectType), key];
	}
	return [];
}

/**
 * Classifies a (already null-stripped) type node into the normalized
 * `dataType` used by the import engine, resolving enum references against
 * the previously-collected `enumMap`.
 */
function classifyType(typeNode, enumMap) {
	if (!typeNode) return { dataType: "unknown" };

	switch (typeNode.kind) {
		case ts.SyntaxKind.StringKeyword:
			return { dataType: "string" };
		case ts.SyntaxKind.NumberKeyword:
			return { dataType: "number" };
		case ts.SyntaxKind.BooleanKeyword:
			return { dataType: "boolean" };
		default:
			break;
	}

	if (ts.isArrayTypeNode(typeNode)) {
		const element = classifyType(typeNode.elementType, enumMap);
		return { dataType: "array", elementDataType: element.dataType };
	}

	if (ts.isTypeReferenceNode(typeNode)) {
		const name = typeNode.typeName.getText();
		if (name === "Json") return { dataType: "json" };
		return { dataType: "unknown" };
	}

	if (ts.isIndexedAccessTypeNode(typeNode)) {
		const chain = collectIndexChain(typeNode);
		if (chain.length >= 2 && chain[chain.length - 2] === "Enums") {
			const enumName = chain[chain.length - 1];
			return { dataType: "enum", enumValues: enumMap[enumName] ?? [] };
		}
		return { dataType: "unknown" };
	}

	if (ts.isUnionTypeNode(typeNode)) {
		const allStringLiterals = typeNode.types.every(
			(t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)
		);
		if (allStringLiterals) {
			return {
				dataType: "enum",
				enumValues: typeNode.types.map((t) => t.literal.text),
			};
		}
	}

	return { dataType: "unknown" };
}

/** Parses the string-literal union of an Enums member into a string[]. */
function parseEnumValues(typeNode) {
	if (!typeNode || !ts.isUnionTypeNode(typeNode)) return [];
	return typeNode.types
		.filter((t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal))
		.map((t) => t.literal.text);
}

// ─────────────────────────────────────────────
// Schema extraction
// ─────────────────────────────────────────────

function buildEnumMap(publicType) {
	const enumsMember = findMember(publicType, "Enums");
	const enumsType = enumsMember?.type;
	const enumMap = {};

	if (enumsType && ts.isTypeLiteralNode(enumsType)) {
		for (const member of enumsType.members) {
			if (!ts.isPropertySignature(member) || !member.name || !member.type)
				continue;
			enumMap[getPropertyName(member.name)] = parseEnumValues(member.type);
		}
	}

	return enumMap;
}

/** Extracts optional-on-insert flags for every column of a table's Insert type. */
function buildInsertOptionality(tableType) {
	const insertMember = findMember(tableType, "Insert");
	const insertType = insertMember?.type;
	const optionality = {};

	if (insertType && ts.isTypeLiteralNode(insertType)) {
		for (const member of insertType.members) {
			if (!ts.isPropertySignature(member) || !member.name) continue;
			optionality[getPropertyName(member.name)] = Boolean(member.questionToken);
		}
	}

	return optionality;
}

function buildColumns(tableType, enumMap, sourceFile) {
	const rowMember = findMember(tableType, "Row");
	const rowType = rowMember?.type;
	if (!rowType || !ts.isTypeLiteralNode(rowType)) return [];

	const insertOptionality = buildInsertOptionality(tableType);

	return rowType.members
		.filter((m) => ts.isPropertySignature(m) && m.name && m.type)
		.map((member) => {
			const name = getPropertyName(member.name);
			const { typeNode, nullable, text } = unwrapNullable(
				member.type,
				sourceFile
			);
			const { dataType, enumValues, elementDataType } = classifyType(
				typeNode,
				enumMap
			);

			// A column is optional for import purposes when the generated Insert
			// type marks it optional (nullable columns, columns with a DB default,
			// or generated/identity columns all surface as `field?:` there).
			const optional = insertOptionality[name] ?? nullable;

			const column = {
				name,
				type: text,
				dataType,
				nullable,
				optional,
			};
			if (enumValues) column.enumValues = enumValues;
			if (elementDataType) column.elementDataType = elementDataType;
			return column;
		});
}

function extractSchema(sourceFile) {
	let databaseType;
	ts.forEachChild(sourceFile, (node) => {
		if (ts.isTypeAliasDeclaration(node) && node.name.text === "Database") {
			databaseType = node.type;
		}
	});

	if (!databaseType || !ts.isTypeLiteralNode(databaseType)) {
		throw new Error(
			`Could not find a "Database" type alias in ${DATABASE_TYPES_PATH}`
		);
	}

	const publicMember = findMember(databaseType, "public");
	const publicType = publicMember?.type;
	if (!publicType || !ts.isTypeLiteralNode(publicType)) {
		throw new Error('Could not find the "public" schema in the Database type.');
	}

	const enumMap = buildEnumMap(publicType);
	const schema = {};

	for (const sectionName of ["Tables", "Views"]) {
		const sectionMember = findMember(publicType, sectionName);
		const sectionType = sectionMember?.type;
		if (!sectionType || !ts.isTypeLiteralNode(sectionType)) continue;

		for (const tableMember of sectionType.members) {
			if (!ts.isPropertySignature(tableMember) || !tableMember.name) continue;
			const tableType = tableMember.type;
			if (!tableType || !ts.isTypeLiteralNode(tableType)) continue;

			const tableName = getPropertyName(tableMember.name);
			const columns = buildColumns(tableType, enumMap, sourceFile);
			if (columns.length === 0) continue;

			schema[tableName] = {
				kind: sectionName === "Tables" ? "table" : "view",
				columns,
			};
		}
	}

	return schema;
}

// ─────────────────────────────────────────────
// Output rendering
// ─────────────────────────────────────────────

function renderSchema(schema) {
	const tableNames = Object.keys(schema).sort();

	const body = tableNames
		.map((tableName) => {
			const table = schema[tableName];
			const columns = table.columns
				.map((col) => {
					const fields = [
						`name: ${JSON.stringify(col.name)}`,
						`type: ${JSON.stringify(col.type)}`,
						`dataType: ${JSON.stringify(col.dataType)}`,
						`nullable: ${col.nullable}`,
						`optional: ${col.optional}`,
					];
					if (col.enumValues) {
						fields.push(`enumValues: ${JSON.stringify(col.enumValues)}`);
					}
					if (col.elementDataType) {
						fields.push(
							`elementDataType: ${JSON.stringify(col.elementDataType)}`
						);
					}
					return `\t\t\t{ ${fields.join(", ")} },`;
				})
				.join("\n");

			return `\t${JSON.stringify(tableName)}: {\n\t\tkind: ${JSON.stringify(
				table.kind
			)},\n\t\tcolumns: [\n${columns}\n\t\t],\n\t},`;
		})
		.join("\n");

	return `// AUTO-GENERATED FILE — DO NOT EDIT
// Generated by \`node scripts/generate-tables-metadata.js\` from
// \`src/lib/supabase/database.types.ts\`. Re-run \`pnpm gen:table-schema\`
// (or \`pnpm gen:types\`, which chains it) whenever the database schema changes.

/** Normalized, coercion-friendly category derived from a column's TypeScript type. */
export type ColumnDataType =
	| "string"
	| "number"
	| "boolean"
	| "json"
	| "enum"
	| "array"
	| "unknown";

export interface ColumnMetadata {
	name: string;
	/** Raw TypeScript type text (as printed from database.types.ts), e.g. "string", "number", "\\"a\\" | \\"b\\"". */
	type: string;
	/** Normalized category used for auto-mapping, validation, and value coercion. */
	dataType: ColumnDataType;
	/** Whether the database row's type includes \`| null\`. */
	nullable: boolean;
	/** Whether the column may be omitted on insert (nullable, has a DB default, or is generated). */
	optional: boolean;
	/** Present when dataType is "enum": the allowed literal values. */
	enumValues?: string[];
	/** Present when dataType is "array": the normalized category of each element. */
	elementDataType?: ColumnDataType;
}

export interface TableMetadata {
	kind: "table" | "view";
	columns: ColumnMetadata[];
}

export const TABLE_SCHEMA = {
${body}
} as const satisfies Record<string, TableMetadata>;

export type ImportableTableName = keyof typeof TABLE_SCHEMA;
`;
}

// ─────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────

function main() {
	const source = fs.readFileSync(DATABASE_TYPES_PATH, "utf8");
	const sourceFile = ts.createSourceFile(
		DATABASE_TYPES_PATH,
		source,
		ts.ScriptTarget.Latest,
		true
	);

	const schema = extractSchema(sourceFile);
	const output = renderSchema(schema);

	fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
	fs.writeFileSync(OUTPUT_PATH, output);

	console.log(
		`Generated table schema metadata for ${Object.keys(schema).length} tables/views -> ${path.relative(ROOT, OUTPUT_PATH)}`
	);
}

if (require.main === module) {
	main();
}

module.exports = { extractSchema, renderSchema };
