"use client";

import {
	CheckCircle2,
	ChevronDown,
	CircleSlash,
	RotateCcw,
	Trophy,
	XCircle,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
	type ExamAnswers,
	type ExamResult,
	type KankorExam,
	scoreBand,
} from "../_data/kankor-exam";

const BAND_STYLES: Record<
	ReturnType<typeof scoreBand>,
	{ ring: string; chip: string; bar: string }
> = {
	excellent: {
		ring: "text-emerald-500",
		chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
		bar: "bg-emerald-500",
	},
	good: {
		ring: "text-sky-500",
		chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
		bar: "bg-sky-500",
	},
	average: {
		ring: "text-amber-500",
		chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
		bar: "bg-amber-500",
	},
	weak: {
		ring: "text-rose-500",
		chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
		bar: "bg-rose-500",
	},
};

function ScoreRing({ percent }: { percent: number }) {
	const format = useFormatter();
	const radius = 46;
	const circumference = 2 * Math.PI * radius;
	const offset =
		circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

	return (
		<div className="relative size-32 shrink-0">
			<svg viewBox="0 0 110 110" className="size-32 -rotate-90">
				<circle
					cx="55"
					cy="55"
					r={radius}
					fill="none"
					strokeWidth="9"
					className="stroke-muted"
				/>
				<circle
					cx="55"
					cy="55"
					r={radius}
					fill="none"
					strokeWidth="9"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className="stroke-primary transition-[stroke-dashoffset] duration-700"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-2xl font-black tabular-nums">
					{format.number(percent)}%
				</span>
			</div>
		</div>
	);
}

export function ExamResult({
	exam,
	answers,
	result,
	onRetry,
}: {
	exam: KankorExam;
	answers: ExamAnswers;
	result: ExamResult;
	onRetry: () => void;
}) {
	const t = useTranslations("kankorExam");
	const tTests = useTranslations("dashboard.student.testTypes");
	const tSubjects = useTranslations("kankorExam.subjects");
	const format = useFormatter();
	const [showReview, setShowReview] = React.useState(false);

	const band = scoreBand(result.percent);
	const styles = BAND_STYLES[band];
	const bandLabel = t(
		band === "excellent"
			? "bandExcellent"
			: band === "good"
				? "bandGood"
				: band === "average"
					? "bandAverage"
					: "bandWeak"
	);
	const num = (value: number) => format.number(value);

	return (
		<div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6">
			{/* Score summary */}
			<section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
				<div className="flex flex-col items-center gap-5 px-5 py-6 sm:flex-row sm:items-center sm:gap-7 sm:px-7">
					<ScoreRing percent={result.percent} />

					<div className="min-w-0 flex-1 text-center sm:text-start">
						<p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
							<Trophy className="size-3.5" />
							{t("resultTitle")}
						</p>
						<p className="mt-2 text-lg font-black leading-snug">{bandLabel}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{t("answered", {
								answered: num(result.answered),
								total: num(result.total),
							})}
						</p>

						<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
							<Stat
								icon={<CheckCircle2 className="size-3.5" />}
								label={t("correct")}
								value={num(result.correct)}
								tone="text-emerald-600 dark:text-emerald-400"
							/>
							<Stat
								icon={<XCircle className="size-3.5" />}
								label={t("wrong")}
								value={num(result.wrong)}
								tone="text-rose-600 dark:text-rose-400"
							/>
							<Stat
								icon={<CircleSlash className="size-3.5" />}
								label={t("blank")}
								value={num(result.blank)}
								tone="text-muted-foreground"
							/>
							<Stat
								icon={<Trophy className="size-3.5" />}
								label={t("score")}
								value={num(result.total)}
								tone="text-foreground"
							/>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap gap-2 border-t border-border/70 px-5 py-3 sm:px-7">
					<Button onClick={onRetry} className="rounded-xl">
						<RotateCcw className="size-4" />
						{t("retry")}
					</Button>
					<Button asChild variant="outline" className="rounded-xl">
						<Link href="/d/tests/passed">{tTests("passed")}</Link>
					</Button>
					<Button asChild variant="outline" className="rounded-xl">
						<Link href="/d/tests/registered">{tTests("registered")}</Link>
					</Button>
				</div>
			</section>

			{/* Per-subject breakdown */}
			<section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
				<h2 className="text-sm font-black">{t("perSubject")}</h2>
				<ul className="mt-3 space-y-3">
					{result.perSubject.map((subject) => (
						<li key={subject.id} className="flex items-center gap-3">
							<span className="w-20 shrink-0 truncate text-xs font-bold">
								{tSubjects(subject.id)}
							</span>
							<span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
								<span
									className={cn("block h-full rounded-full", styles.bar)}
									style={{ width: `${subject.percent}%` }}
								/>
							</span>
							<span className="w-24 shrink-0 text-end text-[11px] font-bold tabular-nums text-muted-foreground">
								{num(subject.correct)}/{num(subject.total)}
							</span>
						</li>
					))}
				</ul>
			</section>

			{/* Review */}
			<section className="rounded-3xl border border-border/70 bg-card shadow-sm">
				<button
					type="button"
					onClick={() => setShowReview((value) => !value)}
					aria-expanded={showReview}
					className="flex w-full items-center gap-2 px-4 py-3.5 text-start sm:px-5"
				>
					<h2 className="flex-1 text-sm font-black">{t("reviewTitle")}</h2>
					<span className="text-[11px] font-bold text-primary">
						{showReview ? t("hideReview") : t("showReview")}
					</span>
					<ChevronDown
						className={cn(
							"size-4 shrink-0 text-muted-foreground transition-transform",
							showReview && "rotate-180"
						)}
					/>
				</button>

				{showReview && (
					<ol className="space-y-3 border-t border-border/70 p-4 sm:p-5">
						{exam.questions.map((question, index) => {
							const picked = answers[question.id];
							const isCorrect = picked === question.correct;

							return (
								<li
									key={question.id}
									className={cn(
										"rounded-2xl border p-3.5",
										picked === undefined
											? "border-border bg-muted/30"
											: isCorrect
												? "border-emerald-500/30 bg-emerald-500/[.05]"
												: "border-rose-500/30 bg-rose-500/[.05]"
									)}
								>
									<div className="flex items-start gap-2">
										<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-card text-[10px] font-black tabular-nums ring-1 ring-border">
											{num(index + 1)}
										</span>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-bold leading-6">
												{question.stem}
											</p>

											<div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
												<span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-1 font-semibold ring-1 ring-border">
													{t("yourAnswer")}:
													<span
														className={cn(
															"font-black",
															picked === undefined
																? "text-muted-foreground"
																: isCorrect
																	? "text-emerald-600 dark:text-emerald-400"
																	: "text-rose-600 dark:text-rose-400"
														)}
													>
														{picked === undefined
															? t("noAnswer")
															: question.options[picked]}
													</span>
												</span>
												{!isCorrect && (
													<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
														{t("correctAnswer")}:
														<span className="font-black">
															{question.options[question.correct]}
														</span>
													</span>
												)}
											</div>

											{question.explanation && (
												<p className="mt-2 text-[11px] leading-6 text-muted-foreground">
													<span className="font-bold text-foreground">
														{t("explanation")}:{" "}
													</span>
													{question.explanation}
												</p>
											)}
										</div>
									</div>
								</li>
							);
						})}
					</ol>
				)}
			</section>
		</div>
	);
}

function Stat({
	icon,
	label,
	value,
	tone,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	tone: string;
}) {
	return (
		<div className="rounded-xl border border-border/70 bg-muted/20 px-2.5 py-2">
			<p className={cn("flex items-center gap-1 text-[10px] font-bold", tone)}>
				{icon}
				{label}
			</p>
			<p className="mt-0.5 text-sm font-black tabular-nums">{value}</p>
		</div>
	);
}
