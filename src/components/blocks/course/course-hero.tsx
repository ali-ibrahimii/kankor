"use client";

import {
	Award,
	BookOpen,
	Check,
	CheckCircle2,
	Clock,
	Globe,
	Play,
	Star,
	Users,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth.provider";

import type { CourseDetail } from "@/types/queries.types";
import type { EnrollmentMeta } from "./course-card";
import { coverPlaceholderClass, resolveCoverSrc } from "./cover.utils";

// ============================================================
// TYPES
// ============================================================

export type CourseHeroProps = {
	course: CourseDetail;
	enrollment?: EnrollmentMeta | null;
	resumeHref?: string;
	onEnroll?: () => void;
	isEnrolling?: boolean;
	className?: string;
};

export type CourseInfoProps = {
	course: CourseDetail;
	className?: string;
};

export type CourseCtaCardProps = {
	course: CourseDetail;
	resumeHref?: string;
	onEnroll?: () => void;
	isEnrolling?: boolean;
	className?: string;
	/** Rendered above the buy button — e.g. a discount-code field. */
	discountSlot?: React.ReactNode;
};

// ============================================================
// COURSE INFO
// ============================================================

export function CourseInfo({ course, className }: CourseInfoProps) {
	const t = useTranslations("courses");
	const tDetail = useTranslations("courses.detail");

	const levelLabel = course.level ? t(`level_${course.level}` as any) : null;

	const languageLabel = t(`language_${course.language}` as any);

	const instructorName = course.instructor.name?.trim() || null;

	const rating = course.average_rating ?? 0;

	const formattedDate = course.updated_at
		? new Date(course.updated_at).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
			})
		: null;

	return (
		<div className={cn("space-y-7", className)}>
			{/* META LINE */}

			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-500 dark:text-slate-400">
				{course.subject && (
					<span className="font-bold text-[#694bd2] dark:text-violet-300">
						{course.subject.name}
					</span>
				)}

				{course.subject && course.grade?.name && (
					<span
						aria-hidden="true"
						className="size-1 rounded-full bg-slate-300 dark:bg-slate-600"
					/>
				)}

				{course.grade?.name && (
					<span className="font-semibold">{course.grade.name}</span>
				)}

				{levelLabel && (
					<>
						<span
							aria-hidden="true"
							className="size-1 rounded-full bg-slate-300 dark:bg-slate-600"
						/>
						<span>{levelLabel}</span>
					</>
				)}

				<span
					aria-hidden="true"
					className="size-1 rounded-full bg-slate-300 dark:bg-slate-600"
				/>

				<span className="inline-flex items-center gap-1.5">
					<Globe className="size-3.5" />
					{languageLabel}
				</span>

				{!course.is_published && (
					<span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
						{tDetail("draftStatus")}
					</span>
				)}
			</div>

			{/* TITLE + SUBTITLE */}

			<div className="space-y-3">
				<h1 className="max-w-3xl text-[1.75rem] font-extrabold leading-[1.4] tracking-tight text-[#19243b] dark:text-white sm:text-4xl sm:leading-[1.35]">
					{course.title}
				</h1>

				{course.subtitle && (
					<p className="max-w-2xl text-[15px] leading-8 text-slate-500 dark:text-slate-400">
						{course.subtitle}
					</p>
				)}
			</div>

			{/* RATING + INSTRUCTOR + UPDATED */}

			<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
				{rating > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-lg font-extrabold text-[#19243b] dark:text-white">
							{rating.toFixed(1)}
						</span>

						<div className="flex items-center gap-0.5">
							{[1, 2, 3, 4, 5].map((index) => (
								<Star
									key={index}
									className={cn(
										"size-4",
										index <= Math.round(rating)
											? "fill-amber-400 text-amber-400"
											: "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
									)}
								/>
							))}
						</div>

						{course.total_reviews != null && course.total_reviews > 0 && (
							<span className="text-xs text-slate-400">
								({course.total_reviews.toLocaleString()})
							</span>
						)}
					</div>
				)}

				{instructorName && (
					<div className="flex items-center gap-2.5">
						<Avatar className="size-8">
							<AvatarImage src={course.instructor?.avatar ?? undefined} />

							<AvatarFallback className="bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
								{instructorName[0]}
							</AvatarFallback>
						</Avatar>

						<span className="text-sm text-slate-500 dark:text-slate-400">
							{tDetail("instructor")}:{" "}
							<span className="font-bold text-[#19243b] dark:text-slate-100">
								{instructorName}
							</span>
						</span>
					</div>
				)}

				{formattedDate && (
					<span className="text-xs text-slate-400">
						{tDetail("lastUpdated", {
							date: formattedDate,
						})}
					</span>
				)}
			</div>

			{/* STATS ROW */}

			<div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-y border-slate-100 py-4 text-sm dark:border-white/10">
				{course.total_lessons != null && course.total_lessons > 0 && (
					<span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
						<BookOpen className="size-4 text-slate-400" />

						<span className="font-bold text-[#19243b] dark:text-white">
							{course.total_lessons.toLocaleString()}
						</span>

						{tDetail("totalLessons", {
							count: course.total_lessons,
						})}
					</span>
				)}

				{course.estimated_duration_hours != null &&
					course.estimated_duration_hours > 0 && (
						<span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
							<Clock className="size-4 text-slate-400" />

							<span className="font-bold text-[#19243b] dark:text-white">
								{course.estimated_duration_hours.toLocaleString()}
							</span>

							{tDetail("totalDuration", {
								hours: course.estimated_duration_hours,
							})}
						</span>
					)}

				{course.total_enrollments != null && course.total_enrollments > 0 && (
					<span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
						<Users className="size-4 text-slate-400" />

						<span className="font-bold text-[#19243b] dark:text-white">
							{course.total_enrollments.toLocaleString()}
						</span>

						{tDetail("totalEnrollments", {
							count: course.total_enrollments,
						})}
					</span>
				)}

				<span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
					<Award className="size-4 text-slate-400" />

					{tDetail("certificate")}
				</span>
			</div>

			{/* LEARNING OBJECTIVES */}

			{course.learning_objectives && course.learning_objectives.length > 0 && (
				<div>
					<h3 className="mb-4 text-base font-extrabold tracking-tight text-[#19243b] dark:text-white">
						{tDetail("objectives")}
					</h3>

					<ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
						{course.learning_objectives.map((objective, index) => (
							<li
								key={index}
								className="flex items-start gap-2.5 text-sm leading-7 text-slate-600 dark:text-slate-300"
							>
								<Check className="mt-1.5 size-4 shrink-0 font-bold text-emerald-500" />

								<span>{objective}</span>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* PREREQUISITES */}

			{course.prerequisites && course.prerequisites.length > 0 && (
				<div>
					<h3 className="mb-3 text-base font-extrabold tracking-tight text-[#19243b] dark:text-white">
						{tDetail("prerequisites")}
					</h3>

					<ul className="space-y-2">
						{course.prerequisites.map((prerequisite, index) => (
							<li
								key={index}
								className="flex items-start gap-2.5 text-sm leading-7 text-slate-500 dark:text-slate-400"
							>
								<span className="mt-3 size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />

								{prerequisite}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

// ============================================================
// COURSE CTA CARD
// ============================================================

export function CourseCtaCard({
	course,
	resumeHref,
	onEnroll,
	isEnrolling,
	className,
	discountSlot,
}: CourseCtaCardProps) {
	const t = useTranslations("courses");
	const { isAuthenticated } = useAuth();
	const tDetail = useTranslations("courses.detail");

	const enrollment = React.useMemo(
		() => course.enrollment,
		[course.enrollment]
	);

	const isEnrolled = !!enrollment;

	const isCompleted = !!enrollment?.completed_at;

	const progress = enrollment?.progress_percentage ?? 0;

	const hasStarted = progress > 0;

	const coverSrc = resolveCoverSrc(course.cover_image_url);

	return (
		<div
			className={cn(
				"w-full max-w-[400px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-30px_rgba(25,36,59,.25)] dark:border-white/10 dark:bg-[#1c263b]",
				className
			)}
		>
			{/* COVER */}

			<div className="group/cover relative aspect-video w-full overflow-hidden">
				{coverSrc ? (
					<Image
						src={coverSrc}
						alt={course.title}
						fill
						className="object-cover transition-transform duration-500 group-hover/cover:scale-[1.04]"
						sizes="420px"
					/>
				) : (
					<div
						className={cn(
							"flex h-full items-center justify-center",
							coverPlaceholderClass(course.title)
						)}
					>
						<BookOpen className="size-12 text-white/50" />
					</div>
				)}

				<div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-300 group-hover/cover:opacity-100">
					<div className="flex size-14 items-center justify-center rounded-full bg-white/95 shadow-xl">
						<Play className="ms-0.5 size-5 fill-[#19243b] text-[#19243b] rtl:-scale-x-100" />
					</div>
				</div>
			</div>

			<div className="space-y-5 p-6">
				{/* PRICE */}

				<div className="flex items-baseline gap-2">
					{course.is_free ? (
						<span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
							{t("free")}
						</span>
					) : (
						<span className="text-3xl font-extrabold tracking-tight text-[#19243b] dark:text-white">
							{t("priceCredits", {
								count: course.price_credits ?? 0,
							})}
						</span>
					)}
				</div>

				{/* ENROLLMENT STATE */}

				{!isAuthenticated ? (
					<Button
						asChild
						size="lg"
						className="h-12 w-full rounded-xl bg-[#19243b] text-sm font-bold text-white hover:bg-[#2a3a5c] dark:bg-white dark:text-[#19243b] dark:hover:bg-slate-200"
					>
						<Link
							href={routes.auth.login.page({
								next: routes.courses.slug.page({
									slug: course.slug ?? course.id,
								}),
							})}
						>
							{t("loginToEnroll")}
						</Link>
					</Button>
				) : isEnrolled ? (
					<div className="space-y-3">
						<div>
							<div className="mb-2 flex items-center justify-between text-xs">
								<span
									className={cn(
										"font-semibold",
										isCompleted
											? "text-emerald-600 dark:text-emerald-400"
											: "text-slate-500 dark:text-slate-400"
									)}
								>
									{isCompleted
										? t("completed")
										: hasStarted
											? t("percentComplete", {
													percent: Math.round(progress),
												})
											: t("notStarted")}
								</span>

								<span className="font-bold text-[#19243b] dark:text-white">
									{Math.round(progress)}%
								</span>
							</div>

							<Progress
								value={progress}
								className={cn(
									"h-1.5 bg-slate-100 dark:bg-white/10",
									isCompleted
										? "[&_[data-slot=progress-indicator]]:bg-emerald-500"
										: "[&_[data-slot=progress-indicator]]:bg-[#19243b] dark:[&_[data-slot=progress-indicator]]:bg-white"
								)}
							/>
						</div>

						<Button
							asChild
							size="lg"
							className="h-12 w-full rounded-xl bg-[#19243b] text-sm font-bold text-white hover:bg-[#2a3a5c] dark:bg-white dark:text-[#19243b] dark:hover:bg-slate-200"
						>
							<Link href={resumeHref ?? "#"}>
								<Play className="size-4 rtl:-scale-x-100" />

								{isCompleted
									? t("reviewCourse")
									: hasStarted
										? t("resume")
										: t("startLearning")}
							</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						{!course.is_free && discountSlot}

						<Button
							size="lg"
							className="h-12 w-full rounded-xl bg-[#694bd2] text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-[#593bc1]"
							onClick={onEnroll}
							disabled={isEnrolling}
						>
							{isEnrolling ? (
								<span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
							) : course.is_free ? (
								t("enroll")
							) : (
								t("buyForCredits", {
									count: course.price_credits ?? 0,
								})
							)}
						</Button>
					</div>
				)}

				{/* INCLUDED LIST */}

				<ul className="space-y-3 border-t border-slate-100 pt-5 text-sm dark:border-white/10">
					{course.total_lessons != null && course.total_lessons > 0 && (
						<li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
							<BookOpen className="size-4 shrink-0 text-slate-400" />

							{tDetail("totalLessons", {
								count: course.total_lessons,
							})}
						</li>
					)}

					{course.estimated_duration_hours != null &&
						course.estimated_duration_hours > 0 && (
							<li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
								<Clock className="size-4 shrink-0 text-slate-400" />

								{tDetail("totalDuration", {
									hours: course.estimated_duration_hours,
								})}
							</li>
						)}

					<li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
						<Award className="size-4 shrink-0 text-slate-400" />

						{tDetail("certificate")}
					</li>
				</ul>
			</div>
		</div>
	);
}

// ============================================================
// COURSE HERO
// ============================================================

export function CourseHero({
	course,
	enrollment,
	resumeHref,
	onEnroll,
	isEnrolling,
	className,
}: CourseHeroProps) {
	return (
		<div className={cn("@container", className)}>
			<div className="grid items-start gap-10 @3xl:grid-cols-[minmax(0,1fr)_400px]">
				<CourseInfo course={course} />

				<div className="h-fit @3xl:sticky @3xl:top-24">
					<CourseCtaCard
						course={course}
						resumeHref={resumeHref}
						onEnroll={onEnroll}
						isEnrolling={isEnrolling}
					/>
				</div>
			</div>
		</div>
	);
}
