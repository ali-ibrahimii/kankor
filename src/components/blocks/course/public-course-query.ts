import { defaultQueryFn } from "@/hooks/filter/query-state-mapping";
import type { QueryFn } from "@/hooks/filter/types";
import type { CourseMeta } from "./course-card";

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

export const publishedCoursesQueryFn: QueryFn<"courses", CourseMeta[]> = (
	client,
	table,
	state,
	single
) =>
	defaultQueryFn<"courses", CourseMeta[]>(PUBLIC_COURSE_SELECT, [
		"title",
		"subtitle",
	])(
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
