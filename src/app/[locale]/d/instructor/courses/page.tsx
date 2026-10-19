"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CirclePlus } from "lucide-react";
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
import { NewCourseDialog } from "@/components/blocks/course-builder";
import { Button } from "@/components/ui/button";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { scopedQueryFn } from "@/hooks/filter/query-state-mapping";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { useAuthProfile } from "@/providers/auth.provider";

// ─── Select columns ───────────────────────────────────────────────────────────

const SELECT =
	"id, title, subtitle, cover_image_url, level, language, is_free, price_credits, is_published, estimated_duration_hours, instructor_id";
const SEARCH_COLUMNS = ["title", "subtitle"] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstructorCoursesPage() {
	const t = useTranslations("courses");
	const profile = useAuthProfile();
	const instructorId = profile?.id;
	const [togglingId, setTogglingId] = React.useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const queryClient = useQueryClient();

	// Owner scope is enforced here, not via a URL-synced filter — RLS lets
	// anyone read published courses, so a URL-tamperable filter would let an
	// instructor widen this list to every published course on the platform.
	const scopedFn = React.useMemo(
		() =>
			scopedQueryFn<"courses", CourseMeta[]>(
				SELECT,
				[...SEARCH_COLUMNS],
				instructorId
					? [{ field: "instructor_id", operator: "eq", value: instructorId }]
					: []
			),
		[instructorId]
	);

	const coursesQuery = useQueryFilters<"courses", CourseMeta[]>({
		table: "courses",
		queryFn: scopedFn,
		initialState: {
			name: "instructor-courses",
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
		enabled: !!instructorId,
	});

	const courses = (coursesQuery.data as any)?.data ?? [];
	const total = (coursesQuery.data as any)?.count ?? null;
	const page = coursesQuery.state.pagination?.page ?? 1;
	const pageSize = coursesQuery.state.pagination?.pageSize ?? 12;

	async function handlePublishToggle(courseId: string, toPublish: boolean) {
		setTogglingId(courseId);
		try {
			const client = createClient();
			const { error } = await client
				.from("courses")
				.update({ is_published: toPublish })
				.eq("id", courseId);
			if (error) throw error;
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(toPublish ? "Course published." : "Course unpublished.");
		} catch {
			toast.error("Failed to update publish status.");
		} finally {
			setTogglingId(null);
		}
	}

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold">{t("myCourses")}</h1>
					{total != null && (
						<p className="mt-0.5 text-sm text-muted-foreground">
							{total} {total === 1 ? "course" : "courses"}
						</p>
					)}
				</div>
				<Button size="sm" onClick={() => setDialogOpen(true)}>
					<CirclePlus className="size-4" />
					{t("newCourse")}
				</Button>
			</div>

			{/* Filters */}
			<CourseFilters
				queryState={coursesQuery}
				options={{ showLevel: true, showLanguage: true, showPublished: true }}
			/>

			{/* Grid */}
			{coursesQuery.isFetching && courses.length === 0 ? (
				<CourseGridSkeleton count={6} />
			) : courses.length === 0 ? (
				<CourseGridEmpty
					title={t("noCoursesFound")}
					description={t("noCoursesDescription")}
					action={
						<Button size="sm" onClick={() => setDialogOpen(true)}>
							<CirclePlus className="size-4" />
							{t("newCourse")}
						</Button>
					}
				/>
			) : (
				<CourseGrid>
					{courses.map((course: CourseMeta) => (
						<InstructorCourseCard
							key={course.id}
							course={course}
							href={routes.d.instructor.courses.new.page({
								course_id: course.id,
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

			{/* New course dialog */}
			<NewCourseDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				basePath={routes.d.instructor.page()}
			/>
		</div>
	);
}
