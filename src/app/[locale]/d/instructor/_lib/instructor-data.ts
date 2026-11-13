import { cache } from "react";
import { isSuperAdmin } from "@/lib/auth/auth.util";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/db.types";
import type { InstructorDashboardOverview } from "@/types/queries.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InstructorCourse = TableRow<"courses">;

export type CourseCardStats = {
	course_id: string;
	lessons_count: number;
	lessons_minutes: number;
	enrollments_count: number;
};

export type CourseStudent = {
	student_id: string;
	full_name: string;
	avatar_url: string | null;
	enrolled_at: string;
	progress_percentage: number;
};

export type ReviewBreakdownRow = {
	rating: number;
	count: number;
};

// ─── Course lookup ────────────────────────────────────────────────────────────

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Loads one course by slug or id for the instructor area. RLS already limits
 * instructors to their own rows; super-admins may open any course (the same
 * rule `findCourseForBuilder` applies). Returns null for missing or foreign
 * courses so callers can `notFound()`. Cached per request.
 */
export const findInstructorCourse = cache(
	async (identifier: string): Promise<InstructorCourse | null> => {
		const user = await getCurrentUser();
		if (!user) return null;

		const supabase = await createClient();
		const trimmed = identifier.trim();
		const base = supabase.from("courses").select("*");
		const { data, error } = UUID_RE.test(trimmed)
			? await base.eq("id", trimmed).maybeSingle()
			: await base.eq("slug", trimmed).maybeSingle();

		if (error || !data) return null;
		if (!isSuperAdmin(user) && data.instructor_id !== user.id) return null;
		return data;
	}
);

// ─── Aggregates (SECURITY DEFINER RPCs) ──────────────────────────────────────

/**
 * Lesson/enrollment counts for a set of courses. `enrollments` is not directly
 * readable by instructors, so counts come from `get_course_card_stats`.
 */
export async function getCourseCardStats(
	courseIds: string[]
): Promise<CourseCardStats[]> {
	if (courseIds.length === 0) return [];
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("get_course_card_stats", {
		p_course_ids: courseIds,
	});
	if (error || !data) return [];
	return data;
}

/**
 * Per-course roster via `get_course_students` — a SECURITY DEFINER RPC that
 * only the course instructor (or a platform admin) may call.
 */
export async function getCourseStudents(
	courseId: string
): Promise<CourseStudent[]> {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("get_course_students", {
		p_course_id: courseId,
	});
	if (error || !data) return [];
	return data;
}

/** Rating histogram for one course. */
export async function getCourseReviewBreakdown(
	courseId: string
): Promise<ReviewBreakdownRow[]> {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("get_review_breakdown", {
		p_course_id: courseId,
	});
	if (error || !data) return [];
	return data;
}

/**
 * The six-stat overview plus recent activity and the 14-day earnings trend.
 * Throws on failure so the segment's `error.tsx` boundary can offer a retry.
 */
export async function getInstructorOverview(): Promise<InstructorDashboardOverview | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.rpc("get_instructor_dashboard_overview")
		.single();
	if (error) throw error;
	return data as unknown as InstructorDashboardOverview;
}
