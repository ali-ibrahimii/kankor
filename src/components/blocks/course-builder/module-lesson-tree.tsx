"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAtomValue, useSetAtom } from "jotai";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	GripVerticalIcon,
	PlusIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LessonDetailDialog } from "./lesson-detail-dialog";
import { ModuleDetailDialog } from "./module-detail-dialog";
import {
	activeLessonsAtom,
	activeModulesAtom,
	addLessonAtom,
	addModuleAtom,
	courseBuilderAtom,
	deleteLessonAtom,
	deleteModuleAtom,
	expandedModuleIdsAtom,
	patchLessonAtom,
	patchModuleAtom,
	reorderLessonsInModuleAtom,
	reorderModulesAtom,
	setActiveLessonAtom,
	toggleModuleExpandAtom,
} from "./store";
import type { DraftLesson, DraftModule } from "./types";
import { createEmptyLesson, createEmptyModule } from "./types";

// ─── Inline Edit Input ────────────────────────────────────────────────────────

function InlineEditInput({
	value,
	placeholder,
	className,
	onCommit,
}: {
	value: string;
	placeholder: string;
	className?: string;
	onCommit: (next: string) => void;
}) {
	const [editing, setEditing] = React.useState(false);
	const [draft, setDraft] = React.useState(value);
	const inputRef = React.useRef<HTMLInputElement>(null);

	function enter(e: React.MouseEvent) {
		e.stopPropagation();
		setDraft(value);
		setEditing(true);
	}

	React.useEffect(() => {
		if (editing) {
			inputRef.current?.select();
		}
	}, [editing]);

	function commit() {
		const trimmed = draft.trim();
		if (trimmed) onCommit(trimmed);
		setEditing(false);
	}

	function cancel() {
		setDraft(value);
		setEditing(false);
	}

	if (editing) {
		return (
			<input
				ref={inputRef}
				value={draft}
				className={cn(
					"flex-1 min-w-0 rounded border border-primary/60 bg-background px-1 py-0 text-sm outline-none focus:ring-1 focus:ring-primary/40",
					className
				)}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						commit();
					}
					if (e.key === "Escape") {
						e.preventDefault();
						cancel();
					}
				}}
				onClick={(e) => e.stopPropagation()}
			/>
		);
	}

	return (
		<span
			className={cn("flex-1 truncate", className)}
			onDoubleClick={enter}
			title={value || placeholder}
		>
			{value || <span className="text-muted-foreground">{placeholder}</span>}
		</span>
	);
}

// ─── Sortable Lesson Row ──────────────────────────────────────────────────────

function SortableLessonRow({
	lesson,
	isActive,
	onEdit,
}: {
	lesson: DraftLesson;
	isActive: boolean;
	onEdit: (lesson: DraftLesson) => void;
}) {
	const t = useTranslations("courseBuilder");
	const setActiveLesson = useSetAtom(setActiveLessonAtom);
	const deleteLesson = useSetAtom(deleteLessonAtom);
	const patchLesson = useSetAtom(patchLessonAtom);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: lesson.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					ref={setNodeRef}
					style={style}
					className={cn(
						"group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer select-none",
						"hover:bg-accent/60 transition-colors",
						isActive && "bg-accent font-medium",
						isDragging && "opacity-50 z-50"
					)}
					onClick={() => setActiveLesson(lesson.id)}
				>
					{/* Drag handle */}
					<button
						{...attributes}
						{...listeners}
						className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={(e) => e.stopPropagation()}
						aria-label={t("common.dragToReorder")}
					>
						<GripVerticalIcon className="size-3.5" />
					</button>

					<InlineEditInput
						value={lesson.title}
						placeholder={t("lesson.untitled")}
						onCommit={(title) =>
							patchLesson({ id: lesson.id, patch: { title } })
						}
					/>

					<ContentTypeBadge type={lesson.content_type} />
				</div>
			</ContextMenuTrigger>

			<ContextMenuContent>
				<ContextMenuItem onClick={() => onEdit(lesson)}>
					{t("lesson.editDetails")}
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem
					className="text-destructive focus:text-destructive"
					onClick={() => deleteLesson(lesson.id)}
				>
					{t("common.delete")}
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

// ─── Sortable Module Row ──────────────────────────────────────────────────────

function SortableModuleRow({
	module,
	lessons,
	activeLessonId,
	onEditModule,
	onEditLesson,
}: {
	module: DraftModule;
	lessons: DraftLesson[];
	activeLessonId: string | null;
	onEditModule: (module: DraftModule) => void;
	onEditLesson: (lesson: DraftLesson) => void;
}) {
	const t = useTranslations("courseBuilder");
	const expandedIds = useAtomValue(expandedModuleIdsAtom);
	const { courseId } = useAtomValue(courseBuilderAtom);
	const toggleExpand = useSetAtom(toggleModuleExpandAtom);
	const deleteModule = useSetAtom(deleteModuleAtom);
	const patchModule = useSetAtom(patchModuleAtom);
	const addLesson = useSetAtom(addLessonAtom);
	const reorderLessons = useSetAtom(reorderLessonsInModuleAtom);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: module.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const isExpanded = expandedIds.has(module.id);
	const moduleLessons = lessons
		.filter((l) => l.module_id === module.id && !l._deleted)
		.sort((a, b) => a.order_index - b.order_index);

	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	function handleLessonDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIdx = moduleLessons.findIndex((l) => l.id === active.id);
		const newIdx = moduleLessons.findIndex((l) => l.id === over.id);
		if (oldIdx === -1 || newIdx === -1) return;
		reorderLessons({
			moduleId: module.id,
			reordered: arrayMove(moduleLessons, oldIdx, newIdx),
		});
	}

	function handleAddLesson() {
		const newLesson = createEmptyLesson(
			module.id,
			courseId,
			moduleLessons.length
		);
		addLesson(newLesson);
		if (!isExpanded) toggleExpand(module.id);
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn("rounded-lg overflow-hidden", isDragging && "opacity-50")}
		>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div className="group flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-2 select-none">
						{/* Drag handle */}
						<button
							{...attributes}
							{...listeners}
							className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
							aria-label={t("common.dragToReorder")}
						>
							<GripVerticalIcon className="size-3.5" />
						</button>

						{/* Expand toggle */}
						<button
							className="shrink-0 text-muted-foreground"
							onClick={() => toggleExpand(module.id)}
							aria-label={
								isExpanded ? t("common.collapse") : t("common.expand")
							}
						>
							{isExpanded ? (
								<ChevronDownIcon className="size-4" />
							) : (
								<ChevronRightIcon className="size-4" />
							)}
						</button>

						<InlineEditInput
							value={module.title}
							placeholder={t("module.untitled")}
							className="font-medium"
							onCommit={(title) =>
								patchModule({ id: module.id, patch: { title } })
							}
						/>

						<span className="text-xs text-muted-foreground tabular-nums">
							{moduleLessons.length}
						</span>
					</div>
				</ContextMenuTrigger>

				<ContextMenuContent>
					<ContextMenuItem onClick={() => onEditModule(module)}>
						{t("module.editDetails")}
					</ContextMenuItem>
					<ContextMenuItem onClick={handleAddLesson}>
						{t("lesson.addLesson")}
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						className="text-destructive focus:text-destructive"
						onClick={() => deleteModule(module.id)}
					>
						{t("common.delete")}
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

			{/* Lessons */}
			{isExpanded && (
				<div className="ms-4 mt-0.5 space-y-0.5 border-s ps-2">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						onDragEnd={handleLessonDragEnd}
					>
						<SortableContext
							items={moduleLessons.map((l) => l.id)}
							strategy={verticalListSortingStrategy}
						>
							{moduleLessons.map((lesson) => (
								<SortableLessonRow
									key={lesson.id}
									lesson={lesson}
									isActive={lesson.id === activeLessonId}
									onEdit={onEditLesson}
								/>
							))}
						</SortableContext>
					</DndContext>

					{/* Add lesson */}
					<button
						onClick={handleAddLesson}
						className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
					>
						<PlusIcon className="size-3" />
						{t("lesson.addLesson")}
					</button>
				</div>
			)}
		</div>
	);
}

// ─── Content type badge ───────────────────────────────────────────────────────

const TYPE_SHORT: Record<string, string> = {
	video: "VID",
	text: "TXT",
	audio: "AUD",
	pdf_document: "PDF",
	slide_presentation: "PPT",
	quiz: "QUZ",
	assignment: "ASN",
	external_resource: "EXT",
	code_playground: "COD",
};

function ContentTypeBadge({ type }: { type: string }) {
	return (
		<Badge
			variant="secondary"
			className="shrink-0 text-[10px] px-1 py-0 font-mono h-4"
		>
			{TYPE_SHORT[type] ?? type.slice(0, 3).toUpperCase()}
		</Badge>
	);
}

// ─── Module Lesson Tree (root) ────────────────────────────────────────────────

export function ModuleLessonTree() {
	const t = useTranslations("courseBuilder");
	const { courseId, activeLessonId } = useAtomValue(courseBuilderAtom);
	const modules = useAtomValue(activeModulesAtom);
	const lessons = useAtomValue(activeLessonsAtom);
	const addModule = useSetAtom(addModuleAtom);
	const reorderModules = useSetAtom(reorderModulesAtom);

	const [editingModule, setEditingModule] = React.useState<DraftModule | null>(
		null
	);
	const [editingLesson, setEditingLesson] = React.useState<DraftLesson | null>(
		null
	);

	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	function handleModuleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIdx = modules.findIndex((m) => m.id === active.id);
		const newIdx = modules.findIndex((m) => m.id === over.id);
		if (oldIdx === -1 || newIdx === -1) return;
		reorderModules(arrayMove(modules, oldIdx, newIdx));
	}

	function handleAddModule() {
		const newModule = createEmptyModule(courseId, modules.length);
		addModule(newModule);
		// Open detail dialog immediately so user can name it
		setEditingModule(newModule);
	}

	return (
		<>
			<div className="flex h-full flex-col">
				{/* Header */}
				<div className="flex items-center justify-between border-b px-4 py-3">
					<h2 className="text-sm font-semibold">{t("tree.title")}</h2>
					<Button
						size="sm"
						variant="ghost"
						className="h-7 px-2 text-xs"
						onClick={handleAddModule}
					>
						<PlusIcon className="size-3.5 me-1" />
						{t("module.add")}
					</Button>
				</div>

				{/* Module list */}
				<ScrollArea className="flex-1 px-3 py-3">
					{modules.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
							<p>{t("tree.emptyTitle")}</p>
							<p className="mt-1 text-xs">{t("tree.emptyDescription")}</p>
							<Button
								size="sm"
								variant="outline"
								className="mt-4"
								onClick={handleAddModule}
							>
								<PlusIcon className="size-3.5 me-1" />
								{t("module.add")}
							</Button>
						</div>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							modifiers={[restrictToVerticalAxis]}
							onDragEnd={handleModuleDragEnd}
						>
							<SortableContext
								items={modules.map((m) => m.id)}
								strategy={verticalListSortingStrategy}
							>
								<div className="space-y-1.5">
									{modules.map((module) => (
										<SortableModuleRow
											key={module.id}
											module={module}
											lessons={lessons}
											activeLessonId={activeLessonId}
											onEditModule={setEditingModule}
											onEditLesson={setEditingLesson}
										/>
									))}
								</div>
							</SortableContext>
						</DndContext>
					)}
				</ScrollArea>
			</div>

			{/* Dialogs */}
			<ModuleDetailDialog
				module={editingModule}
				open={editingModule !== null}
				onOpenChange={(open) => {
					if (!open) setEditingModule(null);
				}}
			/>
			<LessonDetailDialog
				lesson={editingLesson}
				open={editingLesson !== null}
				onOpenChange={(open) => {
					if (!open) setEditingLesson(null);
				}}
			/>
		</>
	);
}
