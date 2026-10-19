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
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSetAtom } from "jotai";
import {
	CheckIcon,
	ChevronDownIcon,
	GripVerticalIcon,
	InfoIcon,
	LightbulbIcon,
	PlusIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	addOptionAtom,
	deleteOptionAtom,
	patchOptionAtom,
	patchQuestionAtom,
	reorderOptionsAtom,
} from "./store";
import {
	createDefaultOptionsForType,
	type DraftOption,
	type DraftQuestion,
	FIXED_OPTION_TYPES,
	QUESTION_TYPES_WITH_OPTIONS,
	type QuestionType,
} from "./types";

// ─── Sortable Option Row ────────────────────────────────────────────────────

function SortableOptionRow({
	option,
	questionId,
	questionType,
	isFixed,
}: {
	option: DraftOption;
	questionId: string;
	questionType: QuestionType;
	isFixed: boolean;
}) {
	const t = useTranslations("quizBuilder.question.option");
	const patchOption = useSetAtom(patchOptionAtom);
	const deleteOption = useSetAtom(deleteOptionAtom);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: option.id, disabled: isFixed });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const isCorrect = option.is_correct ?? false;

	function update(patch: Partial<DraftOption>) {
		patchOption({ questionId, optionId: option.id, patch });
	}

	function remove() {
		deleteOption({ questionId, optionId: option.id });
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group/option flex items-start gap-2 rounded-lg border p-2 bg-background transition-colors",
				isCorrect && "border-green-500/40 bg-green-500/5 dark:bg-green-500/10"
			)}
		>
			{!isFixed && (
				<button
					type="button"
					{...attributes}
					{...listeners}
					className="mt-1.5 shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
				>
					<GripVerticalIcon className="size-4" />
				</button>
			)}

			<div className="flex flex-1 flex-col gap-2 min-w-0">
				<div className="flex items-center gap-2">
					{questionType === "matching" ? (
						<div className="flex flex-1 items-center gap-2 min-w-0">
							<Input
								placeholder={t("leftPlaceholder")}
								value={option.option_text ?? ""}
								onChange={(e) => update({ option_text: e.target.value })}
								className="flex-1"
							/>
							<span className="shrink-0 text-muted-foreground text-xs">→</span>
							<Input
								placeholder={t("rightPlaceholder")}
								value={option.match_target_text ?? ""}
								onChange={(e) => update({ match_target_text: e.target.value })}
								className="flex-1"
							/>
						</div>
					) : questionType === "fill_in_the_blanks" ? (
						<Input
							placeholder={t("blankPlaceholder", {
								n: (option.order_index ?? 0) + 1,
							})}
							value={option.option_text ?? ""}
							onChange={(e) => update({ option_text: e.target.value })}
							className="flex-1"
						/>
					) : (
						<Input
							placeholder={t("placeholder")}
							value={option.option_text ?? ""}
							onChange={(e) => update({ option_text: e.target.value })}
							readOnly={isFixed}
							className={cn(
								"flex-1",
								isFixed && "bg-muted text-muted-foreground"
							)}
						/>
					)}

					{questionType !== "matching" &&
						questionType !== "fill_in_the_blanks" && (
							<button
								type="button"
								title={isCorrect ? t("incorrect") : t("correct")}
								onClick={() => update({ is_correct: !isCorrect })}
								className={cn(
									"shrink-0 flex items-center gap-1 rounded-md border px-2 h-8 text-xs font-medium transition-colors",
									isCorrect
										? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
										: "border-border text-muted-foreground hover:bg-muted"
								)}
							>
								{isCorrect ? (
									<CheckIcon className="size-3" />
								) : (
									<XIcon className="size-3" />
								)}
								{isCorrect ? t("correct") : t("incorrect")}
							</button>
						)}

					{!isFixed && (
						<button
							type="button"
							onClick={remove}
							className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
						>
							<Trash2Icon className="size-4" />
						</button>
					)}
				</div>

				{questionType !== "fill_in_the_blanks" &&
					questionType !== "matching" && (
						<Collapsible>
							<CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
								<LightbulbIcon className="size-3" />
								{option.feedback ? t("feedbackSet") : t("addFeedback")}
								<ChevronDownIcon className="size-3 transition-transform [[data-state=open]>&]:rotate-180" />
							</CollapsibleTrigger>
							<CollapsibleContent>
								<Input
									placeholder={t("feedbackPlaceholder")}
									value={option.feedback ?? ""}
									onChange={(e) => update({ feedback: e.target.value || null })}
									className="mt-1.5 text-xs"
								/>
							</CollapsibleContent>
						</Collapsible>
					)}
			</div>
		</div>
	);
}

// ─── Options Editor ────────────────────────────────────────────────────────

function OptionsEditor({ question }: { question: DraftQuestion }) {
	const t = useTranslations("quizBuilder");
	const addOption = useSetAtom(addOptionAtom);
	const reorderOptions = useSetAtom(reorderOptionsAtom);

	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const activeOptions = question.options.filter((o) => !o._deleted);
	const isFixed = FIXED_OPTION_TYPES.includes(question.question_type);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = activeOptions.findIndex((o) => o.id === active.id);
			const newIndex = activeOptions.findIndex((o) => o.id === over.id);
			const reordered = arrayMove(activeOptions, oldIndex, newIndex).map(
				(o, i) => ({
					...o,
					order_index: i,
				})
			);
			reorderOptions({ questionId: question.id, reordered });
		}
	}

	if (
		question.question_type === "short_answer_text" ||
		question.question_type === "long_answer_text"
	) {
		return (
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<InfoIcon className="size-3.5 shrink-0" />
				{t("question.hints.manualGrading")}
			</p>
		);
	}

	if (question.question_type === "fill_in_the_blanks") {
		return (
			<div className="space-y-2">
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<InfoIcon className="size-3.5 shrink-0" />
					{t("question.hints.fillBlanksPrefix")}{" "}
					<code className="rounded bg-muted px-1">{"{{blank}}"}</code>{" "}
					{t("question.hints.fillBlanksSuffix")}
				</p>
				<div className="space-y-2">
					{activeOptions.map((o) => (
						<SortableOptionRow
							key={o.id}
							option={o}
							questionId={question.id}
							questionType={question.question_type}
							isFixed={false}
						/>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => addOption(question.id)}
					className="gap-1.5"
				>
					<PlusIcon className="size-3.5" />
					{t("actions.addBlankAnswer")}
				</Button>
			</div>
		);
	}

	if (question.question_type === "ordering") {
		return (
			<div className="space-y-2">
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<InfoIcon className="size-3.5 shrink-0" />
					{t("question.hints.ordering")}
				</p>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={activeOptions.map((o) => o.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-2">
							{activeOptions.map((o, i) => (
								<div key={o.id} className="flex items-center gap-2">
									<span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
										{i + 1}.
									</span>
									<SortableOptionRow
										option={o}
										questionId={question.id}
										questionType={question.question_type}
										isFixed={false}
									/>
								</div>
							))}
						</div>
					</SortableContext>
				</DndContext>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => addOption(question.id)}
					className="gap-1.5"
				>
					<PlusIcon className="size-3.5" />
					{t("actions.addItem")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{question.question_type === "multiple_choice_multiple_correct" && (
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<InfoIcon className="size-3.5 shrink-0" />
					{t("question.hints.multipleCorrect")}
				</p>
			)}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={activeOptions.map((o) => o.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-2">
						{activeOptions.map((o) => (
							<SortableOptionRow
								key={o.id}
								option={o}
								questionId={question.id}
								questionType={question.question_type}
								isFixed={isFixed}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>

			{!isFixed && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => addOption(question.id)}
					className="gap-1.5"
				>
					<PlusIcon className="size-3.5" />
					{question.question_type === "matching"
						? t("actions.addPair")
						: t("actions.addOption")}
				</Button>
			)}
		</div>
	);
}

// ─── Question Editor ───────────────────────────────────────────────────────

export function QuestionEditor({
	question,
	index,
}: {
	question: DraftQuestion;
	index: number;
}) {
	const t = useTranslations("quizBuilder");
	const patchQuestion = useSetAtom(patchQuestionAtom);

	function patch(p: Partial<DraftQuestion>) {
		patchQuestion({ id: question.id, patch: p });
	}

	function handleTypeChange(newType: QuestionType) {
		patch({
			question_type: newType,
			options: createDefaultOptionsForType(newType),
		});
	}

	const hasOptions = QUESTION_TYPES_WITH_OPTIONS.includes(
		question.question_type
	);

	const sectionLabel =
		question.question_type === "matching"
			? t("question.sections.matchingPairs")
			: question.question_type === "ordering"
				? t("question.sections.ordering")
				: question.question_type === "fill_in_the_blanks"
					? t("question.sections.fillBlanks")
					: t("question.sections.default");

	return (
		<div className="space-y-4">
			{/* Question text */}
			<div className="space-y-1.5">
				<Label htmlFor={`q-text-${question.id}`}>
					{t("question.label", { n: index + 1 })}
					<span className="text-destructive"> *</span>
				</Label>
				{question.question_type === "fill_in_the_blanks" ? (
					<Textarea
						id={`q-text-${question.id}`}
						placeholder={t("question.fillBlanksPlaceholder", {
							marker: "{{blank}}",
						})}
						value={question.question_text}
						onChange={(e) => patch({ question_text: e.target.value })}
						rows={3}
					/>
				) : (
					<Textarea
						id={`q-text-${question.id}`}
						placeholder={t("question.placeholder")}
						value={question.question_text}
						onChange={(e) => patch({ question_text: e.target.value })}
						rows={2}
					/>
				)}
			</div>

			{/* Type + Points */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div className="col-span-2 space-y-1.5">
					<Label htmlFor={`q-type-${question.id}`}>
						{t("question.typeLabel")}
					</Label>
					<Select
						value={question.question_type}
						onValueChange={(v) => handleTypeChange(v as QuestionType)}
					>
						<SelectTrigger id={`q-type-${question.id}`} className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(Object.keys(t.raw("questionTypes")) as QuestionType[]).map(
								(type) => (
									<SelectItem key={type} value={type}>
										{t(`questionTypes.${type}`)}
									</SelectItem>
								)
							)}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor={`q-points-${question.id}`}>
						{t("question.points")}
					</Label>
					<Input
						id={`q-points-${question.id}`}
						type="number"
						min={0}
						step={0.5}
						value={question.points ?? 1}
						onChange={(e) => patch({ points: Number(e.target.value) })}
					/>
				</div>
			</div>

			{/* Options */}
			{hasOptions && (
				<>
					<Separator />
					<div className="space-y-2">
						<Label>{sectionLabel}</Label>
						<OptionsEditor question={question} />
					</div>
				</>
			)}

			{/* Hint & Explanation */}
			<Separator />
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor={`q-hint-${question.id}`}>
						<span className="flex items-center gap-1">
							<LightbulbIcon className="size-3.5" />
							{t("question.hint")}{" "}
							<span className="font-normal text-muted-foreground">
								{t("question.optional")}
							</span>
						</span>
					</Label>
					<Input
						id={`q-hint-${question.id}`}
						placeholder={t("question.hintPlaceholder")}
						value={question.hint ?? ""}
						onChange={(e) => patch({ hint: e.target.value || null })}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor={`q-explanation-${question.id}`}>
						<span className="flex items-center gap-1">
							<InfoIcon className="size-3.5" />
							{t("question.explanation")}{" "}
							<span className="font-normal text-muted-foreground">
								{t("question.optional")}
							</span>
						</span>
					</Label>
					<Input
						id={`q-explanation-${question.id}`}
						placeholder={t("question.explanationPlaceholder")}
						value={question.explanation ?? ""}
						onChange={(e) => patch({ explanation: e.target.value || null })}
					/>
				</div>
			</div>
		</div>
	);
}

// ─── Question Type Badge ─────────────────────────────────────────────────

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
	const t = useTranslations("quizBuilder");

	const colorMap: Partial<Record<QuestionType, string>> = {
		multiple_choice_single_correct:
			"bg-blue-500/10 text-blue-700 dark:text-blue-400",
		multiple_choice_multiple_correct:
			"bg-violet-500/10 text-violet-700 dark:text-violet-400",
		true_false: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
		yes_no: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
		short_answer_text: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
		long_answer_text: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
		fill_in_the_blanks: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
		matching: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
		ordering: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
		image_based_question: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
				colorMap[type] ?? "bg-secondary text-secondary-foreground"
			)}
		>
			{t(`questionTypes.${type}`)}
		</span>
	);
}
