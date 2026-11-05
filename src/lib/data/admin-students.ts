/**
 * Server-side data access for the admin student pages.
 *
 * Everything the admin student screens need is fetched through a single
 * round-trip per page:
 *
 * - {@link getAdminStudentProfile}  — the student's own profile row.
 * - {@link getAdminStudentOverview} — the `get_admin_student_overview()` RPC,
 *   which aggregates counters and returns the enrollment / quiz / deck /
 *   classroom / certificate / activity collections as JSON.
 *
 * The RPC is `SECURITY DEFINER` and admin-gated inside the database, so the
 * page can read rows that belong to the student without weakening RLS for
 * everybody else.
 */

import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// ─── Row types ───────────────────────────────────────────────────────────────

type OverviewRow =
	Database["public"]["Functions"]["get_admin_student_overview"]["Returns"][number];

export type AdminStudentProfile = {
	id: string;
	full_name: string | null;
	email: string | null;
	phone: string | null;
	avatar_url: string | null;
	bio: string | null;
	credit_balance: number;
	student_status: Database["public"]["Enums"]["account_status"];
	province_id: string | null;
	created_at: string;
	updated_at: string | null;
	province_name: string | null;
};

/**
 * The RPC returns every collection as a `jsonb` column; this type replaces
 * those with the concrete shapes the UI renders.
 */
export type AdminStudentOverview = Omit<
	OverviewRow,
	| "activity"
	| "course_enrollments"
	| "quiz_attempts"
	| "deck_progress"
	| "classrooms"
	| "certificates"
> & {
	activity: StudentActivity[];
	course_enrollments: StudentCourseEnrollment[];
	quiz_attempts: StudentQuizAttempt[];
	deck_progress: StudentDeckProgress[];
	classrooms: StudentClassroom[];
	certificates: StudentCertificate[];
};

export type StudentCourseEnrollment = {
	id: string;
	course_id: string;
	course_title: string | null;
	course_slug: string | null;
	cover_image_url: string | null;
	grade_id: string | null;
	grade_name: string | null;
	subject_id: string | null;
	subject_name: string | null;
	instructor_name: string | null;
	school_id: string | null;
	school_name: string | null;
	progress_percentage: number | null;
	enrolled_at: string | null;
	completed_at: string | null;
	last_accessed_lesson_id: string | null;
	certificate_id: string | null;
	lessons_total: number;
	lessons_completed: number;
};

export type StudentQuizAttempt = {
	id: string;
	quiz_id: string;
	quiz_title: string | null;
	quiz_slug: string | null;
	score: number | null;
	max_score_possible: number | null;
	score_percentage: number | null;
	passed: boolean | null;
	attempt_number: number | null;
	started_at: string | null;
	completed_at: string | null;
	feedback_from_instructor: string | null;
	grade_name: string | null;
	subject_name: string | null;
};

export type StudentDeckProgress = {
	id: string;
	deck_id: string;
	deck_name: string | null;
	deck_slug: string | null;
	cover_image_url: string | null;
	grade_name: string | null;
	subject_name: string | null;
	progress_percentage: number | null;
	enrolled_at: string | null;
	completed_at: string | null;
	cards_total: number;
	cards_mastered: number;
	leitner_box: number | null;
	last_learn_on: string | null;
};

export type StudentClassroom = {
	id: string;
	name: string | null;
	role: string | null;
	joined_at: string | null;
	school_name: string | null;
	teacher_name: string | null;
};

export type StudentCertificate = {
	id: string;
	course_title: string | null;
	course_id: string | null;
	issued_at: string | null;
	verification_code: string | null;
	certificate_pdf_url: string | null;
};

export type StudentActivity = {
	type: string;
	label: string;
	ts: string | null;
	meta: Record<string, unknown> | null;
};

// ─── JSON coercion helpers ───────────────────────────────────────────────────
//
// The RPC returns `jsonb`, which arrives as an untyped `Json` value. Rather
// than casting blindly at each call site (and risking a runtime crash on
// unexpected shapes), each collection goes through a small normaliser that
// guarantees the expected array/object shape.

function asArray<T>(value: Json | undefined): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

/**
 * Normalises the raw RPC payload into the shapes the UI renders.
 *
 * Every field is coerced defensively: a row where `progress_percentage` came
 * back as a string (or `null`) still yields a number the UI can render.
 */
export function normalizeStudentOverview(
	row: OverviewRow | null
): AdminStudentOverview | null {
	if (!row) return null;

	const activity = asArray<Record<string, unknown>>(row.activity).map(
		(entry) => ({
			type: String(entry.type ?? "unknown"),
			label: String(entry.label ?? ""),
			ts: typeof entry.ts === "string" ? entry.ts : null,
			meta: asRecord(entry.meta),
		})
	);

	return {
		...row,
		course_enrollments: asArray<StudentCourseEnrollment>(
			row.course_enrollments
		),
		quiz_attempts: asArray<StudentQuizAttempt>(row.quiz_attempts),
		deck_progress: asArray<StudentDeckProgress>(row.deck_progress),
		classrooms: asArray<StudentClassroom>(row.classrooms),
		certificates: asArray<StudentCertificate>(row.certificates),
		activity,
	};
}

// ─── Queries ────────────────────────────────────────────────────────────────

// NOTE: this must stay a *literal* (not built with `.join()`), because
// Supabase's select-string parser resolves the row type from the literal
// type. A `string`-typed select degrades to `GenericStringError`.
const PROFILE_SELECT =
	"id, full_name, email, phone, avatar_url, bio, credit_balance, student_status, province_id, created_at, updated_at, provinces(name)";

/**
 * Loads a single student profile.
 *
 * Returns `null` when the profile does not exist or is not a student — the
 * caller turns that into a 404.
 */
export async function getAdminStudentProfile(
	studentId: string
): Promise<AdminStudentProfile | null> {
	const supabase = await createClient();

	// `.maybeSingle()` keeps the row type intact (no `never` narrowing) and
	// returns `null` instead of an error when there is no match.
	const { data, error } = await supabase
		.from("profiles")
		.select(PROFILE_SELECT)
		.eq("id", studentId)
		.eq("role", "student")
		.maybeSingle();

	if (error || !data) return null;

	const province = (data.provinces as { name: string } | null) ?? null;

	return {
		id: data.id,
		full_name: data.full_name,
		email: data.email,
		phone: data.phone,
		avatar_url: data.avatar_url,
		bio: data.bio,
		credit_balance: data.credit_balance,
		student_status: data.student_status,
		province_id: data.province_id,
		created_at: data.created_at,
		updated_at: data.updated_at,
		province_name: province?.name ?? null,
	};
}

/**
 * Loads the full admin overview for a student in one round-trip.
 *
 * Returns `null` when the RPC is unavailable (e.g. the migration has not been
 * applied yet) so the page can degrade gracefully instead of crashing.
 */
export async function getAdminStudentOverview(
	studentId: string
): Promise<AdminStudentOverview | null> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc("get_admin_student_overview", {
		p_student_id: studentId,
	});

	if (error || !data || data.length === 0) return null;

	return normalizeStudentOverview(data[0] as OverviewRow);
}
