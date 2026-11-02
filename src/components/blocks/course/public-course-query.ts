import { defaultQueryFn } from "@/hooks/filter/query-state-mapping";
import type { QueryFn } from "@/hooks/filter/types";
import type { CourseMeta } from "./course-card";
import { fetchCourseCardStats, withCourseCardStats } from "./course-stats";

export const PUBLIC_COURSE_SELECT = `
	id,
	slug,
	title,
	subtitle,
	cover_image_url,
	level,
	language,
	is_free,
	price_credits,
	is_published,
	estimated_duration_hours,
	created_at,
	grade_id,
	subject_id,
	grade:grades(id, name),
	subject:subjects(name)
`;

export const publishedCoursesQueryFn: QueryFn<"courses", CourseMeta[]> = async (
	client,
	table,
	state,
	single
) => {
	const result = await defaultQueryFn<"courses", CourseMeta[]>(
		PUBLIC_COURSE_SELECT,
		["title", "subtitle"]
	)(
		client,
		table,
		{
			...state,
			filters: [
				...(state?.filters ?? []),
				{
					field: "is_published",
					operator: "eq",
					value: true,
				},
			],
		},
		single
	);

	const courses = result.data as CourseMeta[] | null;
	if (!courses || courses.length === 0) return result;

	// Lessons/enrollments are not readable by signed-out visitors, so the
	// card numbers arrive through the get_course_card_stats aggregate.
	const stats = await fetchCourseCardStats(
		client,
		courses.map((course) => course.id)
	);

	return {
		...result,
		data: withCourseCardStats(courses, stats),
	} as typeof result;
};
