"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import type { CourseMeta } from "@/components/blocks/course";
import {
	CatalogCourseCard,
	CourseFilters,
	CourseGrid,
	CourseGridEmpty,
	CourseGridSkeleton,
	CoursePagination,
} from "@/components/blocks/course";
import {
	CourseSortSelect,
	sortToValue,
	valueToSort,
} from "@/components/blocks/course/course-sort-select";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { defaultQueryFn } from "@/hooks/filter/query-state-mapping";
import type { QueryFn } from "@/hooks/filter/types";
import { routes } from "@/lib/routes";

// ─── Select columns ───────────────────────────────────────────────────────────

const SELECT =
	"id, slug, title, subtitle, cover_image_url, level, language, is_free, price_credits, is_published, estimated_duration_hours, created_at, instructor:profiles!courses_instructor_id_fkey(full_name, avatar_url), subject:subjects(name)";

// Students only ever browse published courses; enforce it in the query instead
// of URL filter state so it never shows up as a removable filter chip.
const publishedCoursesQueryFn: QueryFn<"courses", CourseMeta[]> = (
	client,
	table,
	state,
	single
) =>
	defaultQueryFn<"courses", CourseMeta[]>(SELECT, ["title", "subtitle"])(
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllCoursesPage() {
	const t = useTranslations("courses");

	const coursesQuery = useQueryFilters<"courses", CourseMeta[]>({
		table: "courses",
		queryFn: publishedCoursesQueryFn,
		initialState: {
			name: "all-courses",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const courses = ((coursesQuery.data as any)?.data ?? []) as CourseMeta[];
	const total = ((coursesQuery.data as any)?.count ?? null) as number | null;
	const page = coursesQuery.state.pagination?.page ?? 1;
	const pageSize = coursesQuery.state.pagination?.pageSize ?? 12;

	const sortValue = sortToValue(coursesQuery.state.sort);

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div>
				<h1 className="text-xl font-bold">{t("allCourses")}</h1>
				{total != null && (
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("courseCount", { count: total })}
					</p>
				)}
			</div>

			{/* Search + filters + sort */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start">
				<CourseFilters
					className="flex-1"
					queryState={coursesQuery}
					options={{
						showLevel: true,
						showLanguage: true,
						showSubject: true,
						showGrade: true,
						showBook: true,
						showPricing: true,
					}}
				/>
				<CourseSortSelect
					value={sortValue}
					onChange={(value) =>
						coursesQuery.setState((prev) => ({
							...prev,
							sort: valueToSort(value),
						}))
					}
				/>
			</div>

			{/* Grid */}
			{coursesQuery.isError ? (
				<CourseGridEmpty
					title={t("loadError")}
					description={t("loadErrorDescription")}
				/>
			) : coursesQuery.isFetching && courses.length === 0 ? (
				<CourseGridSkeleton count={8} />
			) : courses.length === 0 ? (
				<CourseGridEmpty
					title={t("noCoursesFound")}
					description={t("noCoursesDescription")}
				/>
			) : (
				<CourseGrid>
					{courses.map((course) => (
						<CatalogCourseCard
							key={course.id}
							course={course}
							href={routes.d.courses.slug.page({
								slug: course.slug ?? course.id,
							})}
						/>
					))}
				</CourseGrid>
			)}

			{/* Pagination */}
			<CoursePagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => coursesQuery.setPagination({ page: p })}
			/>
		</div>
	);
}
