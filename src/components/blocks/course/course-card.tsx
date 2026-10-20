"use client";

import {
	ArrowLeft,
	ArrowRight,
	Atom,
	BookOpen,
	Calculator,
	CheckCircle2,
	Clock3,
	Code2,
	FlaskConical,
	Globe2,
	GraduationCap,
	History,
	Laptop,
	Layers3,
	Leaf,
	Map,
	Monitor,
	Play,
	Sparkles,
	Star,
	Users,
	Zap,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import type { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

import { coverPlaceholderClass, resolveCoverSrc } from "./cover.utils";

// ============================================================
// TYPES
// ============================================================

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

	instructor?: {
		full_name: string | null;
		avatar_url: string | null;
	} | null;

	subject?: {
		name: string;
	} | null;

	grade?: {
		id: string;
		name: string;
	} | null;
};

export type EnrollmentMeta = {
	progress_percentage: number | null;
	last_accessed_lesson_id: string | null;
	completed_at: string | null;
	enrolled_at: string | null;
};

// ============================================================
// STYLES
// ============================================================

const CARD_STYLE =
	"group/card flex h-full flex-col overflow-hidden rounded-[24px] border border-[#e8eaf2] bg-white shadow-[0_8px_30px_-18px_rgba(30,35,75,.18)] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300 hover:shadow-[0_25px_60px_-25px_rgba(100,70,190,.35)] dark:border-white/10 dark:bg-[#1c263b] dark:hover:border-violet-400/30";

const PRIMARY_BUTTON =
	"h-11 w-full rounded-[14px] bg-gradient-to-r from-[#694bd2] to-[#8b5cf6] text-xs font-extrabold text-white shadow-md shadow-violet-500/20 transition-all duration-300 hover:from-[#593bc1] hover:to-[#7c3aed] hover:shadow-lg hover:shadow-violet-500/30";

const SECONDARY_BUTTON =
	"h-11 rounded-[14px] border border-[#e5e6ef] bg-white text-xs font-bold text-[#27344d] hover:border-violet-200 hover:bg-violet-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10";

// ============================================================
// SUBJECT THEME
// ============================================================

type SubjectTheme = {
	icon: React.ElementType;
	gradient: string;
	accent: string;
	glow: string;
};

const DEFAULT_THEME: SubjectTheme = {
	icon: BookOpen,
	gradient: "from-[#6850d8] via-[#8458ed] to-[#a16cf7]",
	accent: "bg-violet-500",
	glow: "bg-violet-300/30",
};

function getSubjectTheme(subjectName?: string | null): SubjectTheme {
	const name = (subjectName ?? "").toLowerCase();

	if (/ریاضی|رياضيات|math|mathematics|حساب|الجبر/.test(name)) {
		return {
			icon: Calculator,
			gradient: "from-[#6246c7] via-[#8258e8] to-[#a78bfa]",
			accent: "bg-violet-500",
			glow: "bg-violet-300/30",
		};
	}

	if (/فیزیک|فيزياء|physics/.test(name)) {
		return {
			icon: Atom,
			gradient: "from-[#2563eb] via-[#3b82f6] to-[#60a5fa]",
			accent: "bg-blue-500",
			glow: "bg-blue-300/30",
		};
	}

	if (/کیمیا|كيمياء|chemistry/.test(name)) {
		return {
			icon: FlaskConical,
			gradient: "from-[#ea580c] via-[#f97316] to-[#fb923c]",
			accent: "bg-orange-500",
			glow: "bg-orange-300/30",
		};
	}

	if (/بیولوژی|بيولوجيا|زیست|biology/.test(name)) {
		return {
			icon: Leaf,
			gradient: "from-[#047857] via-[#10b981] to-[#34d399]",
			accent: "bg-emerald-500",
			glow: "bg-emerald-300/30",
		};
	}

	if (/جغرافیه|جغرافيا|geography/.test(name)) {
		return {
			icon: Map,
			gradient: "from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]",
			accent: "bg-sky-500",
			glow: "bg-sky-300/30",
		};
	}

	if (/تاریخ|تاريخ|history/.test(name)) {
		return {
			icon: History,
			gradient: "from-[#92400e] via-[#b45309] to-[#d97706]",
			accent: "bg-amber-500",
			glow: "bg-amber-300/30",
		};
	}

	if (/frontend|front.end|react|next\.?js|html|css/.test(name)) {
		return {
			icon: Monitor,
			gradient: "from-[#4338ca] via-[#6366f1] to-[#818cf8]",
			accent: "bg-indigo-500",
			glow: "bg-indigo-300/30",
		};
	}

	if (/backend|back.end|node|python|programming|برنامه/.test(name)) {
		return {
			icon: Code2,
			gradient: "from-[#0f766e] via-[#0d9488] to-[#2dd4bf]",
			accent: "bg-teal-500",
			glow: "bg-teal-300/30",
		};
	}

	if (/computer|کامپیوتر|كمبيوتر|technology/.test(name)) {
		return {
			icon: Laptop,
			gradient: "from-[#334155] via-[#475569] to-[#64748b]",
			accent: "bg-slate-500",
			glow: "bg-slate-300/30",
		};
	}

	return DEFAULT_THEME;
}

// ============================================================
// HELPERS
// ============================================================

const LEVEL_COLORS: Record<CourseLevel, string> = {
	beginner:
		"bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",

	intermediate:
		"bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",

	advanced:
		"bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",

	all_levels: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};

function isCourseLevel(value: unknown): value is CourseLevel {
	return (
		value === "beginner" ||
		value === "intermediate" ||
		value === "advanced" ||
		value === "all_levels"
	);
}

function useCourseLabels() {
	const t = useTranslations("courses");

	const getLevel = (level: string | null | undefined) => {
		if (!isCourseLevel(level)) return null;

		return t(`level_${level}`);
	};

	const getLanguage = (language: string | null | undefined) => {
		switch (language) {
			case "fa":
				return t("language_fa");
			case "ps":
				return t("language_ps");
			case "en":
				return t("language_en");
			default:
				return language ?? null;
		}
	};

	return {
		t,
		getLevel,
		getLanguage,
	};
}

// ============================================================
// COURSE COVER
// ============================================================

type CourseCoverProps = {
	src: string | null;
	alt: string;
	subject?: string | null;
	grade?: string | null;
	levelLabel?: string | null;
	topEndBadge?: React.ReactNode;
	overlay?: React.ReactNode;
};

function CourseCover({
	src,
	alt,
	subject,
	grade,
	levelLabel,
	topEndBadge,
	overlay,
}: CourseCoverProps) {
	const coverSrc = resolveCoverSrc(src);

	const theme = getSubjectTheme(subject);

	const Icon = theme.icon;

	return (
		<div
			className={cn(
				"relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br",
				theme.gradient
			)}
		>
			{coverSrc ? (
				<Image
					src={coverSrc}
					alt={alt}
					fill
					className="object-cover transition-transform duration-700 group-hover/card:scale-[1.07]"
					sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
				/>
			) : (
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<div className="absolute -end-16 -top-20 size-64 rounded-full border-[40px] border-white/10" />

					<div className="absolute -start-20 -bottom-24 size-72 rounded-full border-[45px] border-white/10" />

					<div
						className={cn("absolute size-40 rounded-full blur-3xl", theme.glow)}
					/>

					<div className="relative flex size-[86px] items-center justify-center rounded-[28px] border border-white/25 bg-white/15 text-white shadow-2xl backdrop-blur-md transition-transform duration-500 group-hover/card:rotate-3 group-hover/card:scale-110">
						<Icon className="size-11" strokeWidth={1.7} />
					</div>

					{subject && (
						<span className="relative mt-4 max-w-[85%] truncate text-sm font-extrabold tracking-tight text-white drop-shadow-sm">
							{subject}
						</span>
					)}
				</div>
			)}

			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

			{/* GRADE */}

			{grade && (
				<span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold text-[#27344d] shadow-sm backdrop-blur-md">
					<GraduationCap className="size-3.5" />

					{grade}
				</span>
			)}

			{/* PRICE / STATUS */}

			{topEndBadge && <div className="absolute end-3 top-3">{topEndBadge}</div>}

			{/* LEVEL */}

			{levelLabel && (
				<span className="absolute bottom-3 start-3 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
					{levelLabel}
				</span>
			)}

			{overlay && (
				<div className="absolute inset-0 flex items-center justify-center">
					{overlay}
				</div>
			)}
		</div>
	);
}

// ============================================================
// META ROW
// ============================================================

function MetaItem({
	icon: Icon,
	children,
}: {
	icon: React.ElementType;
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
			<Icon className="size-3.5 shrink-0 text-[#8d84ae]" />

			<span className="truncate">{children}</span>
		</div>
	);
}

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
	const locale = useLocale();

	const formatNumber = (value: number) =>
		new Intl.NumberFormat(locale).format(value);

	const hasData =
		totalLessons != null ||
		durationHours != null ||
		enrollments != null ||
		rating != null;

	if (!hasData) return null;

	return (
		<div
			className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}
		>
			{totalLessons != null && (
				<MetaItem icon={BookOpen}>{formatNumber(totalLessons)}</MetaItem>
			)}

			{durationHours != null && (
				<MetaItem icon={Clock3}>{formatNumber(durationHours)}h</MetaItem>
			)}

			{enrollments != null && (
				<MetaItem icon={Users}>{formatNumber(enrollments)}</MetaItem>
			)}

			{rating != null && rating > 0 && (
				<span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
					<Star className="size-3.5 fill-amber-400 text-amber-400" />

					{rating.toFixed(1)}
				</span>
			)}
		</div>
	);
}

// ============================================================
// INSTRUCTOR
// ============================================================

function InstructorByline({
	instructor,
}: {
	instructor?: CourseMeta["instructor"];
}) {
	if (!instructor) return null;

	return (
		<div className="flex min-w-0 items-center gap-2.5">
			<Avatar className="size-8 shrink-0 border-2 border-white shadow-sm dark:border-white/10">
				<AvatarImage src={instructor.avatar_url ?? undefined} />

				<AvatarFallback className="bg-[#eee9ff] text-[11px] font-bold text-[#694bd2]">
					{instructor.full_name?.[0] ?? "?"}
				</AvatarFallback>
			</Avatar>

			<span className="truncate text-[11px] font-semibold text-slate-600 dark:text-slate-300">
				{instructor.full_name ?? "—"}
			</span>
		</div>
	);
}

// ============================================================
// SUBJECT BADGE
// ============================================================

function SubjectBadge({ subject }: { subject?: CourseMeta["subject"] }) {
	if (!subject) return null;

	const theme = getSubjectTheme(subject.name);

	const Icon = theme.icon;

	return (
		<span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[#f1edff] px-2.5 py-1.5 text-[10px] font-bold text-[#694bd2] dark:bg-violet-500/15 dark:text-violet-300">
			<Icon className="size-3.5 shrink-0" />

			<span className="truncate">{subject.name}</span>
		</span>
	);
}

// ============================================================
// CATALOG COURSE CARD
// ============================================================

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
	const { t, getLevel, getLanguage } = useCourseLabels();

	const levelLabel = getLevel(course.level);

	const priceTag = course.is_free
		? t("free")
		: t("priceCredits", {
				count: course.price_credits ?? 0,
			});

	const showMeta =
		course.total_lessons != null ||
		course.estimated_duration_hours != null ||
		course.total_enrollments != null ||
		course.average_rating > 0;

	return (
		<article className={cn(CARD_STYLE, className)}>
			<Link href={href} className="block shrink-0">
				<CourseCover
					src={course.cover_image_url}
					alt={course.title}
					subject={course.subject?.name}
					grade={course.grade?.name}
					levelLabel={levelLabel}
					topEndBadge={
						<span
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold shadow-lg",
								course.is_free
									? "bg-[#b7f486] text-[#20322a]"
									: "bg-white text-[#694bd2]"
							)}
						>
							{course.is_free ? (
								<Sparkles className="size-3" />
							) : (
								<Zap className="size-3" />
							)}

							{priceTag}
						</span>
					}
				/>
			</Link>

			<div className="flex flex-1 flex-col p-4 sm:p-5">
				{/* SUBJECT + LANGUAGE */}

				<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
					<SubjectBadge subject={course.subject} />

					{course.language && (
						<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
							<Globe2 className="size-3" />

							{getLanguage(course.language)}
						</span>
					)}
				</div>

				{/* TITLE */}

				<Link href={href}>
					<h3 className="line-clamp-2 text-[15px] font-extrabold leading-6 text-[#19243b] transition-colors hover:text-[#694bd2] dark:text-slate-100">
						{course.title}
					</h3>
				</Link>

				{/* DESCRIPTION */}

				{course.subtitle && (
					<p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
						{course.subtitle}
					</p>
				)}

				{/* INSTRUCTOR */}

				{course.instructor && (
					<div className="mt-4">
						<InstructorByline instructor={course.instructor} />
					</div>
				)}

				{/* META */}

				{showMeta && (
					<div className="mt-4 rounded-xl border border-[#f0eff6] bg-[#fafaff] p-3 dark:border-white/5 dark:bg-white/[.03]">
						<CourseMetaRow
							totalLessons={course.total_lessons}
							durationHours={course.estimated_duration_hours}
							enrollments={course.total_enrollments}
							rating={course.average_rating}
						/>
					</div>
				)}

				{/* BUTTON */}

				<div className="mt-auto pt-5">
					<Button asChild className={PRIMARY_BUTTON}>
						<Link
							href={href}
							className="flex items-center justify-center gap-2"
						>
							{t("view")}

							<ArrowRight className="size-4 rtl:hidden" />

							<ArrowLeft className="hidden size-4 rtl:block" />
						</Link>
					</Button>
				</div>
			</div>
		</article>
	);
}

// ============================================================
// ENROLLED COURSE CARD
// ============================================================

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
	const { t, getLevel } = useCourseLabels();

	const progress = Math.min(
		100,
		Math.max(0, enrollment.progress_percentage ?? 0)
	);

	const isCompleted = !!enrollment.completed_at;

	const hasStarted = progress > 0;

	const displayProgress = isCompleted ? 100 : progress;

	const ctaLabel = isCompleted
		? t("reviewCourse")
		: hasStarted
			? t("resume")
			: t("startLearning");

	const progressLabel = isCompleted
		? t("completed")
		: hasStarted
			? t("percentComplete", {
					percent: Math.round(displayProgress),
				})
			: t("notStarted");

	return (
		<article className={cn(CARD_STYLE, className)}>
			<Link href={href}>
				<CourseCover
					src={course.cover_image_url}
					alt={course.title}
					subject={course.subject?.name}
					grade={course.grade?.name}
					levelLabel={getLevel(course.level)}
					topEndBadge={
						isCompleted ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-[#b7f486] px-3 py-1.5 text-[10px] font-extrabold text-[#20322a]">
								<CheckCircle2 className="size-3.5" />

								{t("completed")}
							</span>
						) : (
							<span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-extrabold text-[#694bd2]">
								{Math.round(displayProgress)}%
							</span>
						)
					}
					overlay={
						!isCompleted ? (
							<div className="flex size-14 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white opacity-0 backdrop-blur-md transition-all group-hover/card:scale-110 group-hover/card:opacity-100">
								<Play className="size-6 fill-current" />
							</div>
						) : undefined
					}
				/>
			</Link>

			<div className="flex flex-1 flex-col p-4 sm:p-5">
				<SubjectBadge subject={course.subject} />

				<Link href={href}>
					<h3 className="mt-3 line-clamp-2 text-[15px] font-extrabold leading-6 text-[#19243b] hover:text-[#694bd2] dark:text-slate-100">
						{course.title}
					</h3>
				</Link>

				{course.instructor && (
					<div className="mt-3">
						<InstructorByline instructor={course.instructor} />
					</div>
				)}

				<div className="mt-4">
					<CourseMetaRow
						totalLessons={course.total_lessons}
						durationHours={course.estimated_duration_hours}
						rating={course.average_rating}
					/>
				</div>

				{/* PROGRESS */}

				<div className="mt-auto pt-5">
					<div className="rounded-2xl border border-[#eeeaf9] bg-[#f8f6ff] p-3.5 dark:border-violet-500/10 dark:bg-violet-500/5">
						<div className="mb-3 flex items-center justify-between gap-2">
							<span className="text-[11px] font-bold text-[#51486e] dark:text-violet-200">
								{progressLabel}
							</span>

							<span className="text-xs font-extrabold text-[#694bd2] dark:text-violet-300">
								{Math.round(displayProgress)}%
							</span>
						</div>

						<Progress
							value={displayProgress}
							className={cn(
								"h-2 bg-[#e7defc] dark:bg-white/10",
								"[&_[data-slot=progress-indicator]]:bg-[#694bd2]",
								isCompleted &&
									"[&_[data-slot=progress-indicator]]:bg-emerald-500"
							)}
						/>
					</div>

					<Button
						asChild
						className={cn(
							"mt-4 w-full",
							isCompleted ? SECONDARY_BUTTON : PRIMARY_BUTTON
						)}
					>
						<Link
							href={resumeHref ?? href}
							className="flex items-center justify-center gap-2"
						>
							{isCompleted ? (
								<CheckCircle2 className="size-4" />
							) : (
								<Play className="size-4" />
							)}

							{ctaLabel}
						</Link>
					</Button>
				</div>
			</div>
		</article>
	);
}

// ============================================================
// INSTRUCTOR COURSE CARD
// ============================================================

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
	const { t, getLevel } = useCourseLabels();

	return (
		<article className={cn(CARD_STYLE, className)}>
			<Link href={href}>
				<CourseCover
					src={course.cover_image_url}
					alt={course.title}
					subject={course.subject?.name}
					grade={course.grade?.name}
					levelLabel={getLevel(course.level)}
					topEndBadge={
						<span
							className={cn(
								"rounded-full px-3 py-1.5 text-[10px] font-extrabold",
								course.is_published
									? "bg-[#b7f486] text-[#20322a]"
									: "bg-amber-100 text-amber-800"
							)}
						>
							{course.is_published ? t("status_published") : t("status_draft")}
						</span>
					}
				/>
			</Link>

			<div className="flex flex-1 flex-col p-4 sm:p-5">
				<SubjectBadge subject={course.subject} />

				<Link href={href}>
					<h3 className="mt-3 line-clamp-2 text-[15px] font-extrabold leading-6 text-[#19243b] hover:text-[#694bd2] dark:text-slate-100">
						{course.title}
					</h3>
				</Link>

				{course.subtitle && (
					<p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
						{course.subtitle}
					</p>
				)}

				<div className="mt-4">
					<CourseMetaRow
						totalLessons={course.total_lessons}
						durationHours={course.estimated_duration_hours}
						enrollments={course.total_enrollments}
						rating={course.average_rating}
					/>
				</div>

				<div className="mt-auto flex gap-2 pt-5">
					<Button asChild className={cn(SECONDARY_BUTTON, "flex-1")}>
						<Link href={href}>{t("manage")}</Link>
					</Button>

					{onPublishToggle && (
						<Button
							type="button"
							disabled={isTogglingPublish}
							onClick={() => onPublishToggle(course.id, !course.is_published)}
							className={cn(
								"flex-1",
								course.is_published
									? "h-11 rounded-[14px] bg-amber-50 text-xs font-bold text-amber-700 hover:bg-amber-100"
									: PRIMARY_BUTTON
							)}
						>
							{isTogglingPublish ? (
								<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							) : course.is_published ? (
								t("unpublish")
							) : (
								t("publish")
							)}
						</Button>
					)}
				</div>
			</div>
		</article>
	);
}

// ============================================================
// ADMIN COURSE CARD
// ============================================================

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
	const { t, getLevel, getLanguage } = useCourseLabels();

	return (
		<Link href={href} className={cn(CARD_STYLE, className)}>
			<CourseCover
				src={course.cover_image_url}
				alt={course.title}
				subject={course.subject?.name}
				grade={course.grade?.name}
				levelLabel={getLevel(course.level)}
				topEndBadge={
					<span
						className={cn(
							"rounded-full px-3 py-1.5 text-[10px] font-extrabold",
							course.is_published
								? "bg-[#b7f486] text-[#20322a]"
								: "bg-amber-100 text-amber-800"
						)}
					>
						{course.is_published ? t("status_live") : t("status_draft")}
					</span>
				}
			/>

			<div className="flex flex-1 flex-col p-4 sm:p-5">
				<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
					<SubjectBadge subject={course.subject} />

					{course.language && (
						<span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
							<Globe2 className="size-3" />

							{getLanguage(course.language)}
						</span>
					)}
				</div>

				<h3 className="line-clamp-2 text-[15px] font-extrabold leading-6 text-[#19243b] group-hover/card:text-[#694bd2] dark:text-slate-100">
					{course.title}
				</h3>

				{course.instructor && (
					<div className="mt-3">
						<InstructorByline instructor={course.instructor} />
					</div>
				)}

				<div className="mt-4">
					<CourseMetaRow
						totalLessons={course.total_lessons}
						durationHours={course.estimated_duration_hours}
						enrollments={course.total_enrollments}
						rating={course.average_rating}
					/>
				</div>

				<div className="mt-auto pt-5">
					<div className="flex h-11 items-center justify-between rounded-[14px] bg-[#f1edff] px-4 text-xs font-bold text-[#694bd2] transition-colors group-hover/card:bg-[#694bd2] group-hover/card:text-white dark:bg-violet-500/10 dark:text-violet-300">
						<span>{t("manage")}</span>

						<ArrowRight className="size-4 rtl:hidden" />

						<ArrowLeft className="hidden size-4 rtl:block" />
					</div>
				</div>
			</div>
		</Link>
	);
}

// ============================================================
// SKELETON
// ============================================================

export function CourseCardSkeleton({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-[24px] border border-[#e8eaf2] bg-white dark:border-white/10 dark:bg-[#1c263b]",
				className
			)}
		>
			<Skeleton className="aspect-[16/10] w-full rounded-none" />

			<div className="space-y-4 p-5">
				<div className="flex items-center justify-between">
					<Skeleton className="h-6 w-20 rounded-lg" />

					<Skeleton className="h-4 w-12" />
				</div>

				<Skeleton className="h-4 w-full" />

				<Skeleton className="h-4 w-3/4" />

				<Skeleton className="h-3 w-2/3" />

				<div className="flex gap-3">
					<Skeleton className="h-9 flex-1 rounded-xl" />
					<Skeleton className="h-9 flex-1 rounded-xl" />
					<Skeleton className="h-9 flex-1 rounded-xl" />
				</div>

				<Skeleton className="h-11 w-full rounded-[14px]" />
			</div>
		</div>
	);
}
