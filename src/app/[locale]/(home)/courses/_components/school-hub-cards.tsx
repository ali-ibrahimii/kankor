"use client";

import {
	ArrowLeft,
	BookOpen,
	Clock,
	Code2,
	GraduationCap,
	Sparkles,
	Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import { cn } from "@/lib/utils";

import type { HubCourseItem, LearningPathItem } from "./school-hub-data";

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
	selected,
	onSelectPath,
}: {
	path: LearningPathItem;
	selected: boolean;
	onSelectPath: () => void;
}) {
	const t = useTranslations("schoolHub");

	return (
		<div
			className={cn(
				"flex h-full flex-col justify-between gap-3.5 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
				ACCENT_MAP[path.accent],
				selected &&
					"border-primary/70 bg-primary/[0.06] shadow-md ring-2 ring-primary/15"
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
				onClick={onSelectPath}
				aria-expanded={selected}
				aria-controls="path-course-sequence"
				className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
			>
				{selected ? t("pathSelectedBtn") : t("pathExploreBtn")}
				<ArrowLeft
					className="size-3.5 rtl:rotate-0 ltr:rotate-180"
					aria-hidden="true"
				/>
			</button>
		</div>
	);
}
