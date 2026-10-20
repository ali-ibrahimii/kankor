"use client";

import {
	ArrowLeft,
	ArrowUpRight,
	BookOpen,
	GraduationCap,
	MessageSquareText,
	UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { BookmarkButton } from "@/components/blocks/bookmarks";
import {
	CourseCtaCard,
	CourseInfo,
	CourseModuleList,
} from "@/components/blocks/course";
import {
	type AppliedDiscount,
	DiscountCodeField,
} from "@/components/blocks/discounts";
import { ResourceDiscussionView } from "@/components/blocks/discussions/ResourceDiscussionView";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth.provider";
import type { CourseDetail } from "@/types/queries.types";

interface CourseDetailClientProps {
	courseId: string;
	userId: string | undefined;
	course: CourseDetail;
}

/* -------------------------------------------------------------------------- */
/*                              Section Heading                               */
/* -------------------------------------------------------------------------- */

interface SectionHeadingProps {
	title: string;
	description?: string;
	icon: React.ElementType;
}

function SectionHeading({
	title,
	description,
	icon: Icon,
}: SectionHeadingProps) {
	return (
		<div className="mb-6 flex items-start gap-4">
			<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
				<Icon className="size-5" strokeWidth={1.8} />
			</div>

			<div className="min-w-0 pt-0.5">
				<h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
					{title}
				</h2>

				{description && (
					<p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
						{description}
					</p>
				)}
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*                               Course Links                                 */
/* -------------------------------------------------------------------------- */

interface CourseLinksProps {
	instructorSlug?: string | null;
	schoolId?: string | null;
	instructorLabel: string;
	schoolLabel: string;
}

function CourseLinks({
	instructorSlug,
	schoolId,
	instructorLabel,
	schoolLabel,
}: CourseLinksProps) {
	if (!instructorSlug && !schoolId) return null;

	return (
		<div className="mt-8 flex flex-wrap gap-3">
			{instructorSlug && (
				<Link
					href={`/instructors/${instructorSlug}`}
					className="group inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
				>
					<UserRound className="size-[18px] text-slate-500" />

					<span>{instructorLabel}</span>

					<ArrowUpRight className="size-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
				</Link>
			)}

			{schoolId && (
				<Link
					href={`/schools/${schoolId}`}
					className="group inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
				>
					<GraduationCap className="size-[18px] text-slate-500" />

					<span>{schoolLabel}</span>

					<ArrowUpRight className="size-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
				</Link>
			)}
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*                              Navigation Tabs                               */
/* -------------------------------------------------------------------------- */

interface NavigationTab {
	id: string;
	label: string;
}

function CourseNavigation({ tabs }: { tabs: NavigationTab[] }) {
	const [activeTab, setActiveTab] = React.useState(tabs[0]?.id ?? "");

	function navigateTo(id: string) {
		setActiveTab(id);

		document.getElementById(id)?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}

	return (
		<nav
			aria-label="Course sections"
			className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800"
		>
			{tabs.map((tab) => (
				<button
					key={tab.id}
					type="button"
					onClick={() => navigateTo(tab.id)}
					className={`relative shrink-0 px-5 py-4 text-sm font-semibold transition-colors ${
						activeTab === tab.id
							? "text-primary"
							: "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
					}`}
				>
					{tab.label}

					{activeTab === tab.id && (
						<span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-primary" />
					)}
				</button>
			))}
		</nav>
	);
}

/* -------------------------------------------------------------------------- */
/*                            Course Detail Client                            */
/* -------------------------------------------------------------------------- */

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

	/* ------------------------------------------------------------------------ */
	/*                                Enrollment                                */
	/* ------------------------------------------------------------------------ */

	async function handleEnroll() {
		if (!userId || isEnrolling) return;

		setIsEnrolling(true);

		try {
			const client = createClient();

			const { error } = course.is_free
				? await client.rpc("enroll_user_in_course", {
						p_course_id: courseId,
					})
				: await client.rpc("purchase_item", {
						p_item_type: "course",
						p_item_id: courseId,
						p_discount_code: discount?.code,
					});

			if (error) throw error;

			toast.success(t("enrollSuccess"));

			if (!course.is_free) {
				await refetchProfile();
			}

			router.refresh();
		} catch (error) {
			const message = (error as { message?: string })?.message;

			toast.error(
				message?.includes("insufficient_credits")
					? t("insufficientCredits")
					: t("enrollFailed")
			);
		} finally {
			setIsEnrolling(false);
		}
	}

	/* ------------------------------------------------------------------------ */
	/*                                  Routes                                  */
	/* ------------------------------------------------------------------------ */

	const courseSlug = course.slug ?? course.id;

	const resumeHref = routes.d.myCourses.slug.page({
		slug: courseSlug,
	});

	const hasDescription = Boolean(course.description?.trim());
	const hasModules = (course.modules?.length ?? 0) > 0;
	const hasDiscussions = Boolean(course.enrollment);

	const tabs: NavigationTab[] = [
		...(hasDescription
			? [{ id: "course-about", label: tDetail("about") }]
			: []),

		...(hasModules
			? [{ id: "course-curriculum", label: tDetail("curriculum") }]
			: []),

		...(hasDiscussions
			? [{ id: "course-discussions", label: t("discussions") }]
			: []),
	];

	/* ------------------------------------------------------------------------ */
	/*                                  Render                                  */
	/* ------------------------------------------------------------------------ */

	return (
		<div className="w-full">
			{/* ================================================================ */}
			{/*                          TOP NAVIGATION                          */}
			{/* ================================================================ */}

			<div className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.back()}
					className="-ms-3 h-10 gap-2 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
				>
					<ArrowLeft className="size-4 rtl:rotate-180" />
					{t("allCourses")}
				</Button>

				<BookmarkButton itemType="course" itemId={courseId} />
			</div>

			{/* ================================================================ */}
			{/*                            MAIN GRID                             */}
			{/* ================================================================ */}

			<div className="grid min-w-0 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-16">
				{/* ============================================================ */}
				{/*                           MAIN CONTENT                       */}
				{/* ============================================================ */}

				<main className="min-w-0">
					{/* ---------------------------------------------------------- */}
					{/*                         COURSE HERO                        */}
					{/* ---------------------------------------------------------- */}

					<div className="pb-10">
						<CourseInfo course={course} />

						<CourseLinks
							instructorSlug={course.instructor?.slug}
							schoolId={course.school_id}
							instructorLabel={tDetail("visitInstructor")}
							schoolLabel={tDetail("visitSchool")}
						/>
					</div>

					{/* ---------------------------------------------------------- */}
					{/*                        SECTION NAVIGATION                  */}
					{/* ---------------------------------------------------------- */}

					{tabs.length > 0 && (
						<div className="mb-10">
							<CourseNavigation tabs={tabs} />
						</div>
					)}

					{/* ---------------------------------------------------------- */}
					{/*                            ABOUT                           */}
					{/* ---------------------------------------------------------- */}

					{hasDescription && (
						<section id="course-about" className="scroll-mt-28 pb-12 sm:pb-14">
							<SectionHeading icon={BookOpen} title={tDetail("about")} />

							<div className="max-w-3xl">
								<p className="whitespace-pre-line break-words text-[15px] leading-[2.2] text-slate-600 dark:text-slate-300">
									{course.description}
								</p>
							</div>
						</section>
					)}

					{/* ---------------------------------------------------------- */}
					{/*                          CURRICULUM                        */}
					{/* ---------------------------------------------------------- */}

					{hasModules && (
						<section
							id="course-curriculum"
							className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800 sm:py-14"
						>
							<SectionHeading icon={BookOpen} title={tDetail("curriculum")} />

							<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
								<CourseModuleList
									modules={course.modules}
									onLessonClick={
										course.enrollment
											? (lessonId) =>
													router.push(
														routes.d.myCourses.slug.page(
															{ slug: courseSlug },
															{ lesson: lessonId }
														)
													)
											: undefined
									}
									defaultExpandedIds={
										course.modules[0] ? [course.modules[0].id] : []
									}
								/>
							</div>
						</section>
					)}

					{/* ---------------------------------------------------------- */}
					{/*                          DISCUSSIONS                       */}
					{/* ---------------------------------------------------------- */}

					{hasDiscussions && (
						<section
							id="course-discussions"
							className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800 sm:py-14"
						>
							<SectionHeading
								icon={MessageSquareText}
								title={t("discussions")}
							/>

							<ResourceDiscussionView
								resource_type="course"
								resource_id={courseId}
								publicView={false}
								canCreate={true}
							/>
						</section>
					)}
				</main>

				{/* ============================================================ */}
				{/*                              SIDEBAR                         */}
				{/* ============================================================ */}

				<aside className="min-w-0 lg:sticky lg:top-24">
					<CourseCtaCard
						course={course}
						resumeHref={resumeHref}
						onEnroll={handleEnroll}
						isEnrolling={isEnrolling}
						discountSlot={
							!course.is_free && !course.enrollment ? (
								<DiscountCodeField
									itemType="course"
									itemId={courseId}
									onApplied={setDiscount}
								/>
							) : undefined
						}
					/>
				</aside>
			</div>
		</div>
	);
}
