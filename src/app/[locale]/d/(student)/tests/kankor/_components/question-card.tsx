"use client";

import { Check, Flag } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { ExamQuestion } from "../_data/kankor-exam";

const OPTION_KEYS = ["۱", "۲", "۳", "۴"] as const;
const OPTION_LATIN = ["A", "B", "C", "D"] as const;

export function QuestionCard({
	question,
	index,
	total,
	selected,
	flagged,
	isRtl,
	onSelect,
	onToggleFlag,
}: {
	question: ExamQuestion;
	index: number;
	total: number;
	selected?: number;
	flagged: boolean;
	isRtl: boolean;
	onSelect: (optionIndex: number) => void;
	onToggleFlag: () => void;
}) {
	const t = useTranslations("kankorExam");
	const tSubjects = useTranslations("kankorExam.subjects");
	const format = useFormatter();
	const n = (value: number) => format.number(value);
	const isPersianScript = isRtl;

	return (
		<article className="flex flex-col gap-5">
			{/* Meta row */}
			<div className="flex flex-wrap items-center gap-2">
				<span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
					{tSubjects(question.subject)}
				</span>
				<span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold tabular-nums text-muted-foreground">
					{t("questionOf", { current: n(index + 1), total: n(total) })}
				</span>

				<button
					type="button"
					onClick={onToggleFlag}
					aria-pressed={flagged}
					className={cn(
						"ms-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors",
						flagged
							? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
							: "border-border text-muted-foreground hover:bg-muted"
					)}
				>
					<Flag className={cn("size-3.5", flagged && "fill-current")} />
					{flagged ? t("flagged") : t("flag")}
				</button>
			</div>

			{/* Stem */}
			<h2 className="text-base font-black leading-8 tracking-tight sm:text-lg sm:leading-9">
				{question.stem}
			</h2>

			{/* Options */}
			<div
				role="radiogroup"
				aria-label={question.stem}
				className="grid gap-2.5 sm:grid-cols-2"
			>
				{question.options.map((option, optionIndex) => {
					const isSelected = selected === optionIndex;
					const key = isPersianScript
						? OPTION_KEYS[optionIndex]
						: OPTION_LATIN[optionIndex];

					return (
						<button
							key={`${question.id}-option-${optionIndex}`}
							type="button"
							role="radio"
							aria-checked={isSelected}
							onClick={() => onSelect(optionIndex)}
							className={cn(
								"group flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 py-3 text-start transition-all",
								"hover:border-primary/40 hover:bg-primary/[.04]",
								isSelected
									? "border-primary bg-primary/[.07] shadow-[0_10px_24px_-18px_rgba(107,77,215,.8)] ring-1 ring-primary/30"
									: "border-border/80 bg-card"
							)}
						>
							<span
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded-xl border text-[11px] font-black tabular-nums transition-colors",
									isSelected
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-muted/60 text-muted-foreground group-hover:text-foreground"
								)}
							>
								{isSelected ? <Check className="size-3.5" /> : key}
							</span>

							<span
								className={cn(
									"min-w-0 flex-1 text-sm leading-6",
									isSelected ? "font-bold" : "font-medium"
								)}
							>
								{option}
							</span>
						</button>
					);
				})}
			</div>
		</article>
	);
}
