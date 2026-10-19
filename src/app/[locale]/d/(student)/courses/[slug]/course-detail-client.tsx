"use client";

import { ArrowLeft, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { BookmarkButton } from "@/components/blocks/bookmarks";
import {
	CourseCtaCard,
	CourseInfo,
	CourseModuleList,
	type EnrollmentMeta,
} from "@/components/blocks/course";
import {
	type AppliedDiscount,
	DiscountCodeField,
} from "@/components/blocks/discounts";
import { ResourceDiscussionView } from "@/components/blocks/discussions/ResourceDiscussionView";
import { ReviewsSection } from "@/components/blocks/reviews";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth.provider";
import { CourseDetail, EnrollmentItem } from "@/types/queries.types";

interface CourseDetailClientProps {
	courseId: string;
	userId: string | undefined;
	course: CourseDetail;
}

export default function CourseDetailClient({
	courseId,
	userId,
	course,
}: CourseDetailClientProps) {
	const t = useTranslations("courses");
	const tDetail = useTranslations("courses.detail");
	const router = useRouter();
	const { refetchProfile } = useAuth();
	const [isEnrolling, setIsEnrolling] = React.useState(false);
	const [discount, setDiscount] = React.useState<AppliedDiscount | null>(null);

	async function handleEnroll() {
		if (!userId) return;
		setIsEnrolling(true);
		try {
			const client = createClient();
			const { error } = course.is_free
				? await client.rpc("enroll_user_in_course", { p_course_id: courseId })
				: await client.rpc("purchase_item", {
						p_item_type: "course",
						p_item_id: courseId,
						p_discount_code: discount?.code,
					});
			if (error) throw error;
			toast.success(t("enrollSuccess"));
			if (!course.is_free) await refetchProfile();
			// Refresh Server Component data
			router.refresh();
		} catch (error) {
			const message = (error as { message?: string })?.message?.includes(
				"insufficient_credits"
			)
				? t("insufficientCredits")
				: t("enrollFailed");
			toast.error(message);
		} finally {
			setIsEnrolling(false);
		}
	}

	const resumeHref = routes.d.myCourses.slug.page({ slug: course.slug });

	return (
		<div className="relative w-full">
			{/* Decorative hero tint */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-linear-to-b from-primary/6 via-primary/2 to-transparent"
			/>

			<div className="@container relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
				{/* Back nav + bookmark */}
				<div className="mb-6 flex items-center justify-between gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="-ms-2"
						onClick={() => router.back()}
					>
						<ArrowLeft className="size-4 rtl:rotate-180" />
						{t("allCourses")}
					</Button>
					<BookmarkButton itemType="course" itemId={courseId} />
				</div>

				<div className="grid items-start gap-x-10 gap-y-8 @4xl:grid-cols-[minmax(0,1fr)_360px]">
					{/* Course header info */}
					<CourseInfo course={course} />

					{/* Sticky CTA card — spans both rows on wide screens */}
					<aside className="h-fit @4xl:sticky @4xl:top-20 @4xl:row-span-2">
						<CourseCtaCard
							course={course}
							resumeHref={resumeHref}
							onEnroll={handleEnroll}
							isEnrolling={isEnrolling}
							discountSlot={
								!course.enrollment && (
									<DiscountCodeField
										itemType="course"
										itemId={courseId}
										onApplied={setDiscount}
									/>
								)
							}
						/>
					</aside>

					{/* Public profiles help learners choose with confidence before enrolling. */}
					{(course.instructor?.slug || course.school_id) && (
						<div className="flex flex-wrap gap-3 @4xl:col-start-1">
							{course.instructor?.slug && (
								<Link
									href={`/instructors/${course.instructor.slug}`}
									className="group flex min-w-[220px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:bg-card"
								>
									<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-lg font-extrabold text-violet-700">
										{course.instructor.name?.slice(0, 1) || "؟"}
									</span>
									<span className="min-w-0 flex-1">
										<small className="block text-[11px] text-muted-foreground">
											{tDetail("instructor")}
										</small>
										<strong className="mt-0.5 block truncate text-sm">
											{course.instructor.name}
										</strong>
									</span>
									<span className="text-xs font-bold text-violet-700">
										{tDetail("visitInstructor")}
									</span>
								</Link>
							)}
							{course.school_id && (
								<Link
									href={`/schools/${course.school_id}`}
									className="group flex min-w-[220px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:bg-card"
								>
									<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
										<GraduationCap className="size-5" />
									</span>
									<span className="min-w-0 flex-1">
										<small className="block text-[11px] text-muted-foreground">
											{tDetail("about")}
										</small>
										<strong className="mt-0.5 block truncate text-sm">
											{tDetail("visitSchool")}
										</strong>
									</span>
								</Link>
							)}
						</div>
					)}

					{/* About + curriculum */}
					<div className="min-w-0 space-y-10 @4xl:col-start-1">
						{course.description && (
							<section>
								<Separator className="mb-8" />
								<h2 className="mb-3 text-xl font-semibold tracking-tight">
									{t("detail.about")}
								</h2>
								<p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">
									{course.description}
								</p>
							</section>
						)}

						{course.modules.length > 0 && (
							<CourseModuleList
								modules={course.modules}
								onLessonClick={
									course.enrollment
										? (lessonId) =>
												router.push(
													routes.d.myCourses.slug.page(
														{ slug: course.slug },
														{ lesson: lessonId }
													)
												)
										: undefined
								}
								defaultExpandedIds={[course.modules[0]?.id]}
							/>
						)}

						{!!course.enrollment && (
							<>
								<Separator />
								<section>
									<h2 className="mb-4 text-xl font-semibold tracking-tight">
										{t("discussions", { defaultValue: "Course Discussions" })}
									</h2>
									<ResourceDiscussionView
										resource_type="course"
										resource_id={courseId}
										publicView={false}
										canCreate={true}
									/>
								</section>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
