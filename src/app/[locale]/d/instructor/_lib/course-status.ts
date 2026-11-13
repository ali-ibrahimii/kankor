/**
 * Status tabs for the instructor courses list, shared between the sidebar
 * links (`?status=published|draft`) and the list itself.
 *
 * `courses` has no archived state in the schema — publication is the single
 * `is_published` flag — so the tabs are exactly all/published/draft.
 */
export type CourseStatusTab = "all" | "published" | "draft";

/** Maps the `?status=` query param onto a known tab; anything else → "all". */
export function normalizeCourseStatus(
	value: string | string[] | undefined
): CourseStatusTab {
	if (value === "published" || value === "draft") return value;
	return "all";
}

/** The `is_published` value a tab pins, or null when the tab shows everything. */
export function statusToPublishedFilter(
	status: CourseStatusTab
): boolean | null {
	if (status === "published") return true;
	if (status === "draft") return false;
	return null;
}
