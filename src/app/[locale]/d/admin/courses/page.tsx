"use client";

import { CirclePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import type { CourseMeta } from "@/components/blocks/course";
import {
	AdminCourseCard,
	CourseFilters,
	CourseGrid,
	CourseGridEmpty,
	CourseGridSkeleton,
	CoursePagination,
} from "@/components/blocks/course";
import { NewCourseDialog } from "@/components/blocks/course-builder";
import { Button } from "@/components/ui/button";
import type { UseQueryFilters } from "@/hooks/filter/filter.hooks";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { routes } from "@/lib/routes";
import type { Tables } from "@/lib/supabase/database.types";

// ─── Row shape ────────────────────────────────────────────────────────────────

type AdminCourseRow = Tables<"admin_courses_view">;

function toCourseMeta(row: AdminCourseRow): CourseMeta {
	return {
		...(row as unknown as Tables<"courses">),
		average_rating: row.avg_rating ?? 0,
		instructor: row.instructor_name
			? {
					full_name: row.instructor_name,
					avatar_url: row.instructor_avatar_url,
				}
			: null,
		subject: row.subject_name ? { name: row.subject_name } : null,
	};
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCoursesPage() {
	const t = useTranslations("courses");
	const [dialogOpen, setDialogOpen] = React.useState(false);

	// Admin sees all courses — no instructor_id scoping.
	const coursesQuery = useQueryFilters<"admin_courses_view", AdminCourseRow[]>({
		table: "admin_courses_view",
		searchColumns: ["title", "subtitle", "instructor_name"],
		initialState: {
			name: "admin-courses",
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const rows = ((coursesQuery.data as any)?.data ?? []) as AdminCourseRow[];
	const courses: CourseMeta[] = rows.map(toCourseMeta);
	const total = (coursesQuery.data as any)?.count ?? null;
	const page = coursesQuery.state.pagination?.page ?? 1;
	const pageSize = coursesQuery.state.pagination?.pageSize ?? 12;

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold">{t("allCourses")}</h1>
					{total != null && (
						<p className="mt-0.5 text-sm text-muted-foreground">
							{t("courseCount", { count: total })}
						</p>
					)}
				</div>
				<Button size="sm" onClick={() => setDialogOpen(true)}>
					<CirclePlus className="size-4" />
					{t("newCourse")}
				</Button>
			</div>

			{/* Filters — admin can also narrow by instructor */}
			<CourseFilters
				queryState={
					coursesQuery as unknown as Pick<
						UseQueryFilters<"courses">,
						"state" | "setSearch" | "setState"
					>
				}
				options={{
					showLevel: true,
					showLanguage: true,
					showPublished: true,
					showSubject: true,
					showGrade: true,
					showBook: true,
					showInstructor: true,
				}}
			/>

			{/* Grid */}
			{coursesQuery.isFetching && courses.length === 0 ? (
				<CourseGridSkeleton count={8} />
			) : courses.length === 0 ? (
				<CourseGridEmpty
					action={
						<Button size="sm" onClick={() => setDialogOpen(true)}>
							<CirclePlus className="size-4" />
							{t("newCourse")}
						</Button>
					}
				/>
			) : (
				<CourseGrid>
					{courses.map((course) => (
						<AdminCourseCard
							key={course.id}
							course={course}
							href={routes.d.admin.courses.slug.page({
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

			{/* New course dialog — admin is recorded as the instructor of record */}
			<NewCourseDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				basePath="/d/admin"
			/>
		</div>
	);
}
