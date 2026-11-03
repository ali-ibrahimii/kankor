"use client";

import {
	BookOpen,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	Code2,
	ExternalLink,
	FileText,
	Headphones,
	Play,
	PresentationIcon,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LessonItem, ModuleItem } from "@/types/queries.types";

// ─── Content type icon map ────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
	video: Play,
	text: FileText,
	audio: Headphones,
	pdf_document: BookOpen,
	slide_presentation: PresentationIcon,
	quiz: FileText,
	assignment: FileText,
	external_resource: ExternalLink,
	code_playground: Code2,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonSidebarProps = {
	courseTitle: string;
	modules: ModuleItem[];
	activeLessonId: string;
	totalProgress?: number;
	onLessonSelect: (lessonId: string) => void;
	isOpen: boolean;
	onClose: () => void;
	className?: string;
};

/** Modules created by the course builder may still carry a raw `__DEFAULT__`. */
function readableModuleTitle(title?: string | null) {
	const trimmed = (title ?? "").trim();
	if (!trimmed || /^__.*__$/.test(trimmed)) return null;
	return trimmed;
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ value }: { value: number }) {
	const clamped = Math.max(0, Math.min(100, Math.round(value)));
	const radius = 20;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (clamped / 100) * circumference;

	return (
		<div className="relative size-12 shrink-0">
			<svg
				viewBox="0 0 48 48"
				className="size-12 -rotate-90"
				role="img"
				aria-label={`${clamped}%`}
			>
				<circle
					cx="24"
					cy="24"
					r={radius}
					fill="none"
					strokeWidth="4"
					className="stroke-muted"
				/>
				<circle
					cx="24"
					cy="24"
					r={radius}
					fill="none"
					strokeWidth="4"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className="stroke-primary transition-[stroke-dashoffset] duration-500"
				/>
			</svg>
			<span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums">
				{clamped}%
			</span>
		</div>
	);
}

// ─── SidebarLessonRow ─────────────────────────────────────────────────────────

const SidebarLessonRow = React.forwardRef<
	HTMLButtonElement,
	{
		lesson: LessonItem;
		index: number;
		isActive: boolean;
		onSelect: () => void;
	}
>(function SidebarLessonRow({ lesson, index, isActive, onSelect }, ref) {
	const t = useTranslations("courses.learn");
	const Icon = TYPE_ICONS[lesson.content_type] ?? FileText;
	const isCompleted = Boolean(lesson.lesson_progress?.is_completed);

	return (
		<button
			ref={ref}
			type="button"
			onClick={onSelect}
			aria-current={isActive ? "step" : undefined}
			className={cn(
				"group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start transition-colors",
				isActive
					? "bg-primary/10 text-primary ring-1 ring-primary/20"
					: "hover:bg-muted/60"
			)}
		>
			{/* Step indicator */}
			<span
				className={cn(
					"flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums transition-colors",
					isCompleted
						? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
						: isActive
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground"
				)}
			>
				{isCompleted ? (
					<CheckCircle2 className="size-3.5" />
				) : (
					<>
						<span className="group-hover:hidden">{index}</span>
						<Icon className="hidden size-3 group-hover:block" />
					</>
				)}
			</span>

			{/* Title */}
			<span
				className={cn(
					"min-w-0 flex-1 truncate text-[13px] leading-snug",
					isActive ? "font-bold" : "font-medium"
				)}
			>
				{lesson.title}
			</span>

			{/* Duration */}
			{lesson.estimated_duration_minutes != null && (
				<span className="flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground">
					<Clock className="size-2.5" />
					{lesson.estimated_duration_minutes}
				</span>
			)}

			{isActive && <span className="sr-only">{t("currentLesson")}</span>}
		</button>
	);
});

// ─── SidebarModuleSection ─────────────────────────────────────────────────────

function SidebarModuleSection({
	module,
	moduleIndex,
	activeLessonId,
	onLessonSelect,
}: {
	module: ModuleItem;
	moduleIndex: number;
	activeLessonId: string;
	onLessonSelect: (id: string) => void;
}) {
	const t = useTranslations("courses.learn");
	const hasActive = module.lessons.some((l) => l.id === activeLessonId);
	const [isOpen, setIsOpen] = React.useState(true);
	const activeRef = React.useRef<HTMLButtonElement>(null);

	const orderedLessons = React.useMemo(
		() => module.lessons.slice().sort((a, b) => a.order_index - b.order_index),
		[module.lessons]
	);

	const completedCount = orderedLessons.filter(
		(l) => l.lesson_progress?.is_completed
	).length;
	const percent =
		orderedLessons.length > 0
			? (completedCount / orderedLessons.length) * 100
			: 0;

	// Keep the lesson the learner is watching in view.
	React.useEffect(() => {
		if (!hasActive) return;
		activeRef.current?.scrollIntoView?.({ block: "nearest" });
	}, [hasActive, activeLessonId]);

	const title = readableModuleTitle(module.title) ?? t("unnamedModule");

	return (
		<section className="pb-1">
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				aria-expanded={isOpen}
				className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start transition-colors hover:bg-muted/50"
			>
				<ChevronDown
					className={cn(
						"size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
						!isOpen && "-rotate-90 rtl:rotate-90"
					)}
				/>
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
						{title}
					</span>
					<span className="mt-1 flex items-center gap-2">
						<span className="h-1 w-full max-w-24 overflow-hidden rounded-full bg-muted">
							<span
								className="block h-full rounded-full bg-emerald-500 transition-[width] duration-500"
								style={{ width: `${percent}%` }}
							/>
						</span>
						<span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
							{completedCount}/{orderedLessons.length}
						</span>
					</span>
				</span>
				<span className="sr-only">
					{t("moduleNumber", { number: moduleIndex + 1 })}
				</span>
			</button>

			{isOpen && (
				<div className="mt-1 space-y-0.5">
					{orderedLessons.map((lesson, index) => (
						<SidebarLessonRow
							key={lesson.id}
							ref={lesson.id === activeLessonId ? activeRef : undefined}
							lesson={lesson}
							index={index + 1}
							isActive={lesson.id === activeLessonId}
							onSelect={() => onLessonSelect(lesson.id)}
						/>
					))}
				</div>
			)}
		</section>
	);
}

// ─── LessonSidebar ────────────────────────────────────────────────────────────

export function LessonSidebar({
	courseTitle,
	modules,
	activeLessonId,
	totalProgress,
	onLessonSelect,
	isOpen,
	onClose,
	className,
}: LessonSidebarProps) {
	const t = useTranslations("courses.learn");

	const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
	const completedLessons = modules.reduce(
		(s, m) =>
			s + m.lessons.filter((l) => l.lesson_progress?.is_completed).length,
		0
	);
	const percent =
		totalProgress ??
		(totalLessons ? (completedLessons / totalLessons) * 100 : 0);

	const orderedModules = React.useMemo(
		() => modules.slice().sort((a, b) => a.order_index - b.order_index),
		[modules]
	);

	return (
		<>
			{/* Mobile overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
					onClick={onClose}
					aria-hidden="true"
				/>
			)}

			{/* Sidebar panel */}
			<aside
				className={cn(
					// Mobile: slide in from the end side
					"fixed inset-y-0 end-0 z-40 flex w-[min(21rem,88vw)] flex-col border-s border-border/70 bg-background shadow-xl transition-transform duration-300 lg:static lg:z-auto lg:w-[320px] lg:shadow-none xl:w-[344px]",
					isOpen
						? "translate-x-0"
						: "max-lg:translate-x-full max-lg:rtl:-translate-x-full",
					className
				)}
			>
				{/* Summary header */}
				<div className="shrink-0 border-b border-border/70 bg-gradient-to-b from-primary/5 to-transparent px-4 py-3.5">
					<div className="flex items-start gap-3">
						<ProgressRing value={percent} />
						<div className="min-w-0 flex-1">
							<p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
								{t("courseContent")}
							</p>
							<p className="mt-0.5 truncate text-sm font-bold leading-snug">
								{courseTitle}
							</p>
							<p className="mt-0.5 text-[11px] text-muted-foreground">
								{t("lessonsProgress", {
									done: completedLessons,
									total: totalLessons,
								})}
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
							aria-label={t("closeCourseContent")}
						>
							<X className="size-4" />
						</button>
					</div>
				</div>

				{/* Lesson list */}
				<ScrollArea className="min-h-0 flex-1">
					<div className="space-y-2 p-2.5">
						{orderedModules.map((module, moduleIndex) => (
							<SidebarModuleSection
								key={module.id}
								module={module}
								moduleIndex={moduleIndex}
								activeLessonId={activeLessonId}
								onLessonSelect={(id) => {
									onLessonSelect(id);
									onClose();
								}}
							/>
						))}
					</div>
				</ScrollArea>

				{/* Footer hint */}
				<div className="shrink-0 border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
					<span className="inline-flex items-center gap-1.5">
						<CheckCircle2 className="size-3.5 text-emerald-500" />
						{t("completedLessonsHint", {
							done: completedLessons,
							total: totalLessons,
						})}
					</span>
				</div>
			</aside>
		</>
	);
}

// ─── LessonSidebarToggle ──────────────────────────────────────────────────────

export function LessonSidebarToggle({
	isOpen,
	onToggle,
}: {
	isOpen: boolean;
	onToggle: () => void;
}) {
	const t = useTranslations("courses.learn");

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={onToggle}
			className="h-9 gap-1.5 rounded-xl border-border/70 text-xs font-bold"
			aria-label={isOpen ? t("closeCourseContent") : t("openCourseContent")}
		>
			{isOpen ? (
				<ChevronRight className="size-4 rtl:rotate-180" />
			) : (
				<ChevronLeft className="size-4 rtl:rotate-180" />
			)}
			<span className="hidden sm:inline">{t("courseContent")}</span>
		</Button>
	);
}
