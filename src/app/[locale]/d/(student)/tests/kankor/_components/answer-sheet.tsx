"use client";

import { Flag } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ExamAnswers, KankorExam } from "../_data/kankor-exam";

export function AnswerSheet({
	exam,
	answers,
	flagged,
	currentQuestionId,
	onJump,
	onClose,
	className,
}: {
	exam: KankorExam;
	answers: ExamAnswers;
	flagged: string[];
	currentQuestionId: string;
	onJump: (questionId: string) => void;
	onClose?: () => void;
	className?: string;
}) {
	const t = useTranslations("kankorExam");
	const tSubjects = useTranslations("kankorExam.subjects");
	const format = useFormatter();
	const n = (value: number) => format.number(value);

	const answeredCount = Object.keys(answers).length;

	return (
		<div className={cn("flex h-full flex-col", className)}>
			<div className="shrink-0 border-b border-border/70 px-4 py-3">
				<div className="flex items-center justify-between gap-2">
					<p className="text-sm font-black">{t("answerSheet")}</p>
					<p className="text-[11px] font-bold tabular-nums text-muted-foreground">
						{t("answered", {
							answered: n(answeredCount),
							total: n(exam.questions.length),
						})}
					</p>
				</div>
				<p className="mt-1 text-[11px] leading-5 text-muted-foreground">
					{t("answerSheetHint")}
				</p>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
				{exam.sections.map((section) => (
					<div key={section.id} className="mb-4 last:mb-0">
						<p className="mb-2 px-1 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
							{tSubjects(section.id)}
						</p>
						<div className="grid grid-cols-6 gap-1.5 sm:grid-cols-7 lg:grid-cols-6 xl:grid-cols-7">
							{section.questions.map((question) => {
								const globalIndex = exam.questions.findIndex(
									(item) => item.id === question.id
								);
								const isAnswered = answers[question.id] !== undefined;
								const isFlagged = flagged.includes(question.id);
								const isCurrent = question.id === currentQuestionId;

								return (
									<button
										key={question.id}
										type="button"
										onClick={() => {
											onJump(question.id);
											onClose?.();
										}}
										aria-current={isCurrent ? "true" : undefined}
										aria-label={`${tSubjects(section.id)} — ${t("questionOf", {
											current: n(globalIndex + 1),
											total: n(exam.questions.length),
										})}`}
										className={cn(
											"relative flex aspect-square items-center justify-center rounded-xl border text-[11px] font-black tabular-nums transition-colors",
											isAnswered
												? "border-primary/30 bg-primary/10 text-primary"
												: "border-border bg-card text-muted-foreground hover:bg-muted",
											isCurrent &&
												"border-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
										)}
									>
										{n(globalIndex + 1)}
										{isFlagged && (
											<Flag className="absolute -end-0.5 -top-0.5 size-2.5 fill-amber-500 text-amber-500" />
										)}
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			<div className="shrink-0 border-t border-border/70 px-4 py-2.5">
				<ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-semibold text-muted-foreground">
					<li className="inline-flex items-center gap-1.5">
						<span className="size-2.5 rounded-full bg-primary/60" />
						{t("legendAnswered")}
					</li>
					<li className="inline-flex items-center gap-1.5">
						<span className="size-2.5 rounded-full border border-border bg-card" />
						{t("legendBlank")}
					</li>
					<li className="inline-flex items-center gap-1.5">
						<Flag className="size-2.5 fill-amber-500 text-amber-500" />
						{t("legendFlagged")}
					</li>
				</ul>
			</div>
		</div>
	);
}
