"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import type { CourseMeta, EnrollmentMeta } from "@/components/blocks/course";
import {
	CourseGrid,
	CourseGridEmpty,
	CourseGridSkeleton,
	EnrolledCourseCard,
} from "@/components/blocks/course";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { useAuthProfile } from "@/providers/auth.provider";

// ─── Fetch enrolled courses ───────────────────────────────────────────────────

async function fetchEnrolledCourses(userId: string) {
	const client = createClient();
	const { data, error } = await client
		.from("enrollments")
		.select(
			`
      id,
      progress_percentage,
      last_accessed_lesson_id,
      completed_at,
      enrolled_at,
      courses (
        id, slug, title, subtitle, cover_image_url, level, language,
        is_free, price_credits, is_published, estimated_duration_hours
      )
    `
		)
		.eq("user_id", userId)
		.not("course_id", "is", null)
		.order("enrolled_at", { ascending: false });

	if (error) throw error;
	return data ?? [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyCoursesPage() {
	const t = useTranslations("courses");
	const profile = useAuthProfile();
	const userId = profile?.id;

	const {
		data: enrollments,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["enrollments", userId],
		queryFn: () => fetchEnrolledCourses(userId!),
		enabled: !!userId,
	});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-xl font-bold">{t("myCourses")}</h1>
				{enrollments != null && (
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("courseCount", { count: enrollments.length })}
					</p>
				)}
			</div>

			{/* Grid */}
			{isError ? (
				<CourseGridEmpty
					title={t("loadError")}
					description={t("loadErrorDescription")}
				/>
			) : isLoading ? (
				<CourseGridSkeleton count={6} />
			) : !enrollments || enrollments.length === 0 ? (
				<CourseGridEmpty
					title={t("noEnrolledCourses")}
					description={t("noEnrolledCoursesDescription")}
					action={
						<Button asChild size="sm" variant="outline">
							<Link href={routes.d.courses.page()}>{t("browseCatalog")}</Link>
						</Button>
					}
				/>
			) : (
				<CourseGrid>
					{enrollments.map((enrollment) => {
						const course = enrollment.courses as unknown as CourseMeta;
						if (!course) return null;

						const enrollmentMeta: EnrollmentMeta = {
							progress_percentage: enrollment.progress_percentage,
							last_accessed_lesson_id: enrollment.last_accessed_lesson_id,
							completed_at: enrollment.completed_at,
							enrolled_at: enrollment.enrolled_at,
						};

						return (
							<EnrolledCourseCard
								key={enrollment.id}
								course={course}
								enrollment={enrollmentMeta}
								href={routes.d.courses.slug.page({
									slug: course.slug ?? course.id,
								})}
								resumeHref={routes.d.myCourses.slug.page({
									slug: course.slug ?? course.id,
								})}
							/>
						);
					})}
				</CourseGrid>
			)}
		</div>
	);
}
