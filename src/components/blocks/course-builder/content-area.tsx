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
	Code2Icon,
	FileTextIcon,
	LinkIcon,
	PlusIcon,
	PresentationIcon,
	VideoIcon,
	Volume2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlockEditor } from "./block-editor";
import {
	activeBlocksAtom,
	activeLessonAtom,
	addBlockAtom,
	courseBuilderAtom,
	reorderBlocksAtom,
} from "./store";
import type { DraftContentBlock, LessonContentType } from "./types";
import { ADDABLE_BLOCK_TYPES, createEmptyBlock } from "./types";

// ─── Block type icon map (for the "Add block" dropdown) ──────────────────────

const ADD_BLOCK_ICONS: Partial<Record<LessonContentType, React.ElementType>> = {
	text: FileTextIcon,
	video: VideoIcon,
	audio: Volume2Icon,
	pdf_document: FileTextIcon,
	slide_presentation: PresentationIcon,
	external_resource: LinkIcon,
	code_playground: Code2Icon,
};

// ─── Sortable block wrapper ───────────────────────────────────────────────────

function SortableBlock({
	block,
	index,
	isActive,
}: {
	block: DraftContentBlock;
	index: number;
	isActive: boolean;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: block.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 50 : undefined,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<BlockEditor
				block={block}
				index={index}
				isActive={isActive}
				dragHandleProps={
					{
						...attributes,
						...listeners,
					} as React.HTMLAttributes<HTMLButtonElement>
				}
			/>
		</div>
	);
}

// ─── Content Area ─────────────────────────────────────────────────────────────

export function ContentArea() {
	const t = useTranslations("courseBuilder");
	const lesson = useAtomValue(activeLessonAtom);
	const blocks = useAtomValue(activeBlocksAtom);
	const { activeBlockId, courseId } = useAtomValue(courseBuilderAtom);
	const addBlock = useSetAtom(addBlockAtom);
	const reorderBlocks = useSetAtom(reorderBlocksAtom);

	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIdx = blocks.findIndex((b) => b.id === active.id);
		const newIdx = blocks.findIndex((b) => b.id === over.id);
		if (oldIdx === -1 || newIdx === -1) return;
		reorderBlocks(arrayMove(blocks, oldIdx, newIdx));
	}

	function handleAddBlock(type: LessonContentType) {
		if (!lesson) return;
		const newBlock = createEmptyBlock(lesson.id, courseId, type, blocks.length);
		addBlock(newBlock);
	}

	// ── Empty state: no lesson selected ──────────────────────────────────────

	if (!lesson) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground p-8">
				<div className="rounded-full bg-muted p-4">
					<FileTextIcon className="size-8" />
				</div>
				<div>
					<p className="font-medium">{t("content.noLessonTitle")}</p>
					<p className="mt-1 text-sm">{t("content.noLessonDescription")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Lesson header */}
			<div className="flex items-center gap-3 border-b px-6 py-3">
				<div className="flex-1 min-w-0">
					<h2 className="truncate text-sm font-semibold">
						{lesson.title || t("lesson.untitled")}
					</h2>
				</div>
				<Badge variant="secondary" className="shrink-0 text-xs capitalize">
					{t(`contentType.${lesson.content_type}` as Parameters<typeof t>[0])}
				</Badge>
				{lesson.is_previewable && (
					<Badge variant="outline" className="shrink-0 text-xs">
						{t("lesson.previewBadge")}
					</Badge>
				)}
			</div>

			{/* Block list */}
			<ScrollArea className="flex-1">
				<div className="px-6 py-4 space-y-4">
					{blocks.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
							<p className="text-sm">{t("content.noBlocksTitle")}</p>
							<p className="mt-1 text-xs">{t("content.noBlocksDescription")}</p>
						</div>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							modifiers={[restrictToVerticalAxis]}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={blocks.map((b) => b.id)}
								strategy={verticalListSortingStrategy}
							>
								{blocks.map((block, index) => (
									<SortableBlock
										key={block.id}
										block={block}
										index={index}
										isActive={false}
									/>
								))}
							</SortableContext>
						</DndContext>
					)}

					{/* Add block button */}
					<AddBlockMenu onAdd={handleAddBlock} />
				</div>
			</ScrollArea>
		</div>
	);
}

// ─── Add Block dropdown ───────────────────────────────────────────────────────

function AddBlockMenu({ onAdd }: { onAdd: (type: LessonContentType) => void }) {
	const t = useTranslations("courseBuilder");
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="w-full border-dashed">
					<PlusIcon className="size-4 me-2" />
					{t("block.addBlock")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" className="w-52">
				<DropdownMenuLabel>{t("block.chooseType")}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{ADDABLE_BLOCK_TYPES.map((type) => {
					const Icon = ADD_BLOCK_ICONS[type] ?? FileTextIcon;
					return (
						<DropdownMenuItem
							key={type}
							onClick={() => onAdd(type)}
							className="gap-2"
						>
							<Icon className="size-4 text-muted-foreground" />
							{t(`block.type.${type}` as Parameters<typeof t>[0])}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
