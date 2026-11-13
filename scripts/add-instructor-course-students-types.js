/**
 * Adds the `get_course_students` RPC type to
 * `src/lib/supabase/database.types.ts`.
 *
 * `pnpm gen:types` regenerates that file from a live database, so the entry
 * for the new RPC (20261113000000_instructor_course_students.sql) would only
 * appear once the migration is applied. This script writes it in the exact
 * shape the Supabase generator produces, so the app type-checks and behaves
 * identically before and after `pnpm gen:types` runs against the migrated
 * database.
 *
 * Idempotent: running it twice does not duplicate the entry.
 *
 * Usage:
 *   node scripts/add-instructor-course-students-types.js
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const TYPES_PATH = path.join(ROOT, "src/lib/supabase/database.types.ts");

const FN_NAME = "get_course_students";

const FN_ENTRY = `\t\t\t${FN_NAME}: {
\t\t\t\tArgs: { p_course_id: string };
\t\t\t\tReturns: {
\t\t\t\t\tavatar_url: string | null;
\t\t\t\t\tenrolled_at: string;
\t\t\t\t\tfull_name: string;
\t\t\t\t\tprogress_percentage: number;
\t\t\t\t\tstudent_id: string;
\t\t\t\t}[];
\t\t\t};
`;

// ─── Insertion ───────────────────────────────────────────────────────────────

function insertBefore(source, anchor, block, label) {
	// Idempotency: the block starts with the entry name, so look for that
	// exact "name: {" occurrence rather than a generic fragment that may
	// legitimately appear elsewhere in the generated file.
	const entryName = block
		.trim()
		.split("\n")[0]
		.replace(/\s*: \{$/, "");
	if (source.includes(`${entryName}: {`)) {
		return { source, changed: false, label };
	}
	const at = source.indexOf(anchor);
	if (at === -1) {
		throw new Error(`Anchor not found for ${label}: ${anchor}`);
	}
	return {
		source: source.slice(0, at) + block + source.slice(at),
		changed: true,
		label,
	};
}

function main() {
	let source = fs.readFileSync(TYPES_PATH, "utf8");

	// Functions — the generator sorts function names alphabetically.
	// "get_course_students" sorts after "get_course_id_from_section" and
	// before "get_current_user_role".
	const fnAnchor = "\t\t\tget_current_user_role: {";
	const fnResult = insertBefore(source, fnAnchor, FN_ENTRY, "functions");
	source = fnResult.source;

	fs.writeFileSync(TYPES_PATH, source);
	if (fnResult.changed) {
		console.log("✔ Added instructor course students types to database.types.ts");
		console.log(`  ${FN_NAME}`);
	} else {
		console.log(`• ${FN_NAME} already present in database.types.ts`);
	}
}

if (require.main === module) {
	main();
}

module.exports = { main };
