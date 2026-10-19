"use client";

import {
	BookOpen,
	CheckCircle2,
	ChevronDown,
	Circle,
	Clock,
	Code2,
	ExternalLink,
	FileText,
	Headphones,
	Image,
	Lock,
	Play,
	PresentationIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Enums } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { CourseDetail, LessonItem } from "@/types/queries.types";

export type CourseModuleListProps = {
	modules: CourseDetail["modules"];
	/** If provided, lesson rows become clickable links */
	onLessonClick?: (lessonId: string) => void;
	/** Pre-expanded module ids (controlled) */
	expandedModuleIds?: string[];
	/** Default-open module ids (uncontrolled) */
	defaultExpandedIds?: string[];
	className?: string;
};

// ─── Content type icon map ────────────────────────────────────────────────────

const CONTENT_TYPE_ICONS: Record<
	Enums<"lesson_content_type">,
	React.ElementType
> = {
	video: Play,
	text: FileText,
	audio: Headphones,
	pdf_document: BookOpen,
	slide_presentation: PresentationIcon,
	quiz: FileText,
	assignment: FileText,
	external_resource: ExternalLink,
	code_playground: Code2,
	image_based_question: Image,
} as any;

// ─── LessonRow ────────────────────────────────────────────────────────────────

function LessonRow({
	lesson,
	onClick,
}: {
	lesson: LessonItem;
	onClick?: (id: string) => void;
}) {
	const t = useTranslations("courses.detail");
	const Icon = CONTENT_TYPE_ICONS[lesson.content_type] ?? FileText;
	const isClickable = !!onClick || lesson.is_previewable;

	const content = (
		<div
			className={cn(
				"group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
				lesson.is_active
					? "bg-primary/10 text-primary"
					: "hover:bg-muted/60 text-foreground",
				isClickable ? "cursor-pointer" : "cursor-default"
			)}
			onClick={() => isClickable && onClick?.(lesson.id)}
			role={isClickable ? "button" : undefined}
			tabIndex={isClickable ? 0 : undefined}
			onKeyDown={
				isClickable
					? (e) => {
							if (e.key === "Enter" || e.key === " ") onClick?.(lesson.id);
						}
					: undefined
			}
		>
			{/* Completion indicator */}
			<span className="shrink-0">
				{lesson.lesson_progress?.is_completed ? (
					<CheckCircle2 className="size-4 text-emerald-500" />
				) : (
					<Circle className="size-4 text-muted-foreground/40" />
				)}
			</span>

			{/* Content type icon */}
			<Icon
				className={cn(
					"size-3.5 shrink-0",
					lesson.is_active ? "text-primary" : "text-muted-foreground"
				)}
			/>

			{/* Title */}
			<span className="flex-1 truncate leading-snug">{lesson.title}</span>

			{/* Right side: duration or preview badge or lock */}
			<div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
				{lesson.is_previewable && !onClick && (
					<span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
						{t("preview")}
					</span>
				)}
				{!lesson.is_previewable && !onClick && (
					<Lock className="size-3 text-muted-foreground/40" />
				)}
				{lesson.estimated_duration_minutes != null &&
					lesson.estimated_duration_minutes > 0 && (
						<span className="flex items-center gap-0.5">
							<Clock className="size-3" />
							{t("minutesShort", { count: lesson.estimated_duration_minutes })}
						</span>
					)}
			</div>
		</div>
	);

	return content;
}

// ─── ModuleSection ────────────────────────────────────────────────────────────

function ModuleSection({
	module,
	index,
	isOpen,
	onToggle,
	onLessonClick,
}: {
	module: CourseDetail["modules"][number];
	index: number;
	isOpen: boolean;
	onToggle: () => void;
	onLessonClick?: (id: string) => void;
}) {
	const t = useTranslations("courses.detail");
	const completedCount = module.lessons.filter(
		(l) => l.lesson_progress?.is_completed
	).length;
	const totalCount = module.lessons.length;
	const totalMinutes = module.lessons.reduce(
		(sum, l) => sum + (l.estimated_duration_minutes ?? 0),
		0
	);
	const isModuleComplete = totalCount > 0 && completedCount === totalCount;

	const meta: string[] = [t("totalLessons", { count: totalCount })];
	if (totalMinutes > 0) meta.push(t("minutesShort", { count: totalMinutes }));
	if (completedCount > 0)
		meta.push(
			t("completedOfTotal", { completed: completedCount, total: totalCount })
		);

	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border bg-card transition-colors",
				isOpen && "border-primary/20"
			)}
		>
			{/* Module header */}
			<button
				className="flex w-full items-center gap-3 p-4 text-start hover:bg-muted/30 transition-colors"
				onClick={onToggle}
				aria-expanded={isOpen}
			>
				{/* Module number / completion */}
				<span
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
						isModuleComplete
							? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
							: "bg-primary/10 text-primary"
					)}
				>
					{isModuleComplete ? <CheckCircle2 className="size-4" /> : index + 1}
				</span>

				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold leading-snug">{module.title}</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{meta.join(" · ")}
					</p>
				</div>

				<ChevronDown
					className={cn(
						"size-4 shrink-0 text-muted-foreground transition-transform duration-200",
						isOpen ? "rotate-180" : "rotate-0"
					)}
				/>
			</button>

			{/* Lessons list */}
			{isOpen && module.lessons.length > 0 && (
				<div className="border-t px-2 py-2 space-y-0.5">
					{module.lessons
						.slice()
						.sort((a, b) => a.order_index - b.order_index)
						.map((lesson) => (
							<LessonRow
								key={lesson.id}
								lesson={lesson}
								onClick={onLessonClick}
							/>
						))}
				</div>
			)}
		</div>
	);
}

// ─── CourseModuleList ─────────────────────────────────────────────────────────

export function CourseModuleList({
	modules,
	onLessonClick,
	expandedModuleIds,
	defaultExpandedIds,
	className,
}: CourseModuleListProps) {
	const t = useTranslations("courses.detail");

	// Controlled vs uncontrolled expansion
	const [openIds, setOpenIds] = React.useState<Set<string>>(
		() => new Set(defaultExpandedIds ?? (modules[0] ? [modules[0].id] : []))
	);

	const effectiveOpenIds = expandedModuleIds
		? new Set(expandedModuleIds)
		: openIds;

	function toggleModule(id: string) {
		if (expandedModuleIds) return; // controlled — parent handles it
		setOpenIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
	const totalMinutes = modules.reduce(
		(sum, m) =>
			sum +
			m.lessons.reduce((s, l) => s + (l.estimated_duration_minutes ?? 0), 0),
		0
	);

	const summary: string[] = [
		t("sectionCount", { count: modules.length }),
		t("totalLessons", { count: totalLessons }),
	];
	if (totalMinutes > 0) {
		summary.push(
			t("hoursMinutes", {
				hours: Math.floor(totalMinutes / 60),
				minutes: totalMinutes % 60,
			})
		);
	}

	return (
		<div className={cn("space-y-3", className)}>
			{/* Header row */}
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="text-xl font-semibold tracking-tight">
					{t("curriculum")}
				</h2>
				<span className="text-xs text-muted-foreground">
					{summary.join(" · ")}
				</span>
			</div>

			{/* Module sections */}
			{modules
				.slice()
				.sort((a, b) => a.order_index - b.order_index)
				.map((module, index) => (
					<ModuleSection
						key={module.id}
						module={module}
						index={index}
						isOpen={effectiveOpenIds.has(module.id)}
						onToggle={() => toggleModule(module.id)}
						onLessonClick={onLessonClick}
					/>
				))}
		</div>
	);
}
