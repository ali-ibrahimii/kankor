"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import type { CourseMeta } from "@/components/blocks/course";
import {
	CourseFilters,
	CourseGrid,
	CourseGridEmpty,
	CourseGridSkeleton,
	CoursePagination,
	InstructorCourseCard,
} from "@/components/blocks/course";
import { setCoursePublished } from "@/components/blocks/course-builder/actions";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { scopedQueryFn } from "@/hooks/filter/query-state-mapping";
import type { Filter } from "@/hooks/filter/types";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { CourseStatusTab } from "../../_lib/course-status";
import { statusToPublishedFilter } from "../../_lib/course-status";

// ─── Select columns ───────────────────────────────────────────────────────────

const SELECT = "*, subject:subjects(name), grade:grades(id, name)";

// ─── Props ────────────────────────────────────────────────────────────────────

type InstructorCoursesViewProps = {
	instructorId: string;
	status: CourseStatusTab;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InstructorCoursesView({
	instructorId,
	status,
}: InstructorCoursesViewProps) {
	const t = useTranslations("courses");
	const [togglingId, setTogglingId] = React.useState<string | null>(null);

	// Owner scope (and the ?status= tab) are enforced here, not via
	// URL-synced filters — RLS lets anyone read published courses, so a
	// URL-tamperable filter would let the list widen beyond the instructor's
	// own rows. Same rationale as scopedQueryFn's docs.
	const scopedFn = React.useMemo(() => {
		const fixedFilters: Filter<"courses">[] = [
			{ field: "instructor_id", operator: "eq", value: instructorId },
		];
		const published = statusToPublishedFilter(status);
		if (published !== null) {
			fixedFilters.push({
				field: "is_published",
				operator: "eq",
				value: published,
			});
		}
		return scopedQueryFn<"courses", CourseMeta[]>(
			SELECT,
			["title", "subtitle"],
			fixedFilters
		);
	}, [instructorId, status]);

	const coursesQuery = useQueryFilters<"courses", CourseMeta[]>({
		table: "courses",
		queryFn: scopedFn,
		initialState: {
			name: "instructor-courses",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
		enabled: !!instructorId,
	});

	const courses = coursesQuery.data?.data ?? [];
	const total = coursesQuery.data?.count ?? null;
	const page = coursesQuery.state.pagination?.page ?? 1;
	const pageSize = coursesQuery.state.pagination?.pageSize ?? 12;

	async function handlePublishToggle(id: string, toPublish: boolean) {
		setTogglingId(id);
		try {
			const result = await setCoursePublished(id, toPublish);
			if (!result.success) {
				toast.error(t("publishToggleFailed"));
				return;
			}
			toast.success(toPublish ? t("published") : t("unpublished"));
			await coursesQuery.refetch();
		} finally {
			setTogglingId(null);
		}
	}

	const tabs: { value: CourseStatusTab; label: string; href: string }[] = [
		{
			value: "all",
			label: t("filterAll"),
			href: routes.d.instructor.courses.page(),
		},
		{
			value: "published",
			label: t("status_published"),
			href: routes.d.instructor.courses.page({ status: "published" }),
		},
		{
			value: "draft",
			label: t("status_draft"),
			href: routes.d.instructor.courses.page({ status: "draft" }),
		},
	];

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div>
				<h1 className="text-xl font-bold">{t("myCourses")}</h1>
				{total != null && (
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("courseCount", { count: total })}
					</p>
				)}
			</div>

			{/* Status tabs (mirrors the sidebar's ?status= links) */}
			<div className="flex flex-wrap gap-1.5">
				{tabs.map((tab) => (
					<Link
						key={tab.value}
						href={tab.href}
						className={cn(
							"rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
							status === tab.value
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-background text-muted-foreground hover:bg-muted"
						)}
					>
						{tab.label}
					</Link>
				))}
			</div>

			{/* Search + filters */}
			<CourseFilters
				queryState={coursesQuery}
				options={{
					showLevel: true,
					showLanguage: true,
					showSubject: true,
					showGrade: true,
					showBook: true,
				}}
			/>

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
						<InstructorCourseCard
							key={course.id}
							course={course}
							href={routes.d.instructor.courses.slug.page({
								slug: course.slug ?? course.id,
							})}
							onPublishToggle={handlePublishToggle}
							isTogglingPublish={togglingId === course.id}
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
