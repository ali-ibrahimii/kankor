"use client";

import { CheckIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/hooks/use-form";
import { addFlashcardToDeck, updateFlashcard } from "./actions";
import type {
	DraftFlashcard,
	FlashcardAnswer,
	FlashcardFormValues,
} from "./types";

// ─── Answer reducer ───────────────────────────────────────────────────────────

type AnswerAction =
	| { type: "SET_TEXT"; index: number; text: string }
	| { type: "TOGGLE_CORRECT"; index: number }
	| { type: "ADD" }
	| { type: "REMOVE"; index: number }
	| { type: "RESET"; answers: FlashcardAnswer[] };

function answersReducer(
	state: FlashcardAnswer[],
	action: AnswerAction
): FlashcardAnswer[] {
	switch (action.type) {
		case "SET_TEXT":
			return state.map((a, i) =>
				i === action.index ? { ...a, answer: action.text } : a
			);
		case "TOGGLE_CORRECT":
			return state.map((a, i) =>
				i === action.index ? { ...a, isCorrect: !a.isCorrect } : a
			);
		case "ADD":
			return [...state, { answer: "", isCorrect: false }];
		case "REMOVE":
			return state.filter((_, i) => i !== action.index);
		case "RESET":
			return action.answers;
		default:
			return state;
	}
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FlashcardDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	deckId: string;
	/** Provide when editing an existing flashcard */
	flashcard?: DraftFlashcard;
	onSaved: (flashcard: DraftFlashcard) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FlashcardDialog({
	open,
	onOpenChange,
	deckId,
	flashcard,
	onSaved,
}: FlashcardDialogProps) {
	const t = useTranslations("flashcardBuilder");
	const isEditing = !!flashcard;

	// Answers state
	const [answers, dispatch] = React.useReducer(
		answersReducer,
		flashcard?.answers ?? [
			{ answer: "", isCorrect: true },
			{ answer: "", isCorrect: false },
		]
	);

	// Sync answers when the dialog is opened with a different flashcard
	React.useEffect(() => {
		if (open) {
			dispatch({
				type: "RESET",
				answers: flashcard?.answers ?? [
					{ answer: "", isCorrect: true },
					{ answer: "", isCorrect: false },
				],
			});
		}
	}, [open, flashcard]);

	const form = useAppForm({
		defaultValues: {
			question: flashcard?.question ?? "",
			fact: flashcard?.fact ?? "",
			hint: flashcard?.hint ?? "",
		} satisfies FlashcardFormValues,
		onSubmit: async ({ value }) => {
			// Validate answers
			const hasAtLeastOneCorrect = answers.some((a) => a.isCorrect);
			const allFilled = answers.every((a) => a.answer.trim().length > 0);

			if (!hasAtLeastOneCorrect) {
				toast.error(t("validation.oneCorrectRequired"));
				return;
			}
			if (!allFilled) {
				toast.error(t("validation.allAnswersFilled"));
				return;
			}

			const payload = {
				question: value.question.trim(),
				answers: answers.map((a) => ({
					answer: a.answer.trim(),
					isCorrect: a.isCorrect,
				})),
				fact: value.fact.trim() || null,
				hint: value.hint.trim() || null,
			};

			if (isEditing && flashcard) {
				const result = await updateFlashcard(flashcard.id, payload);
				if (!result.success) {
					toast.error(result.error);
					return;
				}
				onSaved({ ...flashcard, ...payload, ...result.data });
				toast.success(t("dialog.updatedSuccess"));
			} else {
				const result = await addFlashcardToDeck(deckId, payload);
				if (!result.success) {
					toast.error(result.error);
					return;
				}
				onSaved(result.data);
				toast.success(t("dialog.addedSuccess"));
			}

			onOpenChange(false);
		},
	});

	// Reset form when dialog closes
	React.useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	const canRemoveAnswer = answers.length > 2;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh] p-0">
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle>
						{isEditing ? t("dialog.editTitle") : t("dialog.addTitle")}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? t("dialog.editDescription")
							: t("dialog.addDescription")}
					</DialogDescription>
				</DialogHeader>

				<form.AppForm>
					<ScrollArea className="flex-1 px-6">
						<form
							id="flashcard-form"
							className="space-y-5 pb-4"
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							{/* Question */}
							<form.AppField
								name="question"
								validators={{
									onBlur: z.string().min(1, t("validation.questionRequired")),
								}}
							>
								{(field) => (
									<field.TextareaField
										label={t("dialog.questionLabel")}
										placeholder={t("dialog.questionPlaceholder")}
										rows={2}
										autoFocus
									/>
								)}
							</form.AppField>

							<Separator />

							{/* Answers */}
							<div className="space-y-3">
								<Label>{t("dialog.answersLabel")}</Label>
								<ul className="space-y-2" aria-label={t("dialog.answersLabel")}>
									{answers.map((answer, index) => (
										<li key={index} className="flex items-center gap-2">
											{/* Correct toggle */}
											<button
												type="button"
												aria-label={
													answer.isCorrect
														? t("dialog.markIncorrect")
														: t("dialog.markCorrect")
												}
												aria-pressed={answer.isCorrect}
												onClick={() =>
													dispatch({ type: "TOGGLE_CORRECT", index })
												}
												className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
													answer.isCorrect
														? "border-green-500 bg-green-500 text-white"
														: "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
												}`}
											>
												{answer.isCorrect ? (
													<CheckIcon className="size-3.5" />
												) : (
													<XIcon className="size-3.5" />
												)}
											</button>

											{/* Answer text */}
											<Input
												value={answer.answer}
												onChange={(e) =>
													dispatch({
														type: "SET_TEXT",
														index,
														text: e.target.value,
													})
												}
												placeholder={t("dialog.answerPlaceholder", {
													number: index + 1,
												})}
												aria-label={t("dialog.answerLabel", {
													number: index + 1,
												})}
												className="flex-1"
											/>

											{/* Remove button */}
											{canRemoveAnswer && (
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													aria-label={t("dialog.removeAnswer")}
													onClick={() => dispatch({ type: "REMOVE", index })}
													className="shrink-0 text-muted-foreground hover:text-destructive"
												>
													<Trash2Icon className="size-3.5" />
												</Button>
											)}
										</li>
									))}
								</ul>

								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-full"
									onClick={() => dispatch({ type: "ADD" })}
								>
									<PlusIcon className="size-4 me-1.5" />
									{t("dialog.addAnswer")}
								</Button>
							</div>

							<Separator />

							{/* Fact */}
							<form.AppField name="fact">
								{(field) => (
									<field.TextareaField
										label={t("dialog.factLabel")}
										description={t("dialog.factDescription")}
										placeholder={t("dialog.factPlaceholder")}
										rows={2}
									/>
								)}
							</form.AppField>

							{/* Hint */}
							<form.AppField name="hint">
								{(field) => (
									<field.TextField
										label={t("dialog.hintLabel")}
										description={t("dialog.hintDescription")}
										placeholder={t("dialog.hintPlaceholder")}
									/>
								)}
							</form.AppField>
						</form>
					</ScrollArea>

					<DialogFooter className="px-6 pb-6 pt-2 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<form.SubmitButton form="flashcard-form">
							{isEditing ? t("dialog.update") : t("dialog.add")}
						</form.SubmitButton>
					</DialogFooter>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}
