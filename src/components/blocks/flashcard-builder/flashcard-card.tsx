"use client";

import { CheckIcon, EditIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { deleteFlashcardFromDeck } from "./actions";
import type { DraftFlashcard } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FlashcardCardProps {
	flashcard: DraftFlashcard;
	onEdit: (flashcard: DraftFlashcard) => void;
	onDeleted: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FlashcardCard({
	flashcard,
	onEdit,
	onDeleted,
}: FlashcardCardProps) {
	const t = useTranslations("flashcardBuilder");
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);

	async function handleDelete() {
		setIsDeleting(true);
		try {
			const result = await deleteFlashcardFromDeck(flashcard.id);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			onDeleted(flashcard.id);
			toast.success(t("card.deleted"));
		} finally {
			setIsDeleting(false);
			setConfirmOpen(false);
		}
	}

	const correctAnswers = flashcard.answers.filter((a) => a.isCorrect);
	const wrongAnswers = flashcard.answers.filter((a) => !a.isCorrect);

	return (
		<>
			<Card
				size="sm"
				className="cursor-pointer select-none transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring"
				onDoubleClick={() => onEdit(flashcard)}
				tabIndex={0}
				role="article"
				aria-label={flashcard.question}
				onKeyDown={(e) => {
					if (e.key === "Enter") onEdit(flashcard);
				}}
			>
				{/* Question */}
				<CardHeader className="border-b pb-3">
					<CardTitle className="text-sm font-medium leading-snug">
						{flashcard.question}
					</CardTitle>
				</CardHeader>

				{/* Answers + metadata */}
				<CardContent className="space-y-2 pt-3">
					{/* Correct answers */}
					{correctAnswers.length > 0 && (
						<ul className="space-y-1">
							{correctAnswers.map((a, i) => (
								<li
									key={i}
									className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400"
								>
									<CheckIcon className="mt-0.5 size-3.5 shrink-0" />
									<span>{a.answer}</span>
								</li>
							))}
						</ul>
					)}

					{/* Wrong answers */}
					{wrongAnswers.length > 0 && (
						<ul className="space-y-1">
							{wrongAnswers.map((a, i) => (
								<li
									key={i}
									className="flex items-start gap-2 text-sm text-muted-foreground"
								>
									<XIcon className="mt-0.5 size-3.5 shrink-0" />
									<span>{a.answer}</span>
								</li>
							))}
						</ul>
					)}

					{/* Fact / hint */}
					{(flashcard.fact || flashcard.hint) && (
						<>
							<Separator className="my-2" />
							{flashcard.fact && (
								<p className="text-xs text-muted-foreground">
									<span className="font-medium text-foreground">
										{t("card.fact")}:{" "}
									</span>
									{flashcard.fact}
								</p>
							)}
							{flashcard.hint && (
								<p className="text-xs text-muted-foreground">
									<span className="font-medium text-foreground">
										{t("card.hint")}:{" "}
									</span>
									{flashcard.hint}
								</p>
							)}
						</>
					)}
				</CardContent>

				{/* Actions */}
				<CardFooter className="border-t pt-3 flex justify-between items-center">
					<Badge variant="secondary" className="text-xs">
						{flashcard.answers.length}{" "}
						{t("card.answers", { count: flashcard.answers.length })}
					</Badge>
					<div className="flex gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={t("common.edit")}
							onClick={(e) => {
								e.stopPropagation();
								onEdit(flashcard);
							}}
						>
							<EditIcon className="size-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={t("common.delete")}
							className="text-destructive hover:text-destructive"
							onClick={(e) => {
								e.stopPropagation();
								setConfirmOpen(true);
							}}
						>
							<Trash2Icon className="size-3.5" />
						</Button>
					</div>
				</CardFooter>
			</Card>

			{/* Delete confirmation */}
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("card.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("card.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
