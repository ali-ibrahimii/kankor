"use client";

import { cva } from "class-variance-authority";
import { CheckIcon, LightbulbIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CardStatus, ReviewGrade, SessionFlashcard } from "./types";

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusBadge = cva("text-xs", {
	variants: {
		status: {
			new: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
			learning:
				"bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
			relearning:
				"bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
			review:
				"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
		},
	},
});

function StatusBadge({ status }: { status: CardStatus }) {
	const t = useTranslations("spacedRepetition.card.status");
	return <Badge className={statusBadge({ status })}>{t(status)}</Badge>;
}

// ─── Extra-content accordion (hint / fact) ────────────────────────────────────

interface CardAccordionProps {
	id: string;
	icon: React.ReactNode;
	label: string;
	content: string;
}

/** Collapsible hint/fact section; interactions stay inside (no card flip). */
function CardAccordion({ id, icon, label, content }: CardAccordionProps) {
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: only fences bubbling clicks off the flip surface; the trigger inside is a real button
		<div
			onClick={(event) => event.stopPropagation()}
			className="rounded-lg bg-muted/60 px-3"
		>
			<Accordion type="single" collapsible>
				<AccordionItem value={id} className="border-none">
					<AccordionTrigger className="py-3 text-xs font-medium text-muted-foreground hover:no-underline">
						<span className="flex items-center gap-1.5">
							{icon}
							{label}
						</span>
					</AccordionTrigger>
					<AccordionContent className="pb-3 text-sm leading-relaxed">
						{content}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

// ─── Card faces ───────────────────────────────────────────────────────────────

const FACE_CLASSES =
	"absolute inset-0 flex flex-col overflow-y-auto rounded-xl border bg-card p-6 shadow-sm [backface-visibility:hidden]";

interface FrontFaceProps {
	flashcard: SessionFlashcard;
	status: CardStatus;
}

function FrontFace({ flashcard, status }: FrontFaceProps) {
	const t = useTranslations("spacedRepetition.card");

	return (
		<div className={FACE_CLASSES}>
			<div className="flex items-center justify-between">
				<StatusBadge status={status} />
				<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{t("question")}
				</span>
			</div>

			<div className="flex flex-1 items-center justify-center py-6">
				<p className="text-balance text-center text-lg font-semibold leading-relaxed sm:text-xl">
					{flashcard.question}
				</p>
			</div>

			<div className="flex flex-col gap-2">
				{flashcard.hint && (
					<CardAccordion
						id="hint"
						icon={<LightbulbIcon className="size-3.5" aria-hidden />}
						label={t("hint")}
						content={flashcard.hint}
					/>
				)}
				<p className="text-center text-xs text-muted-foreground/70">
					{t("tapToReveal")}
				</p>
			</div>
		</div>
	);
}

interface BackFaceProps {
	flashcard: SessionFlashcard;
	gradedAs: ReviewGrade | null;
}

function BackFace({ flashcard, gradedAs }: BackFaceProps) {
	const t = useTranslations("spacedRepetition");
	const correctAnswers = flashcard.answers.filter((a) => a.isCorrect);

	return (
		<div className={cn(FACE_CLASSES, "[transform:rotateY(180deg)]")}>
			<div className="flex items-center justify-between">
				{gradedAs ? (
					<Badge variant="secondary" className="text-xs">
						{t("grades.gradedAs", { grade: t(`grades.${gradedAs}`) })}
					</Badge>
				) : (
					<span />
				)}
				<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{t("card.answer")}
				</span>
			</div>

			<div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
				{correctAnswers.map((answer) => (
					<p
						key={answer.answer}
						className="flex items-start gap-2 text-balance text-center text-lg font-semibold leading-relaxed text-emerald-700 dark:text-emerald-300 sm:text-xl"
					>
						<CheckIcon className="mt-1 size-4 shrink-0" aria-hidden />
						{answer.answer}
					</p>
				))}
			</div>

			{flashcard.fact && (
				<CardAccordion
					id="fact"
					icon={<SparklesIcon className="size-3.5" aria-hidden />}
					label={t("card.fact")}
					content={flashcard.fact}
				/>
			)}
		</div>
	);
}

// ─── Flip card ────────────────────────────────────────────────────────────────

export interface FlipCardProps {
	flashcard: SessionFlashcard;
	status: CardStatus;
	isFlipped: boolean;
	onFlip: () => void;
	gradedAs: ReviewGrade | null;
}

/**
 * 3D flipping flashcard: question on the front, answer on the back.
 * Flipping is available via click and the global Space/Enter shortcut
 * (see useKeyboardShortcuts), so no local key handler is attached.
 */
export function FlipCard({
	flashcard,
	status,
	isFlipped,
	onFlip,
	gradedAs,
}: FlipCardProps) {
	const t = useTranslations("spacedRepetition.card");

	return (
		<div className="mx-auto w-full max-w-2xl [perspective:1200px]">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Space/Enter handled by the session-wide keyboard shortcuts */}
			<div
				role="button"
				tabIndex={0}
				aria-label={t("flipLabel")}
				aria-pressed={isFlipped}
				onClick={onFlip}
				className={cn(
					"relative min-h-80 w-full cursor-pointer outline-none transition-transform duration-500 [transform-style:preserve-3d]",
					"focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					"motion-reduce:transition-none",
					isFlipped && "[transform:rotateY(180deg)]"
				)}
			>
				<FrontFace flashcard={flashcard} status={status} />
				<BackFace flashcard={flashcard} gradedAs={gradedAs} />
			</div>
		</div>
	);
}
