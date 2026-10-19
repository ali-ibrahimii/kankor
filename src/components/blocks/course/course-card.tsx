"use client";

import {
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { coverPlaceholderClass, resolveCoverSrc } from "./cover.utils";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type CourseLevel =
	| "beginner"
	| "intermediate"
	| "advanced"
	| "all_levels";
export type CourseLanguage = Locale;

export type CourseMeta = Tables<"courses"> & {
	average_rating: number;
	total_lessons?: number;
	total_enrollments?: number;
	instructor?: { full_name: string | null; avatar_url: string | null } | null;
	subject?: { name: string } | null;
};

export type EnrollmentMeta = {
	progress_percentage: number | null;
	last_accessed_lesson_id: string | null;
	completed_at: string | null;
	enrolled_at: string | null;
};

// ─── Level → Tailwind color mapping ──────────────────────────────────────────

const LEVEL_COLORS: Record<CourseLevel, string> = {
	beginner:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
	intermediate:
		"bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
	advanced:
		"bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
	all_levels: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

// ─── CourseCover (internal) ───────────────────────────────────────────────────

type CourseCoverProps = {
	src: string | null;
	alt: string;
	levelLabel?: string | null;
	levelColor?: string;
	topEndBadge?: React.ReactNode;
	overlay?: React.ReactNode;
};

function CourseCover({
	src,
	alt,
	levelLabel,
	levelColor,
	topEndBadge,
	overlay,
}: CourseCoverProps) {
	const coverSrc = resolveCoverSrc(src);

	return (
		<div className="relative aspect-video w-full overflow-hidden bg-muted">
			{coverSrc ? (
				<Image
					src={coverSrc}
					alt={alt}
					fill
					className="object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				/>
			) : (
				<div
					className={cn(
						"flex h-full items-center justify-center",
						coverPlaceholderClass(alt)
					)}
				>
					<BookOpen className="size-10 text-white/40" />
				</div>
			)}

			{/* Fade for readability of bottom overlays */}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

			{levelLabel && (
				<span
					className={cn(
						"absolute start-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
						levelColor
					)}
				>
					{levelLabel}
				</span>
			)}

			{topEndBadge && <div className="absolute end-2 top-2">{topEndBadge}</div>}

			{overlay && (
				<div className="absolute inset-0 flex items-center justify-center">
					{overlay}
				</div>
			)}
		</div>
	);
}

// ─── CourseMetaRow (exported for reuse on detail page) ───────────────────────

export function CourseMetaRow({
	totalLessons,
	durationHours,
	enrollments,
	rating,
	className,
}: {
	totalLessons?: number;
	durationHours?: number | null;
	enrollments?: number;
	rating?: number;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
				className
			)}
		>
			{totalLessons != null && (
				<span className="flex items-center gap-1">
					<BookOpen className="size-3" />
					{totalLessons}
				</span>
			)}
			{durationHours != null && (
				<span className="flex items-center gap-1">
					<Clock className="size-3" />
					{durationHours}h
				</span>
			)}
			{enrollments != null && (
				<span className="flex items-center gap-1">
					<Users className="size-3" />
					{enrollments.toLocaleString()}
				</span>
			)}
			{rating != null && (
				<span className="flex items-center gap-1">
					<Star className="size-3 fill-amber-400 text-amber-400" />
					{rating.toFixed(1)}
				</span>
			)}
		</div>
	);
}

// ─── InstructorByline ─────────────────────────────────────────────────────────

function InstructorByline({
	instructor,
}: {
	instructor?: CourseMeta["instructor"];
}) {
	if (!instructor) return null;
	return (
		<div className="mt-1.5 flex items-center gap-1.5">
			<Avatar className="size-4 shrink-0">
				<AvatarImage src={instructor.avatar_url ?? undefined} />
				<AvatarFallback className="text-[8px]">
					{instructor.full_name?.[0] ?? "?"}
				</AvatarFallback>
			</Avatar>
			<span className="truncate text-xs text-muted-foreground">
				{instructor.full_name ?? "—"}
			</span>
		</div>
	);
}

// ─── CatalogCourseCard ────────────────────────────────────────────────────────

export type CatalogCourseCardProps = {
	course: CourseMeta;
	href: string;
	className?: string;
};

export function CatalogCourseCard({
	course,
	href,
	className,
}: CatalogCourseCardProps) {
	const t = useTranslations("courses");

	const levelLabel = course.level ? t(`level_${course.level}` as any) : null;
	const levelColor = course.level ? LEVEL_COLORS[course.level] : undefined;

	const priceTag = course.is_free
		? t("free")
		: t("priceCredits", { count: course.price_credits ?? 0 });

	return (
		<div className={cn("group/card h-full", className)}>
			<Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
				<Link href={href}>
					<CourseCover
						src={course.cover_image_url}
						alt={course.title}
						levelLabel={levelLabel}
						levelColor={levelColor}
						topEndBadge={
							priceTag ? (
								<span
									className={cn(
										"rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
										course.is_free
											? "bg-green-500 text-white"
											: "bg-[#1461B8] text-white"
									)}
								>
									{priceTag}
								</span>
							) : undefined
						}
					/>
				</Link>

				<CardContent className="flex-1 pb-3 pt-3">
					<h2 className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary">
						<Link href={href}>{course.title}</Link>
					</h2>
					{course.subtitle && (
						<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
							{course.subtitle}
						</p>
					)}
					<InstructorByline instructor={course.instructor} />
					<CourseMetaRow
						className="mt-2"
						totalLessons={course.total_lessons}
						durationHours={course.estimated_duration_hours}
						enrollments={course.total_enrollments}
						rating={course.average_rating}
					/>
				</CardContent>

				<CardFooter className="pt-2">
					<Button asChild size="sm" variant="outline" className="w-full">
						<Link href={href}>{t("view")}</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

// ─── EnrolledCourseCard ───────────────────────────────────────────────────────

export type EnrolledCourseCardProps = {
	course: CourseMeta;
	enrollment: EnrollmentMeta;
	href: string;
	resumeHref?: string;
	className?: string;
};

export function EnrolledCourseCard({
	course,
	enrollment,
	href,
	resumeHref,
	className,
}: EnrolledCourseCardProps) {
	const t = useTranslations("courses");

	const progress = enrollment.progress_percentage ?? 0;
	const isCompleted = !!enrollment.completed_at;
	const hasStarted = progress > 0;

	const levelLabel = course.level ? t(`level_${course.level}` as any) : null;
	const levelColor = course.level ? LEVEL_COLORS[course.level] : undefined;

	const ctaLabel = isCompleted
		? t("reviewCourse")
		: hasStarted
			? t("resume")
			: t("startLearning");

	const progressLabel = isCompleted
		? t("completed")
		: hasStarted
			? t("percentComplete", { percent: Math.round(progress) })
			: t("notStarted");

	return (
		<div className={cn("group/card", className)}>
			<Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
				<Link href={href}>
					<CourseCover
						src={course.cover_image_url}
						alt={course.title}
						levelLabel={levelLabel}
						levelColor={levelColor}
						overlay={
							!isCompleted ? (
								<div className="rounded-full bg-black/40 p-3 opacity-0 transition-opacity group-hover/card:opacity-100">
									<Play className="size-5 fill-white text-white" />
								</div>
							) : undefined
						}
						topEndBadge={
							isCompleted ? (
								<span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
									<CheckCircle2 className="size-3" />
									{t("completed")}
								</span>
							) : undefined
						}
					/>
				</Link>

				<CardContent className="pb-2 pt-3">
					<Link href={href}>
						<h3 className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary">
							{course.title}
						</h3>
					</Link>

					<div className="mt-2 space-y-1">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>{progressLabel}</span>
							{course.total_lessons != null && (
								<span>{course.total_lessons}</span>
							)}
						</div>
						<Progress
							value={progress}
							className={cn(
								"h-1.5",
								isCompleted && "*:data-[slot=progress-indicator]:bg-emerald-500"
							)}
						/>
					</div>
				</CardContent>

				<CardFooter className="pt-2">
					<Button
						asChild
						size="sm"
						className="w-full"
						variant={isCompleted ? "outline" : "default"}
					>
						<Link href={resumeHref ?? href}>
							{!isCompleted && <Play className="size-3.5" />}
							{ctaLabel}
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

// ─── InstructorCourseCard ─────────────────────────────────────────────────────

export type InstructorCourseCardProps = {
	course: CourseMeta;
	href: string;
	onPublishToggle?: (id: string, toPublish: boolean) => void;
	isTogglingPublish?: boolean;
	className?: string;
};

export function InstructorCourseCard({
	course,
	href,
	onPublishToggle,
	isTogglingPublish,
	className,
}: InstructorCourseCardProps) {
	const t = useTranslations("courses");

	const levelLabel = course.level ? t(`level_${course.level}` as any) : null;
	const levelColor = course.level ? LEVEL_COLORS[course.level] : undefined;

	return (
		<div className={cn("group/card", className)}>
			<Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
				<Link href={href}>
					<CourseCover
						src={course.cover_image_url}
						alt={course.title}
						levelLabel={levelLabel}
						levelColor={levelColor}
						topEndBadge={
							<span
								className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-semibold",
									course.is_published
										? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
										: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
								)}
							>
								{course.is_published
									? t("status_published")
									: t("status_draft")}
							</span>
						}
					/>
				</Link>

				<CardContent className="pb-2 pt-3">
					<Link href={href}>
						<h3 className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary">
							{course.title}
						</h3>
					</Link>
					<CourseMetaRow
						className="mt-2"
						totalLessons={course.total_lessons}
						durationHours={course.estimated_duration_hours}
						enrollments={course.total_enrollments}
					/>
				</CardContent>

				<CardFooter className="gap-2 pt-2">
					<Button asChild size="sm" variant="outline" className="flex-1">
						<Link href={href}>{t("manage")}</Link>
					</Button>
					{onPublishToggle && (
						<Button
							size="sm"
							variant={course.is_published ? "secondary" : "default"}
							className="flex-1"
							disabled={isTogglingPublish}
							onClick={() => onPublishToggle(course.id, !course.is_published)}
						>
							{course.is_published ? t("unpublish") : t("publish")}
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}

// ─── AdminCourseCard ──────────────────────────────────────────────────────────

export type AdminCourseCardProps = {
	course: CourseMeta;
	href: string;
	className?: string;
};

export function AdminCourseCard({
	course,
	href,
	className,
}: AdminCourseCardProps) {
	const t = useTranslations("courses");

	const levelLabel = course.level ? t(`level_${course.level}` as any) : null;
	const levelColor = course.level ? LEVEL_COLORS[course.level] : undefined;

	return (
		<Link href={href} className={cn("group/card block h-full", className)}>
			<Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
				<CourseCover
					src={course.cover_image_url}
					alt={course.title}
					levelLabel={levelLabel}
					levelColor={levelColor}
					topEndBadge={
						<span
							className={cn(
								"rounded-full px-2 py-0.5 text-[10px] font-semibold",
								course.is_published
									? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
									: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
							)}
						>
							{course.is_published ? t("status_live") : t("status_draft")}
						</span>
					}
				/>

				<CardContent className="pb-3 pt-3">
					<h3 className="line-clamp-2 text-sm font-semibold leading-snug">
						{course.title}
					</h3>
					<InstructorByline instructor={course.instructor} />
					<div className="mt-2 flex flex-wrap items-center gap-1.5">
						{course.subject && (
							<Badge variant="secondary" className="text-[10px]">
								{course.subject.name}
							</Badge>
						)}
						<Badge variant="outline" className="gap-1 text-[10px]">
							<Globe className="size-2.5" />
							{t(`language_${course.language}` as any)}
						</Badge>
					</div>
					<CourseMetaRow
						className="mt-2"
						totalLessons={course.total_lessons}
						durationHours={course.estimated_duration_hours}
						enrollments={course.total_enrollments}
						rating={course.average_rating}
					/>
				</CardContent>
			</Card>
		</Link>
	);
}

// ─── CourseCardSkeleton ───────────────────────────────────────────────────────

export function CourseCardSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("rounded-xl overflow-hidden", className)}>
			<Skeleton className="aspect-video w-full rounded-none" />
			<div className="space-y-2 border border-t-0 bg-card p-3">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
				<Skeleton className="h-3 w-2/3" />
			</div>
		</div>
	);
}
