"use client";

import {
	Award,
	BookOpen,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth, useAuthProfile } from "@/providers/auth.provider";
import { CourseDetail } from "@/types/queries.types";
import type { EnrollmentMeta } from "./course-card";
import { coverPlaceholderClass, resolveCoverSrc } from "./cover.utils";

export type CourseHeroProps = {
	course: CourseDetail;
	enrollment?: EnrollmentMeta | null;
	resumeHref?: string;
	onEnroll?: () => void;
	isEnrolling?: boolean;
	className?: string;
};

// ─── Stat chip (internal) ─────────────────────────────────────────────────────

function StatChip({
	icon: Icon,
	value,
	label,
}: {
	icon: React.ElementType;
	value?: string | number;
	label: string;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
				<Icon className="size-4 text-muted-foreground" />
			</span>
			<span className="text-sm leading-tight">
				{value != null && value !== "" && (
					<strong className="font-semibold">{value} </strong>
				)}
				<span className="text-muted-foreground">{label}</span>
			</span>
		</div>
	);
}

// ─── CourseInfo — title, badges, rating, instructor, stats, objectives ────────

export type CourseInfoProps = {
	course: CourseDetail;
	className?: string;
};

export function CourseInfo({ course, className }: CourseInfoProps) {
	const t = useTranslations("courses");
	const tDetail = useTranslations("courses.detail");

	const levelLabel = course.level ? t(`level_${course.level}` as any) : null;
	const languageLabel = t(`language_${course.language}` as any);
	const instructorName = course.instructor.name?.trim() || null;

	const formattedDate = course.updated_at
		? new Date(course.updated_at).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
			})
		: null;

	return (
		<div className={cn("space-y-5", className)}>
			{/* Eyebrow: subject + level + language */}
			<div className="flex flex-wrap items-center gap-2">
				{course.subject && (
					<Badge variant="secondary">{course.subject.name}</Badge>
				)}
				{levelLabel && <Badge variant="outline">{levelLabel}</Badge>}
				<Badge variant="outline" className="gap-1">
					<Globe className="size-3" />
					{languageLabel}
				</Badge>
				{!course.is_published && (
					<Badge variant="destructive">{tDetail("draftStatus")}</Badge>
				)}
			</div>

			{/* Title + subtitle */}
			<div className="space-y-2">
				<h1 className="text-3xl font-bold leading-tight tracking-tight text-balance lg:text-4xl">
					{course.title}
				</h1>
				{course.subtitle && (
					<p className="text-lg leading-relaxed text-muted-foreground">
						{course.subtitle}
					</p>
				)}
			</div>

			{/* Rating row */}
			{course.average_rating != null && course.average_rating > 0 && (
				<div className="flex items-center gap-2 text-sm">
					<div className="flex items-center gap-0.5">
						{[1, 2, 3, 4, 5].map((i) => (
							<Star
								key={i}
								className={cn(
									"size-4",
									i <= Math.round(course.average_rating!)
										? "fill-amber-400 text-amber-400"
										: "fill-muted text-muted"
								)}
							/>
						))}
					</div>
					<span className="font-semibold text-amber-600">
						{course.average_rating.toFixed(1)}
					</span>
					{course.total_reviews != null && course.total_reviews > 0 && (
						<span className="text-muted-foreground">
							({course.total_reviews.toLocaleString()})
						</span>
					)}
				</div>
			)}

			{/* Instructor + last updated */}
			{(instructorName || formattedDate) && (
				<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
					{instructorName && (
						<div className="flex items-center gap-2">
							<Avatar className="size-8 border">
								<AvatarImage src={course.instructor?.avatar ?? undefined} />
								<AvatarFallback className="text-xs">
									{instructorName[0]}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm text-muted-foreground">
								{tDetail("instructor")}:{" "}
								<span className="font-medium text-foreground">
									{instructorName}
								</span>
							</span>
						</div>
					)}
					{formattedDate && (
						<p className="text-xs text-muted-foreground">
							{tDetail("lastUpdated", { date: formattedDate })}
						</p>
					)}
				</div>
			)}

			{/* Key stats */}
			<div className="flex flex-wrap gap-x-6 gap-y-3">
				{course.total_lessons != null && course.total_lessons > 0 && (
					<StatChip
						icon={BookOpen}
						label={tDetail("totalLessons", { count: course.total_lessons })}
					/>
				)}
				{course.estimated_duration_hours != null &&
					course.estimated_duration_hours > 0 && (
						<StatChip
							icon={Clock}
							label={tDetail("totalDuration", {
								hours: course.estimated_duration_hours,
							})}
						/>
					)}
				{course.total_enrollments != null && course.total_enrollments > 0 && (
					<StatChip
						icon={Users}
						label={tDetail("totalEnrollments", {
							count: course.total_enrollments,
						})}
					/>
				)}
				<StatChip icon={Award} label={tDetail("certificate")} />
			</div>

			{/* Learning objectives */}
			{course.learning_objectives && course.learning_objectives.length > 0 && (
				<div className="rounded-2xl border bg-card p-5">
					<h3 className="mb-3 text-sm font-semibold">
						{tDetail("objectives")}
					</h3>
					<ul className="grid gap-2.5 sm:grid-cols-2">
						{course.learning_objectives.map((obj, i) => (
							<li key={i} className="flex items-start gap-2 text-sm">
								<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
								<span>{obj}</span>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Prerequisites */}
			{course.prerequisites && course.prerequisites.length > 0 && (
				<div>
					<h3 className="mb-2 text-sm font-semibold">
						{tDetail("prerequisites")}
					</h3>
					<ul className="space-y-1">
						{course.prerequisites.map((pre, i) => (
							<li
								key={i}
								className="flex items-start gap-2 text-sm text-muted-foreground"
							>
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
								{pre}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

// ─── CourseCtaCard — cover, price, enroll/resume, what's included ─────────────

export type CourseCtaCardProps = {
	course: CourseDetail;
	resumeHref?: string;
	onEnroll?: () => void;
	isEnrolling?: boolean;
	className?: string;
	/** Rendered above the buy button — e.g. a discount-code field. */
	discountSlot?: React.ReactNode;
};

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

	return (
		<div
			className={cn(
				"overflow-hidden rounded-2xl border bg-card shadow-lg shadow-black/5",
				className
			)}
		>
			{/* Cover preview */}
			<div className="relative aspect-video w-full overflow-hidden bg-muted">
				{resolveCoverSrc(course.cover_image_url) ? (
					<Image
						src={resolveCoverSrc(course.cover_image_url)!}
						alt={course.title}
						fill
						className="object-cover"
					/>
				) : (
					<div
						className={cn(
							"flex h-full items-center justify-center",
							coverPlaceholderClass(course.title)
						)}
					>
						<BookOpen className="size-12 text-white/40" />
					</div>
				)}
				{/* Play overlay */}
				<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-black/10 to-transparent">
					<div className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-105">
						<Play className="size-6 fill-[#1461B8] text-[#1461B8] ms-0.5" />
					</div>
				</div>
			</div>

			<div className="space-y-4 p-5">
				{/* Price */}
				{course.is_free ? (
					<p className="text-2xl font-bold text-emerald-600">{t("free")}</p>
				) : (
					<p className="text-2xl font-bold">
						{t("priceCredits", { count: course.price_credits ?? 0 })}
					</p>
				)}

				{/* Enrollment progress or CTA */}
				{!isAuthenticated ? (
					<Button asChild size={"lg"} className="w-full">
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
						<div className="space-y-1.5">
							<div className="flex items-center justify-between text-xs">
								<span
									className={cn(
										"font-medium",
										isCompleted ? "text-emerald-600" : "text-muted-foreground"
									)}
								>
									{isCompleted
										? t("completed")
										: hasStarted
											? t("percentComplete", { percent: Math.round(progress) })
											: t("notStarted")}
								</span>
								{isCompleted && (
									<CheckCircle2 className="size-4 text-emerald-500" />
								)}
							</div>
							<Progress
								value={progress}
								className={cn(
									"h-2",
									isCompleted &&
										"*:data-[slot=progress-indicator]:bg-emerald-500"
								)}
							/>
						</div>

						<Button asChild size="lg" className="w-full">
							<Link href={resumeHref ?? "#"}>
								<Play className="size-4" />
								{isCompleted
									? t("reviewCourse")
									: hasStarted
										? t("resume")
										: t("startLearning")}
							</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-2">
						{!course.is_free && discountSlot}
						<Button
							size="lg"
							className="w-full"
							onClick={onEnroll}
							disabled={isEnrolling}
						>
							{course.is_free
								? t("enroll")
								: t("buyForCredits", { count: course.price_credits ?? 0 })}
						</Button>
					</div>
				)}

				<Separator />

				{/* What's included */}
				<div className="space-y-2.5 text-sm text-muted-foreground">
					{course.total_lessons != null && course.total_lessons > 0 && (
						<div className="flex items-center gap-2.5">
							<BookOpen className="size-4 shrink-0" />
							<span>
								{tDetail("totalLessons", { count: course.total_lessons })}
							</span>
						</div>
					)}
					{course.estimated_duration_hours != null &&
						course.estimated_duration_hours > 0 && (
							<div className="flex items-center gap-2.5">
								<Clock className="size-4 shrink-0" />
								<span>
									{tDetail("totalDuration", {
										hours: course.estimated_duration_hours,
									})}
								</span>
							</div>
						)}
					<div className="flex items-center gap-2.5">
						<Award className="size-4 shrink-0" />
						<span>{tDetail("certificate")}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── CourseHero — composed info + CTA card (used by instructor detail) ────────

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
			<div className="grid gap-6 @3xl:grid-cols-[minmax(0,1fr)_380px]">
				<CourseInfo course={course} />
				<div className="@3xl:sticky @3xl:top-20 h-fit">
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
