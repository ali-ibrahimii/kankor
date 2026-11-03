import { loadCourseContent } from "@/components/blocks/course-builder/actions";
import { createClient } from "@/lib/supabase/server";
import { decodeSlugParam, getSlugOrIdColumn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Loading a course for the admin builder
//
// The admin panel links a card either by slug or by id (a course's slug can be
// missing on rows created before the slug trigger, and a slug can be renamed).
// Resolving the parameter against both columns keeps those links working
// instead of dropping the admin on a 404.
// ─────────────────────────────────────────────────────────────────────────────

const COURSE_COLUMNS = "id, title, is_published, instructor_id";

export type BuilderCourse = {
	id: string;
	title: string;
	is_published: boolean;
	instructor_id: string | null;
};

export async function findCourseForBuilder(
	identifier: string
): Promise<BuilderCourse | null> {
	const value = decodeSlugParam(identifier);
	if (!value) return null;

	const supabase = await createClient();
	const primary = getSlugOrIdColumn(value);
	const columns: Array<"id" | "slug"> =
		primary === "id" ? ["id", "slug"] : ["slug", "id"];

	let lastError: string | null = null;

	for (const column of columns) {
		const { data, error } = await supabase
			.from("courses")
			.select(COURSE_COLUMNS)
			.eq(column, value)
			.maybeSingle();

		if (error) {
			lastError = error.message;
			continue;
		}
		if (data) return data as BuilderCourse;
	}

	if (lastError) {
		// Surfaces in the dev server / Vercel logs instead of a silent 404.
		console.error(
			`[admin/courses] course "${value}" could not be loaded:`,
			lastError
		);
	}

	return null;
}

export type BuilderContent = Awaited<ReturnType<typeof loadCourseContent>>;

/**
 * Loads modules/lessons/blocks. A content failure must not hide the course:
 * the builder still opens (empty) so existing content is never unreachable.
 */
export async function loadBuilderContent(courseId: string) {
	const result = await loadCourseContent(courseId);
	if (!result.success) {
		console.error(
			`[admin/courses] content for course ${courseId} failed to load:`,
			result.error
		);
		return {
			modules: [],
			lessons: [],
			blocks: [],
			error: result.error,
		};
	}
	return { ...result.data, error: null };
}
