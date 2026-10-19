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
	GripVerticalIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { QuestionEditor, QuestionTypeBadge } from "./question-editor";
import {
	activeQuestionsAtom,
	addQuestionAtom,
	deleteQuestionAtom,
	expandedIdsAtom,
	quizAtom,
	reorderQuestionsAtom,
	toggleExpandAtom,
} from "./store";
import type { DraftQuestion } from "./types";
import { createEmptyQuestion } from "./types";

// ─── Sortable Question Card ────────────────────────────────────────────────

function SortableQuestionCard({
	question,
	index,
}: {
	question: DraftQuestion;
	index: number;
}) {
	const t = useTranslations("quizBuilder");
	const expandedIds = useAtomValue(expandedIdsAtom);
	const toggleExpand = useSetAtom(toggleExpandAtom);
	const deleteQuestion = useSetAtom(deleteQuestionAtom);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: question.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const isExpanded = expandedIds.has(question.id);
	const activeOptions = question.options.filter((o) => !o._deleted);
	const correctCount = activeOptions.filter((o) => o.is_correct).length;
	const hasUnansweredFlag =
		(question.question_type === "multiple_choice_single_correct" ||
			question.question_type === "true_false" ||
			question.question_type === "yes_no") &&
		correctCount === 0 &&
		activeOptions.length > 0;

	const pts = question.points ?? 0;
	const ptsLabel =
		pts === 1
			? t("question.pt", { count: pts })
			: t("question.pts", { count: pts });

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"rounded-xl border bg-card text-card-foreground ring-1 ring-foreground/10 overflow-hidden transition-shadow",
				isDragging && "shadow-lg ring-primary/20 z-50"
			)}
		>
			<div
				className={cn(
					"flex items-center gap-2 px-4 py-3 cursor-pointer select-none",
					isExpanded && "border-b"
				)}
				onClick={() => toggleExpand(question.id)}
				role="button"
				aria-expanded={isExpanded}
			>
				<button
					type="button"
					{...attributes}
					{...listeners}
					onClick={(e) => e.stopPropagation()}
					className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
				>
					<GripVerticalIcon className="size-4" />
				</button>

				<span className="shrink-0 w-6 text-center text-sm font-medium text-muted-foreground">
					{index + 1}.
				</span>

				<p className="flex-1 truncate text-sm font-medium min-w-0">
					{question.question_text || (
						<span className="italic text-muted-foreground">
							{t("question.untitled")}
						</span>
					)}
				</p>

				<div className="flex items-center gap-2 shrink-0">
					{hasUnansweredFlag && (
						<span className="rounded-4xl border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
							{t("question.noCorrectAnswer")}
						</span>
					)}
					<QuestionTypeBadge type={question.question_type} />
					{question.points != null && (
						<span className="text-xs text-muted-foreground whitespace-nowrap">
							{ptsLabel}
						</span>
					)}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							deleteQuestion(question.id);
						}}
						className="text-muted-foreground/40 hover:text-destructive transition-colors"
					>
						<Trash2Icon className="size-4" />
					</button>
					<ChevronDownIcon
						className={cn(
							"size-4 text-muted-foreground transition-transform",
							isExpanded && "rotate-180"
						)}
					/>
				</div>
			</div>

			{isExpanded && (
				<div className="px-4 py-4">
					<QuestionEditor question={question} index={index} />
				</div>
			)}
		</div>
	);
}

// ─── Question List ─────────────────────────────────────────────────────────

export function QuestionList() {
	const t = useTranslations("quizBuilder");
	const activeQuestions = useAtomValue(activeQuestionsAtom);
	const { id: quizId } = useAtomValue(quizAtom);
	const addQuestion = useSetAtom(addQuestionAtom);
	const reorderQuestions = useSetAtom(reorderQuestionsAtom);

	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	function handleAddQuestion() {
		addQuestion(createEmptyQuestion(quizId ?? null, activeQuestions.length));
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = activeQuestions.findIndex((q) => q.id === active.id);
			const newIndex = activeQuestions.findIndex((q) => q.id === over.id);
			reorderQuestions(
				arrayMove(activeQuestions, oldIndex, newIndex).map((q, i) => ({
					...q,
					order_index: i,
				}))
			);
		}
	}

	if (activeQuestions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
				<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
					<PlusIcon className="size-6 text-muted-foreground" />
				</div>
				<p className="text-sm font-medium">{t("question.emptyList.title")}</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{t("question.emptyList.description")}
				</p>
				<Button onClick={handleAddQuestion} className="mt-4 gap-1.5" size="sm">
					<PlusIcon className="size-4" />
					{t("actions.addQuestion")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis]}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={activeQuestions.map((q) => q.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-3">
						{activeQuestions.map((question, index) => (
							<SortableQuestionCard
								key={question.id}
								question={question}
								index={index}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>

			<Separator />
			<Button
				type="button"
				variant="outline"
				onClick={handleAddQuestion}
				className="w-full gap-1.5"
			>
				<PlusIcon className="size-4" />
				{t("actions.addQuestion")}
			</Button>
		</div>
	);
}
