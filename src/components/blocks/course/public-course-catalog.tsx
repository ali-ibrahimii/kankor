"use client";

import { useTranslations } from "next-intl";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { routes } from "@/lib/routes";
import type { CourseMeta } from "./course-card";
import { CatalogCourseCard } from "./course-card";
import { CourseFilters } from "./course-filters";
import {
	CourseGrid,
	CourseGridEmpty,
	CourseGridSkeleton,
	CoursePagination,
} from "./course-grid";
import {
	CourseSortSelect,
	sortToValue,
	valueToSort,
} from "./course-sort-select";
import { publishedCoursesQueryFn } from "./public-course-query";

export function PublicCourseCatalog({
	initialData,
}: {
	initialData?: { data: CourseMeta[] | null; count: number | null };
} = {}) {
	const t = useTranslations("courses");

	const coursesQuery = useQueryFilters<"courses", CourseMeta[]>({
		table: "courses",
		queryFn: publishedCoursesQueryFn,
		initialData,
		initialState: {
			name: "public-courses",
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
		<div className="flex flex-col gap-6">
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

			{coursesQuery.isError ? (
				<CourseGridEmpty
					title={t("loadError")}
					description={t("loadErrorDescription")}
				/>
			) : coursesQuery.isFetching && courses.length === 0 ? (
				<CourseGridSkeleton count={pageSize} />
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
							href={routes.courses.slug.page({
								slug: course.slug ?? course.id,
							})}
						/>
					))}
				</CourseGrid>
			)}

			<CoursePagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => coursesQuery.setPagination({ page: p })}
			/>
		</div>
	);
}
