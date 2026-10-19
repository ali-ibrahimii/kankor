"use client";

import { ArrowLeft } from "lucide-react";
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
