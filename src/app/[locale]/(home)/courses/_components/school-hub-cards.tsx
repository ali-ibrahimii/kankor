"use client";

import {
	ArrowLeft,
	BookOpen,
	Building2,
	Calendar,
	Clock,
	Code2,
	GraduationCap,
	Radio,
	School,
	Sparkles,
	Star,
	UserCheck,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import { cn } from "@/lib/utils";

import type {
	HubCourseItem,
	LearningPathItem,
	LiveSessionItem,
} from "./school-hub-data";

/* ──────────────────────────────────────────────────────────
   1. LIVE CLASS PHOTO CARD — Universities, Schools & Teachers
   ────────────────────────────────────────────────────────── */

export function LiveClassPhotoCard({ item }: { item: LiveSessionItem }) {
	const t = useTranslations("schoolHub");
	const seatsLeft = Math.max(0, item.capacity - item.enrolledCount);
	const fillPercent = Math.min(
		100,
		Math.round((item.enrolledCount / Math.max(1, item.capacity)) * 100)
	);

	const OrganizerIcon =
		item.organizerKind === "university"
			? Building2
			: item.organizerKind === "school"
				? School
				: UserCheck;

	const organizerRoleLabel =
		item.organizerKind === "university"
			? t("orgUniversityBadge")
			: item.organizerKind === "school"
				? t("orgSchoolBadge")
				: t("orgTeacherBadge");

	return (
		<article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/75 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg">
			{/* Real 16:9 Cover Photo — clean corner pills, NO floating center/bottom square icon */}
			<Link
				href={item.href}
				className="relative block aspect-[16/9] w-full overflow-hidden bg-muted"
			>
				<Image
					src={resolveEntityCardImage({
						customSrc: item.imageSrc,
						text: item.title,
						kind: "liveClass",
						seed: item.id,
					})}
					alt={item.title}
					fill
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent"
				/>

				{/* Top-start: Live pulse status OR Upcoming time pill */}
				<span
					className={cn(
						"absolute top-2.5 start-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm",
						item.status === "live"
							? "bg-rose-600"
							: "bg-slate-900/80 backdrop-blur-md"
					)}
				>
					<span
						className={cn(
							"size-1.5 rounded-full",
							item.status === "live"
								? "animate-pulse bg-white"
								: "bg-emerald-400"
						)}
					/>
					{item.statusLabel}
				</span>

				{/* Top-end: Rating pill */}
				<span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md tabular-nums top-2.5 end-2.5 absolute">
					<Star
						className="size-3 fill-amber-400 text-amber-400"
						aria-hidden="true"
					/>
					{item.rating.toFixed(1)}
				</span>

				{/* Bottom strip on cover: Organizer Kind + Free/Credits */}
				<div className="absolute inset-x-2.5 bottom-2 flex items-center justify-between gap-2">
					<span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-0.5 text-[11px] font-semibold text-slate-900 shadow-xs">
						<OrganizerIcon className="size-3 text-primary" aria-hidden="true" />
						{organizerRoleLabel}
					</span>
					<span className="rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs">
						{item.isFree
							? t("freeTag")
							: t("creditsTag", { credits: item.priceCredits ?? 0 })}
					</span>
				</div>
			</Link>

			{/* Compact, Information-Rich Body — Zero Blank Whitespace */}
			<div className="flex flex-1 flex-col gap-3 p-4">
				<div className="flex items-center justify-between gap-2 text-[11px]">
					<span className="font-semibold text-primary">{item.topic}</span>
					<span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground/85">
						{t("classCodeLabel", { code: item.joinCode })}
					</span>
				</div>

				<h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
					<Link href={item.href}>{item.title}</Link>
				</h3>

				{/* Instructor + Host Institution */}
				<div className="rounded-xl border border-border/60 bg-muted/35 px-3 py-2 text-xs">
					<p className="font-semibold text-foreground">{item.teacherName}</p>
					<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
						{item.organizerName}
					</p>
				</div>

				{/* Schedule + Format + Live Capacity Progress */}
				<div className="space-y-2 text-xs text-muted-foreground">
					<div className="flex flex-wrap items-center justify-between gap-1.5">
						<span className="inline-flex items-center gap-1 font-medium text-foreground/90">
							<Calendar
								className="size-3.5 text-primary/80"
								aria-hidden="true"
							/>
							{item.scheduleDays}
						</span>
						<span className="inline-flex items-center gap-1 tabular-nums">
							<Clock className="size-3.5 text-primary/80" aria-hidden="true" />
							{item.scheduleTime}
						</span>
					</div>
					<p className="truncate text-[11px] text-muted-foreground">
						{item.formatNote}
					</p>

					{/* Seat progress bar */}
					<div className="pt-0.5">
						<div className="mb-1 flex items-center justify-between text-[11px]">
							<span className="inline-flex items-center gap-1 font-medium text-foreground/85">
								<Users className="size-3 text-primary" aria-hidden="true" />
								{t("seatsProgress", {
									enrolled: item.enrolledCount,
									capacity: item.capacity,
								})}
							</span>
							<span className="font-semibold text-emerald-700 dark:text-emerald-400">
								{t("seatsLeft", { left: seatsLeft })}
							</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									item.status === "live" ? "bg-rose-500" : "bg-primary"
								)}
								style={{ width: `${fillPercent}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Action Button */}
				<div className="mt-auto pt-1">
					<Link
						href={item.href}
						className={cn(
							"inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors",
							item.status === "live"
								? "bg-rose-600 text-white hover:bg-rose-700"
								: "bg-primary text-primary-foreground hover:bg-primary/90"
						)}
					>
						<Radio className="size-3.5" aria-hidden="true" />
						{item.status === "live" ? t("enterLiveNow") : t("reserveLiveSeat")}
					</Link>
				</div>
			</div>
		</article>
	);
}

/* ──────────────────────────────────────────────────────────
   2. TECH & PROGRAMMING COURSE CARD — Front-end, Back-end, Coding
   ────────────────────────────────────────────────────────── */

export function HubTechCourseCard({ item }: { item: HubCourseItem }) {
	const t = useTranslations("schoolHub");

	const levelLabel =
		item.level === "beginner"
			? t("levelBeginner")
			: item.level === "intermediate"
				? t("levelIntermediate")
				: item.level === "advanced"
					? t("levelAdvanced")
					: t("levelAll");

	return (
		<Link
			href={item.href}
			className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/75 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg"
		>
			<div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
				<Image
					src={resolveEntityCardImage({
						customSrc: item.imageSrc,
						text: `${item.categoryLabel} ${item.title}`,
						kind: "course",
						seed: item.id,
					})}
					alt={item.title}
					fill
					sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 25vw"
					className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent"
				/>
				<span
					className={cn(
						"absolute top-2.5 start-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm",
						item.isFree ? "bg-emerald-600/95" : "bg-primary/95"
					)}
				>
					{item.isFree
						? t("freeTag")
						: t("creditsTag", { credits: item.priceCredits })}
				</span>
				<span className="absolute top-2.5 end-2.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md tabular-nums">
					<Star
						className="size-3 fill-amber-400 text-amber-400"
						aria-hidden="true"
					/>
					{item.rating.toFixed(1)}
				</span>
			</div>

			<div className="flex flex-1 flex-col gap-2.5 p-4">
				<div className="flex items-center justify-between gap-2 text-[11px]">
					<span className="inline-flex items-center gap-1 font-semibold text-primary">
						<Code2 className="size-3.5" aria-hidden="true" />
						{item.categoryLabel}
					</span>
					<span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
						{levelLabel}
					</span>
				</div>

				<h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
					{item.title}
				</h3>

				<p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
					{item.subtitle}
				</p>

				{/* Tech stack pills */}
				<div className="flex flex-wrap gap-1 pt-0.5">
					{item.tags.map((tag) => (
						<span
							key={tag}
							className="rounded-md border border-border/70 bg-muted/45 px-2 py-0.5 font-mono text-[10.5px] font-medium text-foreground/85"
						>
							{tag}
						</span>
					))}
				</div>

				<div className="mt-auto space-y-2 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate font-medium text-foreground/85">
							{item.instructorName}
						</span>
						<span className="shrink-0 font-semibold text-primary">
							{item.subLabel}
						</span>
					</div>
					<div className="flex items-center justify-between gap-2">
						<span className="inline-flex items-center gap-1">
							<BookOpen className="size-3" aria-hidden="true" />
							{t("lessonsUnit", { count: item.lessonsCount })}
						</span>
						<span className="inline-flex items-center gap-1">
							<Clock className="size-3" aria-hidden="true" />
							{t("hoursUnit", { count: item.durationHours })}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}

/* ──────────────────────────────────────────────────────────
   3. SKILL & CURRICULUM COURSE CARD — Technical, Life & School
   ────────────────────────────────────────────────────────── */

export function HubSkillCourseCard({ item }: { item: HubCourseItem }) {
	const t = useTranslations("schoolHub");

	return (
		<Link
			href={item.href}
			className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/75 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/45 hover:shadow-lg"
		>
			<div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
				<Image
					src={resolveEntityCardImage({
						customSrc: item.imageSrc,
						text: `${item.categoryLabel} ${item.title}`,
						kind: "course",
						seed: item.id,
					})}
					alt={item.title}
					fill
					sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 25vw"
					className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent"
				/>
				<span className="absolute top-2.5 start-2.5 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
					{item.isFree
						? t("freeTag")
						: t("creditsTag", { credits: item.priceCredits })}
				</span>
				<span className="absolute top-2.5 end-2.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md tabular-nums">
					<Star
						className="size-3 fill-amber-400 text-amber-400"
						aria-hidden="true"
					/>
					{item.rating.toFixed(1)}
				</span>
			</div>

			<div className="flex flex-1 flex-col gap-2.5 p-4">
				<div className="flex items-center justify-between gap-2 text-[11px]">
					<span className="font-semibold text-emerald-700 dark:text-emerald-400">
						{item.categoryLabel}
					</span>
					<span className="text-muted-foreground">{item.subLabel}</span>
				</div>

				<h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
					{item.title}
				</h3>

				<p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
					{item.subtitle}
				</p>

				<div className="flex flex-wrap gap-1 pt-0.5">
					{item.tags.map((tag) => (
						<span
							key={tag}
							className="rounded-full bg-emerald-500/8 px-2.5 py-0.5 text-[10.5px] font-medium text-emerald-800 dark:text-emerald-300"
						>
							{tag}
						</span>
					))}
				</div>

				<div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
					<span className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-foreground/85">
						<GraduationCap
							className="size-3.5 shrink-0 text-emerald-600"
							aria-hidden="true"
						/>
						<span className="truncate">{item.instructorName}</span>
					</span>
					<span className="shrink-0 tabular-nums">
						{t("lessonsUnit", { count: item.lessonsCount })} ·{" "}
						{t("hoursUnit", { count: item.durationHours })}
					</span>
				</div>
			</div>
		</Link>
	);
}

/* ──────────────────────────────────────────────────────────
   4. GUIDED LEARNING PATH CARD — Step-by-Step Roadmaps
   ────────────────────────────────────────────────────────── */

const ACCENT_MAP = {
	violet:
		"border-violet-500/25 bg-violet-500/[0.03] hover:border-violet-500/50 dark:bg-violet-500/[0.06]",
	sky: "border-sky-500/25 bg-sky-500/[0.03] hover:border-sky-500/50 dark:bg-sky-500/[0.06]",
	emerald:
		"border-emerald-500/25 bg-emerald-500/[0.03] hover:border-emerald-500/50 dark:bg-emerald-500/[0.06]",
	amber:
		"border-amber-500/25 bg-amber-500/[0.03] hover:border-amber-500/50 dark:bg-amber-500/[0.06]",
} as const;

export function LearningPathCard({
	path,
	onSelectTrack,
}: {
	path: LearningPathItem;
	onSelectTrack: () => void;
}) {
	const t = useTranslations("schoolHub");

	return (
		<div
			className={cn(
				"flex h-full flex-col justify-between gap-3.5 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
				ACCENT_MAP[path.accent]
			)}
		>
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-2 text-[11px]">
					<span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-0.5 font-semibold text-foreground shadow-2xs ring-1 ring-border/70">
						<Sparkles className="size-3 text-primary" aria-hidden="true" />
						{t("pathCoursesCount", { count: path.coursesCount })}
					</span>
					<span className="font-medium text-muted-foreground">
						{path.durationLabel}
					</span>
				</div>

				<h3 className="text-base font-bold tracking-tight text-foreground">
					{path.title}
				</h3>
				<p className="text-xs leading-relaxed text-muted-foreground">
					{path.subtitle}
				</p>
			</div>

			{/* Numbered step chips */}
			<ol className="grid grid-cols-2 gap-1.5 pt-1">
				{path.steps.map((step, index) => (
					<li
						key={step}
						className="flex items-center gap-1.5 rounded-lg border border-border/65 bg-background/90 px-2.5 py-1.5 text-[11px] font-medium text-foreground"
					>
						<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
							{index + 1}
						</span>
						<span className="truncate">{step}</span>
					</li>
				))}
			</ol>

			<button
				type="button"
				onClick={onSelectTrack}
				className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
			>
				{t("pathExploreBtn")}
				<ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
			</button>
		</div>
	);
}
