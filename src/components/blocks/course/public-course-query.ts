import { defaultQueryFn } from "@/hooks/filter/query-state-mapping";
import type { QueryFn } from "@/hooks/filter/types";
import type { CourseMeta } from "./course-card";

// No instructor embed here: `profiles` has no anon SELECT policy, so joining it
// on a signed-out-accessible page would 401 the whole query. CatalogCourseCard
// treats `instructor` as optional and simply omits the byline when it's absent.
export const PUBLIC_COURSE_SELECT =
	"id, slug, title, subtitle, cover_image_url, level, language, is_free, price_credits, is_published, estimated_duration_hours, created_at, subject:subjects(name)";

/** Course listing query scoped to published courses — safe for signed-out visitors. */
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
				{ field: "is_published", operator: "eq", value: true },
			],
		},
		single
	);
