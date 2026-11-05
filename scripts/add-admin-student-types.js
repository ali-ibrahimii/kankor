/**
 * Adds the admin-student-overview types to `src/lib/supabase/database.types.ts`.
 *
 * `pnpm gen:types` regenerates that file from a live database, so the entries
 * for the new RPCs and the new view would only appear once the migration is
 * applied. This script writes them in the exact shape the Supabase generator
 * produces, so the app type-checks and behaves identically before and after
 * `pnpm gen:types` runs against the migrated database.
 *
 * Idempotent: running it twice does not duplicate the entries.
 *
 * Usage:
 *   node scripts/add-admin-student-types.js
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const TYPES_PATH = path.join(ROOT, "src/lib/supabase/database.types.ts");

// ─── View: admin_students_view ──────────────────────────────────────────────

const VIEW_NAME = "admin_students_view";

const VIEW_ENTRY = `\t\t\t${VIEW_NAME}: {
\t\t\t\tRow: {
\t\t\t\t\tactive_decks_count: number | null;
\t\t\t\t\taverage_quiz_score: number | null;
\t\t\t\t\tavatar_url: string | null;
\t\t\t\t\tbookmarks_count: number | null;
\t\t\t\t\tcertificates_count: number | null;
\t\t\t\t\tclassrooms_count: number | null;
\t\t\t\t\tcompleted_courses_count: number | null;
\t\t\t\t\tcreated_at: string | null;
\t\t\t\t\tcredit_balance: number | null;
\t\t\t\t\tdistinct_grades_count: number | null;
\t\t\t\t\tdistinct_subjects_count: number | null;
\t\t\t\t\temail: string | null;
\t\t\t\t\tenrolled_courses_count: number | null;
\t\t\t\t\tfull_name: string | null;
\t\t\t\t\tgrade_names: string | null;
\t\t\t\t\tid: string | null;
\t\t\t\t\tlast_activity_at: string | null;
\t\t\t\t\tnotes_count: number | null;
\t\t\t\t\tphone: string | null;
\t\t\t\t\tprovince_id: string | null;
\t\t\t\t\tprovince_name: string | null;
\t\t\t\t\tquiz_attempts_count: number | null;
\t\t\t\t\tquizzes_passed_count: number | null;
\t\t\t\t\tstudent_status:
\t\t\t\t\t\t| Database["public"]["Enums"]["account_status"]
\t\t\t\t\t\t| null;
\t\t\t\t\tsubject_names: string | null;
\t\t\t\t\tupdated_at: string | null;
\t\t\t\t};
\t\t\t\tRelationships: [
\t\t\t\t\t{
\t\t\t\t\t\tforeignKeyName: "profiles_province_id_fkey";
\t\t\t\t\t\tcolumns: ["province_id"];
\t\t\t\t\t\tisOneToOne: false;
\t\t\t\t\t\treferencedRelation: "provinces";
\t\t\t\t\t\treferencedColumns: ["id"];
\t\t\t\t\t},
\t\t\t\t];
\t\t\t};
`;

// ─── Functions ───────────────────────────────────────────────────────────────

const SINGLE_FN_NAME = "get_admin_student_overview";

const SINGLE_FN_ENTRY = `\t\t\t${SINGLE_FN_NAME}: {
\t\t\t\tArgs: { p_student_id: string };
\t\t\t\tReturns: {
\t\t\t\t\tactive_decks_count: number;
\t\t\t\t\tactivity: Json;
\t\t\t\t\taverage_quiz_score: number;
\t\t\t\t\tbest_quiz_score: number;
\t\t\t\t\tbookmarks_count: number;
					certificates: Json;
\t\t\t\t\tcertificates_count: number;
\t\t\t\t\tclassrooms: Json;
\t\t\t\t\tclassrooms_count: number;
\t\t\t\t\tcompleted_courses_count: number;
\t\t\t\t\tcourse_enrollments: Json;
\t\t\t\t\tdeck_progress: Json;
\t\t\t\t\tdistinct_grades_count: number;
\t\t\t\t\tdistinct_subjects_count: number;
\t\t\t\t\tenrolled_courses_count: number;
\t\t\t\t\tfirst_enrolled_at: string | null;
\t\t\t\t\tin_progress_courses_count: number;
\t\t\t\t\tlast_activity_at: string | null;
\t\t\t\t\tlessons_completed_count: number;
\t\t\t\t\tnotes_count: number;
\t\t\t\t\tquiz_attempts: Json;
\t\t\t\t\tquiz_attempts_count: number;
\t\t\t\t\tquizzes_failed_count: number;
\t\t\t\t\tquizzes_passed_count: number;
\t\t\t\t\tstudy_minutes_count: number;
\t\t\t\t}[];
\t\t\t};
`;

const BATCH_FN_NAME = "get_admin_students_overview";

const BATCH_FN_ENTRY = `\t\t\t${BATCH_FN_NAME}: {
\t\t\t\tArgs: Record<PropertyKey, never>;
\t\t\t\tReturns: {
\t\t\t\t\tactive_decks_count: number;
\t\t\t\t\taverage_quiz_score: number;
\t\t\t\t\tbookmarks_count: number;
\t\t\t\t\tcertificates_count: number;
\t\t\t\t\tclassrooms_count: number;
\t\t\t\t\tcompleted_courses_count: number;
\t\t\t\t\tdistinct_grades_count: number;
\t\t\t\t\tdistinct_subjects_count: number;
\t\t\t\t\temail: string | null;
\t\t\t\t\tenrolled_courses_count: number;
\t\t\t\t\tfull_name: string | null;
\t\t\t\t\tgrade_names: string | null;
\t\t\t\t\tlast_activity_at: string | null;
\t\t\t\t\tnotes_count: number;
\t\t\t\t\tquiz_attempts_count: number;
\t\t\t\t\tquizzes_passed_count: number;
\t\t\t\t\tsubject_names: string | null;
\t\t\t\t\tuser_id: string;
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

	// View — the generator sorts view names alphabetically; "admin_students_view"
	// comes after "admin_schools_view" and before "agency_disputes_view".
	// The anchor must be inside the `Views:` block, not the `Tables:` one.
	const viewAnchor = "\t\t\tagency_disputes_view: {";
	const viewResult = insertBefore(source, viewAnchor, VIEW_ENTRY, "view");
	source = viewResult.source;

	// Functions — the generator sorts function names alphabetically too.
	// "get_admin_student_overview" and "get_admin_students_overview" both
	// sort right after "get_admin_instructor_overview".
	const fnAnchor = "\t\t\tget_agency_overview: {";
	const fnResult = insertBefore(
		source,
		fnAnchor,
		SINGLE_FN_ENTRY + BATCH_FN_ENTRY,
		"functions"
	);
	source = fnResult.source;

	fs.writeFileSync(TYPES_PATH, source);
	console.log("✔ Added admin student overview types to database.types.ts");
	console.log(`  ${VIEW_NAME}`);
	console.log(`  ${SINGLE_FN_NAME}`);
	console.log(`  ${BATCH_FN_NAME}`);
}

if (require.main === module) {
	main();
}

module.exports = { main };
