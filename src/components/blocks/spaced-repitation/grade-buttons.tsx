"use client";

import { cva } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { GradePreviews, IntervalPreview, ReviewGrade } from "./types";
import { REVIEW_GRADES } from "./types";

const gradeButton = cva(
	"h-auto flex-1 flex-col gap-0.5 py-2 text-white transition-colors",
	{
		variants: {
			grade: {
				again: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-400",
				hard: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-400",
				good: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-400",
				easy: "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-400",
			},
		},
	}
);

const SHORTCUT_BY_GRADE: Record<ReviewGrade, string> = {
	again: "1",
	hard: "2",
	good: "3",
	easy: "4",
};

export interface GradeButtonsProps {
	previews: GradePreviews | null;
	disabled: boolean;
	onGrade: (grade: ReviewGrade) => void;
}

/** Quality buttons on the back of the card, with next-interval previews. */
export function GradeButtons({
	previews,
	disabled,
	onGrade,
}: GradeButtonsProps) {
	const t = useTranslations("spacedRepetition.grades");

	function formatPreview(preview: IntervalPreview): string {
		switch (preview.unit) {
			case "minutes":
				return t("intervalMinutes", { count: preview.value });
			case "days":
				return t("intervalDays", { count: preview.value });
			case "months":
				return t("intervalMonths", { count: preview.value });
		}
	}

	return (
		<div className="mx-auto w-full max-w-2xl">
			<p className="mb-2 text-center text-sm text-muted-foreground">
				{t("prompt")}
			</p>
			<div className="flex gap-2" role="group" aria-label={t("prompt")}>
				{REVIEW_GRADES.map((grade) => (
					<Button
						key={grade}
						disabled={disabled}
						onClick={() => onGrade(grade)}
						className={gradeButton({ grade })}
					>
						<span className="flex items-center gap-1.5 text-sm font-semibold">
							{t(grade)}
							<Kbd className="hidden bg-white/20 text-white sm:inline-flex">
								{SHORTCUT_BY_GRADE[grade]}
							</Kbd>
						</span>
						{previews && (
							<span className="text-xs font-normal opacity-90">
								{formatPreview(previews[grade])}
							</span>
						)}
					</Button>
				))}
			</div>
		</div>
	);
}
