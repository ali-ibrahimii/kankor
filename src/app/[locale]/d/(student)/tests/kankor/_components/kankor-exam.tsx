"use client";

import {
	ArrowLeft,
	ArrowRight,
	Check,
	ChevronLeft,
	ChevronRight,
	Clock,
	Info,
	ListChecks,
	Play,
	ShieldCheck,
	Timer,
	X,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
	type ExamAnswers,
	type ExamResult,
	gradeExam,
	type KankorExam,
} from "../_data/kankor-exam";
import { AnswerSheet } from "./answer-sheet";
import { ExamResult as ExamResultView } from "./exam-result";
import { QuestionCard } from "./question-card";

const STORAGE_KEY = "kankor-mock-exam-v1";

type Phase = "intro" | "exam" | "result";

type StoredAttempt = {
	answers: ExamAnswers;
	flagged: string[];
	index: number;
	endsAt: number;
};

function readAttempt(questionCount: number): StoredAttempt | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredAttempt> & {
			questionCount?: number;
		};
		if (
			parsed.questionCount !== questionCount ||
			typeof parsed.endsAt !== "number" ||
			typeof parsed.index !== "number" ||
			!parsed.answers
		) {
			return null;
		}
		return {
			answers: parsed.answers,
			flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
			index: parsed.index,
			endsAt: parsed.endsAt,
		};
	} catch {
		return null;
	}
}

export function KankorExam({ exam }: { exam: KankorExam }) {
	const t = useTranslations("kankorExam");
	const tSubjects = useTranslations("kankorExam.subjects");
	const locale = useLocale();
	const isRtl = locale === "fa" || locale === "ps";
	const format = useFormatter();

	const [phase, setPhase] = React.useState<Phase>("intro");
	const [answers, setAnswers] = React.useState<ExamAnswers>({});
	const [flagged, setFlagged] = React.useState<string[]>([]);
	const [index, setIndex] = React.useState(0);
	const [endsAt, setEndsAt] = React.useState<number | null>(null);
	const [remaining, setRemaining] = React.useState(exam.minutes * 60_000);
	const [result, setResult] = React.useState<ExamResult | null>(null);
	const [timeUp, setTimeUp] = React.useState(false);
	const [resumable, setResumable] = React.useState<StoredAttempt | null>(null);
	const [confirmExit, setConfirmExit] = React.useState(false);
	const [confirmFinish, setConfirmFinish] = React.useState(false);
	const [sheetOpen, setSheetOpen] = React.useState(false);

	const activeQuestion = exam.questions[index];
	const answeredCount = Object.keys(answers).length;
	const unansweredCount = exam.questions.length - answeredCount;

	// ── Restore a previous attempt ────────────────────────────────────────────
	React.useEffect(() => {
		const stored = readAttempt(exam.questions.length);
		if (stored && stored.endsAt > Date.now()) setResumable(stored);
	}, [exam.questions.length]);

	// ── Countdown ─────────────────────────────────────────────────────────────
	React.useEffect(() => {
		if (phase !== "exam" || !endsAt) return;

		const tick = () => {
			const left = endsAt - Date.now();
			setRemaining(Math.max(0, left));
			if (left <= 0) finish(true);
		};

		tick();
		const id = window.setInterval(tick, 1000);
		return () => window.clearInterval(id);
		// `finish` is stable enough here; re-creating the interval on every answer
		// would reset the countdown.
		// biome-ignore lint/correctness/useExhaustiveDependencies: timer only depends on the deadline
	}, [phase, endsAt]);

	// ── Persist the attempt so a refresh does not lose it ─────────────────────
	React.useEffect(() => {
		if (phase !== "exam" || !endsAt) return;
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					answers,
					flagged,
					index,
					endsAt,
					questionCount: exam.questions.length,
				} satisfies StoredAttempt & { questionCount: number })
			);
		} catch {
			// Private mode: the exam still works, it just is not restored.
		}
	}, [phase, answers, flagged, index, endsAt, exam.questions.length]);

	const start = React.useCallback(
		(attempt?: StoredAttempt) => {
			setAnswers(attempt?.answers ?? {});
			setFlagged(attempt?.flagged ?? []);
			setIndex(attempt?.index ?? 0);
			setEndsAt(attempt?.endsAt ?? Date.now() + exam.minutes * 60_000);
			setRemaining(
				(attempt?.endsAt ?? Date.now() + exam.minutes * 60_000) - Date.now()
			);
			setResult(null);
			setTimeUp(false);
			setResumable(null);
			setPhase("exam");
		},
		[exam.minutes]
	);

	const finish = React.useCallback(
		(auto: boolean) => {
			setAnswers((current) => {
				setResult(gradeExam(exam, current));
				return current;
			});
			setTimeUp(auto);
			setPhase("result");
			setConfirmFinish(false);
			try {
				localStorage.removeItem(STORAGE_KEY);
			} catch {
				// ignore
			}
		},
		[exam]
	);

	const restart = React.useCallback(() => {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// ignore
		}
		setPhase("intro");
		setAnswers({});
		setFlagged([]);
		setIndex(0);
		setEndsAt(null);
		setResult(null);
		setTimeUp(false);
	}, []);

	const leaveExam = () => {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// ignore
		}
		setConfirmExit(false);
		setPhase("intro");
		setAnswers({});
		setFlagged([]);
		setIndex(0);
		setEndsAt(null);
	};

	const selectOption = (optionIndex: number) => {
		if (!activeQuestion) return;
		setAnswers((current) => ({ ...current, [activeQuestion.id]: optionIndex }));
	};

	const toggleFlag = () => {
		if (!activeQuestion) return;
		setFlagged((current) =>
			current.includes(activeQuestion.id)
				? current.filter((id) => id !== activeQuestion.id)
				: [...current, activeQuestion.id]
		);
	};

	const goTo = (nextIndex: number) => {
		setIndex(Math.min(exam.questions.length - 1, Math.max(0, nextIndex)));
	};

	// ── Keyboard shortcuts (1-4 pick, ←/→ move, F flag) ───────────────────────
	React.useEffect(() => {
		if (phase !== "exam") return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const target = event.target as HTMLElement | null;
			if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

			const digit = Number(event.key);
			if (digit >= 1 && digit <= 4) {
				event.preventDefault();
				selectOption(digit - 1);
				return;
			}

			if (event.key === "ArrowRight") {
				event.preventDefault();
				goTo(isRtl ? index - 1 : index + 1);
			} else if (event.key === "ArrowLeft") {
				event.preventDefault();
				goTo(isRtl ? index + 1 : index - 1);
			} else if (event.key.toLowerCase() === "f") {
				event.preventDefault();
				toggleFlag();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
		// biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the current index
	}, [phase, index, isRtl, activeQuestion?.id]);

	const totalMinutes = exam.minutes;
	const minutesLeft = Math.floor(remaining / 60_000);
	const secondsLeft = Math.floor((remaining % 60_000) / 1000);
	const isRunningLow = remaining <= 5 * 60_000;
	const countdown = `${String(minutesLeft).padStart(2, "0")}:${String(
		secondsLeft
	).padStart(2, "0")}`;

	const sheet = (
		<AnswerSheet
			exam={exam}
			answers={answers}
			flagged={flagged}
			currentQuestionId={activeQuestion?.id ?? ""}
			onJump={(questionId) => {
				const target = exam.questions.findIndex(
					(question) => question.id === questionId
				);
				if (target >= 0) setIndex(target);
			}}
			onClose={() => setSheetOpen(false)}
		/>
	);

	// ── Intro ─────────────────────────────────────────────────────────────────
	if (phase === "intro") {
		return (
			<div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6">
				<section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[#0f1a2c] bg-[radial-gradient(circle_at_8%_112%,rgba(94,207,173,.2),transparent_36%),radial-gradient(circle_at_92%_-10%,rgba(137,100,255,.34),transparent_42%),linear-gradient(125deg,#0f1a2c_4%,#16223a_58%,#20223f_100%)] px-5 py-8 text-white shadow-[0_28px_70px_-46px_rgba(14,19,49,.8)] sm:px-8 sm:py-10">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[11px] font-bold text-white/80">
						<ShieldCheck className="size-3.5 text-[#b7f486]" />
						{t("introBadge")}
					</span>

					<h1 className="mt-4 max-w-[560px] text-[1.6rem] font-black leading-[1.4] tracking-tight sm:text-[2rem]">
						{t("introHeading")}
					</h1>
					<p className="mt-3 max-w-[560px] text-[13px] leading-7 text-white/65 sm:text-sm">
						{t("introDescription")}
					</p>

					<div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/70">
						<span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5">
							<ListChecks className="size-3.5 text-[#b7f486]" />
							{format.number(exam.questions.length)} {t("questionsUnit")}
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5">
							<Timer className="size-3.5 text-[#b7f486]" />
							{format.number(totalMinutes)} {t("minutesUnit")}
						</span>
					</div>

					<div className="mt-7 flex flex-col gap-2 sm:flex-row">
						<Button
							onClick={() => start()}
							className="h-12 gap-2 rounded-2xl bg-[#b7f486] px-6 font-black text-[#17233a] hover:bg-[#c9f8a2]"
						>
							<Play className="size-4" />
							{t("startButton")}
						</Button>
						{resumable && (
							<Button
								onClick={() => start(resumable)}
								variant="outline"
								className="h-12 gap-2 rounded-2xl border-white/25 bg-white/[.06] px-6 font-bold text-white hover:bg-white/[.14] hover:text-white"
							>
								<Clock className="size-4" />
								{t("resumeButton")}
							</Button>
						)}
					</div>
				</section>

				{/* Rules */}
				<section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
					<h2 className="text-sm font-black">{t("rulesTitle")}</h2>
					<ul className="mt-3 space-y-2.5">
						{(t.raw("rules") as string[]).map((rule) => (
							<li
								key={rule}
								className="flex items-start gap-2 text-[12px] leading-6 text-muted-foreground"
							>
								<span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<Check className="size-2.5" strokeWidth={3.5} />
								</span>
								{rule}
							</li>
						))}
					</ul>

					<div className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/40 px-3 py-2.5 text-[11px] leading-6 text-muted-foreground">
						<Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
						{t("realExamNote")}
					</div>
				</section>

				{/* Subject blueprint */}
				<section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
					<h2 className="text-sm font-black">{t("perSubject")}</h2>
					<ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
						{exam.sections.map((section) => (
							<li
								key={section.id}
								className="rounded-2xl border border-border/70 bg-muted/25 px-3 py-2"
							>
								<p className="truncate text-[11px] font-bold">
									{tSubjects(section.id)}
								</p>
								<p className="mt-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
									{format.number(section.questions.length)}
								</p>
							</li>
						))}
					</ul>
				</section>
			</div>
		);
	}

	// ── Result ────────────────────────────────────────────────────────────────
	if (phase === "result" && result) {
		return (
			<div className="space-y-4">
				{timeUp && (
					<div className="mx-4 mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-800 sm:mx-6 dark:text-amber-200">
						<Clock className="mt-0.5 size-4 shrink-0" />
						<div>
							<p className="font-black">{t("timeUpTitle")}</p>
							<p className="mt-0.5 font-medium">{t("timeUpDescription")}</p>
						</div>
					</div>
				)}

				<ExamResultView
					exam={exam}
					answers={answers}
					result={result}
					onRetry={restart}
				/>
			</div>
		);
	}

	// ── Exam ──────────────────────────────────────────────────────────────────
	if (!activeQuestion) return null;

	const progressPercent = Math.round(
		(answeredCount / exam.questions.length) * 100
	);

	return (
		<div className="flex min-h-0 flex-col">
			{/* Sticky exam bar */}
			<div className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
				<div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2.5 sm:px-5">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setConfirmExit(true)}
						className="-ms-1 h-9 gap-1 rounded-xl px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
					>
						<X className="size-4" />
						<span className="hidden sm:inline">{t("exit")}</span>
					</Button>

					<div className="flex min-w-0 flex-1 items-center gap-2">
						<span className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
							<Progress value={progressPercent} className="h-1.5 max-w-40" />
							<span className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
								{t("answered", {
									answered: format.number(answeredCount),
									total: format.number(exam.questions.length),
								})}
							</span>
						</span>
					</div>

					<span
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black tabular-nums",
							isRunningLow
								? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
								: "bg-muted text-foreground"
						)}
						aria-label={t("timeLeft")}
					>
						<Clock className="size-3.5" />
						{countdown}
					</span>

					<Button
						size="sm"
						onClick={() => setSheetOpen(true)}
						className="h-9 gap-1.5 rounded-xl px-2.5 text-xs font-bold lg:hidden"
					>
						<ListChecks className="size-4" />
						<span className="tabular-nums">{answeredCount}</span>
					</Button>
				</div>
			</div>

			<div className="mx-auto flex w-full max-w-6xl gap-5 px-3 py-4 sm:px-5">
				{/* Question column */}
				<div className="min-w-0 flex-1">
					<div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
						<QuestionCard
							question={activeQuestion}
							index={index}
							total={exam.questions.length}
							selected={answers[activeQuestion.id]}
							flagged={flagged.includes(activeQuestion.id)}
							isRtl={isRtl}
							onSelect={selectOption}
							onToggleFlag={toggleFlag}
						/>
					</div>

					{/* Navigation */}
					<div className="mt-3 flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => goTo(index - 1)}
							disabled={index === 0}
							className="h-11 gap-1.5 rounded-2xl px-3"
						>
							{isRtl ? (
								<ChevronRight className="size-4" />
							) : (
								<ChevronLeft className="size-4" />
							)}
							<span className="hidden text-xs font-bold sm:inline">
								{t("previous")}
							</span>
						</Button>

						<div className="flex flex-1 justify-center">
							<Button
								onClick={() => setConfirmFinish(true)}
								className="h-11 gap-1.5 rounded-2xl px-4 text-xs font-black"
							>
								<ListChecks className="size-4" />
								{t("finish")}
								{unansweredCount > 0 && (
									<span className="rounded-md bg-black/15 px-1.5 py-0.5 text-[10px] tabular-nums">
										{format.number(unansweredCount)}
									</span>
								)}
							</Button>
						</div>

						<Button
							onClick={() => goTo(index + 1)}
							disabled={index === exam.questions.length - 1}
							className="h-11 gap-1.5 rounded-2xl px-3 text-xs font-bold"
						>
							<span className="hidden sm:inline">{t("next")}</span>
							{isRtl ? (
								<ArrowLeft className="size-4" />
							) : (
								<ArrowRight className="size-4" />
							)}
						</Button>
					</div>

					<p className="mt-2 px-1 text-[10px] text-muted-foreground">
						{t("savedProgress")}
					</p>
				</div>

				{/* Answer sheet (desktop) */}
				<aside className="sticky top-16 hidden h-[calc(100dvh-6rem)] w-72 shrink-0 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm lg:block xl:w-80">
					{sheet}
				</aside>
			</div>

			{/* Answer sheet (mobile) */}
			{sheetOpen && (
				<div className="fixed inset-0 z-40 lg:hidden">
					<button
						type="button"
						aria-label={t("cancel")}
						onClick={() => setSheetOpen(false)}
						className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
					/>
					<div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl">
						<div className="flex items-center justify-between px-4 pt-3">
							<p className="text-sm font-black">{t("answerSheet")}</p>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setSheetOpen(false)}
								className="rounded-xl"
							>
								<X className="size-4" />
							</Button>
						</div>
						<div className="min-h-0 flex-1">{sheet}</div>
					</div>
				</div>
			)}

			<ConfirmDialog
				open={confirmExit}
				onOpenChange={setConfirmExit}
				title={t("exitTitle")}
				description={t("exitDescription")}
				confirmText={t("exitConfirm")}
				cancelText={t("cancel")}
				variant="warning"
				onConfirm={leaveExam}
			/>

			<ConfirmDialog
				open={confirmFinish}
				onOpenChange={setConfirmFinish}
				title={t("finishTitle")}
				description={
					unansweredCount > 0
						? t("finishDescriptionWithBlank", {
								blank: format.number(unansweredCount),
							})
						: t("finishDescriptionComplete")
				}
				confirmText={t("finishConfirm")}
				cancelText={t("cancel")}
				variant="info"
				onConfirm={() => finish(false)}
			/>
		</div>
	);
}
