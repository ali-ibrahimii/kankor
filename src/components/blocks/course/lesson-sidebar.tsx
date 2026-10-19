"use client";

import {
	BookOpen,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Circle,
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
import { Progress } from "@/components/ui/progress";
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

// ─── SidebarLessonRow ─────────────────────────────────────────────────────────

function SidebarLessonRow({
	lesson,
	isActive,
	onSelect,
}: {
	lesson: LessonItem;
	isActive: boolean;
	onSelect: () => void;
}) {
	const Icon = TYPE_ICONS[lesson.content_type] ?? FileText;

	return (
		<button
			className={cn(
				"group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm transition-colors",
				isActive
					? "bg-primary/10 font-medium text-primary"
					: "hover:bg-muted/60 text-foreground"
			)}
			onClick={onSelect}
			aria-current={isActive ? "step" : undefined}
		>
			{/* Completion */}
			<span className="shrink-0">
				{lesson.lesson_progress?.is_completed ? (
					<CheckCircle2 className="size-4 text-emerald-500" />
				) : (
					<Circle
						className={cn(
							"size-4",
							isActive ? "text-primary/40" : "text-muted-foreground/30"
						)}
					/>
				)}
			</span>

			{/* Icon */}
			<Icon
				className={cn(
					"size-3.5 shrink-0",
					isActive ? "text-primary" : "text-muted-foreground"
				)}
			/>

			{/* Title */}
			<span className="flex-1 truncate leading-snug">{lesson.title}</span>

			{/* Duration */}
			{lesson.estimated_duration_minutes != null && (
				<span className="shrink-0 text-xs text-muted-foreground">
					{lesson.estimated_duration_minutes}m
				</span>
			)}
		</button>
	);
}

// ─── SidebarModuleSection ─────────────────────────────────────────────────────

function SidebarModuleSection({
	module,
	activeLessonId,
	onLessonSelect,
}: {
	module: ModuleItem;
	activeLessonId: string;
	onLessonSelect: (id: string) => void;
}) {
	const hasActive = module.lessons.some((l) => l.id === activeLessonId);
	const [isOpen, setIsOpen] = React.useState(hasActive);

	const completedCount = module.lessons.filter(
		(l) => l.lesson_progress?.is_completed
	).length;

	return (
		<div>
			{/* Module header */}
			<button
				className="flex w-full items-center gap-2 px-3 py-2 text-start hover:bg-muted/30 rounded-lg transition-colors"
				onClick={() => setIsOpen((v) => !v)}
				aria-expanded={isOpen}
			>
				<ChevronDown
					className={cn(
						"size-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
						!isOpen && "-rotate-90"
					)}
				/>
				<span className="flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{module.title}
				</span>
				<span className="shrink-0 text-xs text-muted-foreground">
					{completedCount}/{module.lessons.length}
				</span>
			</button>

			{isOpen && (
				<div className="ms-2 mt-0.5 space-y-0.5 border-s border-border ps-2">
					{module.lessons
						.slice()
						.sort((a, b) => a.order_index - b.order_index)
						.map((lesson) => (
							<SidebarLessonRow
								key={lesson.id}
								lesson={lesson}
								isActive={lesson.id === activeLessonId}
								onSelect={() => onLessonSelect(lesson.id)}
							/>
						))}
				</div>
			)}
		</div>
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

	return (
		<>
			{/* Mobile overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/40 lg:hidden"
					onClick={onClose}
					aria-hidden="true"
				/>
			)}

			{/* Sidebar panel */}
			<aside
				className={cn(
					// Mobile: slide in from end
					"fixed inset-y-0 end-0 z-40 w-80 border-s bg-background transition-transform duration-300 lg:static lg:z-auto lg:border-s lg:transition-none",
					// RTL-aware slide, mobile only — at lg+ the sidebar is static and
					// must never be translated off-screen
					isOpen
						? "translate-x-0"
						: "max-lg:translate-x-full max-lg:rtl:-translate-x-full",
					className
				)}
			>
				<div className="flex h-full flex-col">
					{/* Header */}
					<div className="flex items-center gap-2 border-b px-4 py-3">
						<div className="flex-1 min-w-0">
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{t("courseContent")}
							</p>
							<p className="mt-0.5 truncate text-sm font-medium">
								{courseTitle}
							</p>
						</div>
						<button
							onClick={onClose}
							className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
							aria-label="Close sidebar"
						>
							<X className="size-4" />
						</button>
					</div>

					{/* Progress bar */}
					{totalProgress != null && (
						<div className="border-b px-4 py-3">
							<div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
								<span>
									{completedLessons}/{totalLessons}
								</span>
								<span>{Math.round(totalProgress)}%</span>
							</div>
							<Progress value={totalProgress} className="h-1.5" />
						</div>
					)}

					{/* Lesson list */}
					<ScrollArea className="flex-1">
						<div className="space-y-1 p-3">
							{modules
								.slice()
								.sort((a, b) => a.order_index - b.order_index)
								.map((module) => (
									<SidebarModuleSection
										key={module.id}
										module={module}
										activeLessonId={activeLessonId}
										onLessonSelect={(id) => {
											onLessonSelect(id);
											onClose();
										}}
									/>
								))}
						</div>
					</ScrollArea>
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
			className="gap-1.5"
			aria-label={isOpen ? "Close course content" : "Open course content"}
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
