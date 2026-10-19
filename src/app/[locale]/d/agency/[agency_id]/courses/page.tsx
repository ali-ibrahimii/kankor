"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CirclePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import type { CourseMeta } from "@/components/blocks/course";
import {
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

const SELECT =
	"id, title, subtitle, cover_image_url, level, language, is_free, price_credits, is_published, estimated_duration_hours, instructor_id";
const SEARCH_COLUMNS = ["title", "subtitle"] as const;

export default function AgencyCoursesPage({
	params,
}: {
	params: Promise<{ agency_id: string }>;
}) {
	const t = useTranslations("courses");
	const [togglingId, setTogglingId] = React.useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const { agency_id } = React.use(params);
	const basePath = `/d/agency/${agency_id}`;

	// Agency ownership scope is a fixed (non-URL-synced) filter — RLS lets
	// anyone read published courses, so a tamperable filter would widen the
	// list to every published course on the platform.
	const scopedFn = React.useMemo(
		() =>
			scopedQueryFn<"courses", CourseMeta[]>(
				SELECT,
				[...SEARCH_COLUMNS],
				[{ field: "agency_id", operator: "eq", value: agency_id }]
			),
		[agency_id]
	);

	const coursesQuery = useQueryFilters<"courses", CourseMeta[]>({
		table: "courses",
		queryFn: scopedFn,
		initialState: {
			name: `agency-courses-${agency_id}`,
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const courses = (coursesQuery.data as { data?: CourseMeta[] })?.data ?? [];
	const total = (coursesQuery.data as { count?: number })?.count ?? null;
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
			toast.success(toPublish ? t("published") : t("unpublished"));
		} catch {
			toast.error(t("publishToggleFailed"));
		} finally {
			setTogglingId(null);
		}
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-xl font-bold">{t("agencyTitle")}</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("agencySubtitle")}
					</p>
				</div>
				<Button size="sm" onClick={() => setDialogOpen(true)}>
					<CirclePlus className="size-4" />
					{t("newCourse")}
				</Button>
			</div>

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
							href={routes.d.agency.courses.new.page({
								agency_id,
								course_id: course.id,
							})}
							onPublishToggle={handlePublishToggle}
							isTogglingPublish={togglingId === course.id}
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

			<NewCourseDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				basePath={basePath}
				agencyId={agency_id}
			/>
		</div>
	);
}
