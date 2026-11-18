"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircleIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	ClockIcon,
	HelpCircleIcon,
	LightbulbIcon,
	ListChecksIcon,
	Loader2Icon,
	PlayIcon,
	RotateCcwIcon,
	SendIcon,
	TargetIcon,
	TrophyIcon,
	XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type QuestionType = Database["public"]["Enums"]["question_type"];
type ShowCorrectAnswers = Database["public"]["Enums"]["show_correct_answers"];

// ─── RPC payload types ────────────────────────────────────────────────────────

export interface LessonQuizOption {
	id: string;
	option_text: string | null;
	order_index: number;
}

export interface LessonQuizQuestion {
	id: string;
	question_text: string;
	question_type: QuestionType;
	order_index: number;
	points: number;
	hint: string | null;
	image_url: string | null;
	allow_multiple: boolean;
	blank_count: number;
	options: LessonQuizOption[];
	match_targets: string[];
}

export interface LessonQuizAttemptSummary {
	id: string;
	attempt_number: number;
	score: number | null;
	max_score_possible: number | null;
	passed: boolean | null;
	started_at: string | null;
	completed_at: string | null;
	awaiting_manual_grade: boolean;
}

export interface LessonQuizActiveAttempt {
	id: string;
	attempt_number: number;
	started_at: string;
	expires_at: string | null;
	max_score_possible: number;
	questions: LessonQuizQuestion[];
}

export interface LessonQuizState {
	quiz: {
		id: string;
		title: string;
		description: string | null;
		instructions: string | null;
		time_limit_minutes: number | null;
		max_attempts: number | null;
		passing_score_percentage: number | null;
		shuffle_questions: boolean;
		show_correct_answers_after: ShowCorrectAnswers | null;
		question_count: number;
		total_points: number;
	};
	has_passed: boolean;
	attempts_used: number;
	remaining_attempts: number | null;
	can_start: boolean;
	attempts: LessonQuizAttemptSummary[];
	active_attempt: LessonQuizActiveAttempt | null;
}

interface ReviewOption {
	id: string;
	option_text: string | null;
	is_correct: boolean;
	feedback: string | null;
	match_target_text: string | null;
	order_index: number;
}

interface ReviewItem {
	question_id: string;
	question_text: string;
	question_type: QuestionType;
	points: number;
	points_awarded: number;
	is_correct: boolean | null;
	explanation: string | null;
	feedback: string | null;
	selected_option_ids: string[];
	answer_text: string | null;
	structured_answer: Record<string, unknown> | null;
	options: ReviewOption[];
}

export interface SubmitLessonQuizResult {
	attempt: {
		id: string;
		attempt_number: number;
		score: number;
		max_score_possible: number;
		score_percentage: number;
		passing_score_percentage: number | null;
		passed: boolean | null;
		awaiting_manual_grade: boolean;
		completed_at: string;
	};
	lesson_completed: boolean;
	show_answers: boolean;
	review: ReviewItem[] | null;
	state: LessonQuizState;
}

// ─── Local draft answer model ─────────────────────────────────────────────────

interface QuestionDraftAnswer {
	selectedOptionIds?: string[];
	answerText?: string;
	blanks?: string[];
	pairs?: Record<string, string>;
	orderedOptionIds?: string[];
}

function formatCountdown(totalSeconds: number): string {
	const clamped = Math.max(0, Math.floor(totalSeconds));
	const hrs = Math.floor(clamped / 3600);
	const mins = Math.floor((clamped % 3600) / 60);
	const secs = clamped % 60;
	const pad = (n: number) => String(n).padStart(2, "0");
	return hrs > 0
		? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
		: `${pad(mins)}:${pad(secs)}`;
}

function formatPromptWithBlanks(text: string): string {
	let idx = 0;
	return text.replace(/\{\{\s*blank\s*\}\}/gi, () => {
		idx += 1;
		return `[${idx}]`;
	});
}

function isQuestionAnswered(
	q: LessonQuizQuestion,
	ans: QuestionDraftAnswer | undefined
): boolean {
	if (!ans) return false;
	switch (q.question_type) {
		case "multiple_choice_single_correct":
		case "multiple_choice_multiple_correct":
		case "true_false":
		case "yes_no":
			return (ans.selectedOptionIds?.length ?? 0) > 0;
		case "image_based_question":
			return q.options.length > 0
				? (ans.selectedOptionIds?.length ?? 0) > 0
				: Boolean(ans.answerText?.trim());
		case "fill_in_the_blanks":
			return (
				(ans.blanks?.length ?? 0) >= Math.max(1, q.blank_count) &&
				(ans.blanks ?? []).every((b) => b.trim().length > 0)
			);
		case "matching":
			return (
				q.options.length > 0 &&
				q.options.every((opt) => Boolean(ans.pairs?.[opt.id]?.trim()))
			);
		case "ordering":
			return (ans.orderedOptionIds?.length ?? 0) === q.options.length;
		case "short_answer_text":
		case "long_answer_text":
			return Boolean(ans.answerText?.trim());
		default:
			return false;
	}
}

function serializeAnswers(
	questions: LessonQuizQuestion[],
	drafts: Record<string, QuestionDraftAnswer>
): Json {
	return questions.map((q) => {
		const d = drafts[q.id];
		if (!d) return { question_id: q.id };

		if (q.question_type === "fill_in_the_blanks") {
			const blanks = Array.from(
				{ length: Math.max(1, q.blank_count) },
				(_, i) => d.blanks?.[i] ?? ""
			);
			return {
				question_id: q.id,
				structured_answer: { blanks },
			};
		}

		if (q.question_type === "matching") {
			return {
				question_id: q.id,
				structured_answer: { pairs: d.pairs ?? {} },
			};
		}

		if (q.question_type === "ordering") {
			const ordered =
				d.orderedOptionIds && d.orderedOptionIds.length === q.options.length
					? d.orderedOptionIds
					: q.options.map((o) => o.id);
			return {
				question_id: q.id,
				structured_answer: { ordered_option_ids: ordered },
			};
		}

		if (
			q.question_type === "short_answer_text" ||
			q.question_type === "long_answer_text" ||
			(q.question_type === "image_based_question" && q.options.length === 0)
		) {
			return {
				question_id: q.id,
				answer_text: d.answerText ?? "",
			};
		}

		return {
			question_id: q.id,
			selected_option_ids: d.selectedOptionIds ?? [],
		};
	}) as unknown as Json;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface LessonQuizPlayerProps {
	lessonId: string;
	quizId: string | null | undefined;
	note?: string | null;
	onQuizPassed?: () => void;
}

export function LessonQuizPlayer({
	lessonId,
	quizId,
	note,
	onQuizPassed,
}: LessonQuizPlayerProps) {
	const t = useTranslations("courses.learn.quiz");
	const queryClient = useQueryClient();

	const [answers, setAnswers] = React.useState<
		Record<string, QuestionDraftAnswer>
	>({});
	const [revealedHints, setRevealedHints] = React.useState<Set<string>>(
		() => new Set()
	);
	const [lastResult, setLastResult] =
		React.useState<SubmitLessonQuizResult | null>(null);
	const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
	const [confirmIncomplete, setConfirmIncomplete] = React.useState(false);
	const autoSubmittedAttemptRef = React.useRef<string | null>(null);

	const queryKey = React.useMemo(
		() => ["lesson-quiz-state", lessonId, quizId ?? "none"] as const,
		[lessonId, quizId]
	);

	// Reset local state when navigating between lessons or quizzes
	React.useEffect(() => {
		setAnswers({});
		setRevealedHints(new Set());
		setLastResult(null);
		setSecondsLeft(null);
		setConfirmIncomplete(false);
	}, [lessonId, quizId]);

	const stateQuery = useQuery({
		queryKey,
		enabled: Boolean(lessonId && quizId),
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase.rpc("get_lesson_quiz_state", {
				p_lesson_id: lessonId,
				p_quiz_id: quizId ?? "",
			});
			if (error) throw new Error(error.message);
			return data as unknown as LessonQuizState;
		},
	});

	const activeAttempt = stateQuery.data?.active_attempt ?? null;

	// Seed ordering defaults when an active attempt opens
	React.useEffect(() => {
		if (!activeAttempt) return;
		setAnswers((prev) => {
			const next = { ...prev };
			let changed = false;
			for (const q of activeAttempt.questions) {
				if (q.question_type === "ordering" && !next[q.id]?.orderedOptionIds) {
					next[q.id] = { orderedOptionIds: q.options.map((o) => o.id) };
					changed = true;
				}
			}
			return changed ? next : prev;
		});
	}, [activeAttempt]);

	const startMutation = useMutation({
		mutationFn: async () => {
			if (!quizId) throw new Error("Missing quiz");
			const supabase = createClient();
			const { data, error } = await supabase.rpc("start_lesson_quiz_attempt", {
				p_lesson_id: lessonId,
				p_quiz_id: quizId,
			});
			if (error) throw new Error(error.message);
			return data as unknown as LessonQuizState;
		},
		onSuccess: (nextState) => {
			setAnswers({});
			setRevealedHints(new Set());
			setLastResult(null);
			setConfirmIncomplete(false);
			queryClient.setQueryData(queryKey, nextState);
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message : "";
			if (msg.includes("max_attempts_reached")) {
				toast.error(t("noAttemptsLeft"));
			} else if (msg.includes("quiz_has_no_questions")) {
				toast.error(t("noQuestions"));
			} else if (msg.includes("chapter_locked")) {
				toast.error(t("chapterLockedError"));
			} else {
				toast.error(t("startError"));
			}
		},
	});

	const submitMutation = useMutation({
		mutationFn: async (attempt: LessonQuizActiveAttempt) => {
			const supabase = createClient();
			const payload = serializeAnswers(attempt.questions, answers);
			const { data, error } = await supabase.rpc("submit_lesson_quiz_attempt", {
				p_attempt_id: attempt.id,
				p_lesson_id: lessonId,
				p_answers: payload,
			});
			if (error) throw new Error(error.message);
			return data as unknown as SubmitLessonQuizResult;
		},
		onSuccess: (result) => {
			setLastResult(result);
			setAnswers({});
			setSecondsLeft(null);
			setConfirmIncomplete(false);
			queryClient.setQueryData(queryKey, result.state);

			if (result.attempt.passed === true) {
				toast.success(t("passedToast"));
				onQuizPassed?.();
			} else if (result.attempt.awaiting_manual_grade) {
				toast.info(t("awaitingGradeToast"));
			} else {
				toast.error(t("failedToast"));
			}
		},
		onError: () => {
			toast.error(t("submitError"));
		},
	});

	// Countdown timer for timed exams (auto-submits when time runs out)
	React.useEffect(() => {
		if (!activeAttempt?.expires_at) {
			setSecondsLeft(null);
			return;
		}
		const expiresMs = new Date(activeAttempt.expires_at).getTime();
		if (Number.isNaN(expiresMs)) {
			setSecondsLeft(null);
			return;
		}

		const tick = () => {
			const diff = Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000));
			setSecondsLeft(diff);
			if (
				diff <= 0 &&
				autoSubmittedAttemptRef.current !== activeAttempt.id &&
				!submitMutation.isPending
			) {
				autoSubmittedAttemptRef.current = activeAttempt.id;
				submitMutation.mutate(activeAttempt);
			}
		};

		tick();
		const id = window.setInterval(tick, 1000);
		return () => window.clearInterval(id);
	}, [activeAttempt, submitMutation]);

	if (!quizId) {
		return (
			<div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
				<HelpCircleIcon className="size-5 shrink-0" />
				<span>{t("notConfigured")}</span>
			</div>
		);
	}

	if (stateQuery.isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center gap-2.5 py-10 text-sm text-muted-foreground">
					<Loader2Icon className="size-4 animate-spin" />
					<span>{t("loading")}</span>
				</CardContent>
			</Card>
		);
	}

	if (stateQuery.isError || !stateQuery.data) {
		const errMsg =
			stateQuery.error instanceof Error ? stateQuery.error.message : "";
		return (
			<Card className="border-destructive/30">
				<CardContent className="flex flex-wrap items-center justify-between gap-3 py-6 text-sm">
					<span className="flex items-center gap-2 text-destructive">
						<AlertCircleIcon className="size-4 shrink-0" />
						{errMsg.includes("chapter_locked")
							? t("chapterLockedError")
							: t("loadError")}
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void stateQuery.refetch()}
					>
						{t("retryLoad")}
					</Button>
				</CardContent>
			</Card>
		);
	}

	const { quiz, has_passed, attempts_used, remaining_attempts, can_start } =
		stateQuery.data;
	const attempts = stateQuery.data.attempts ?? [];

	function updateAnswer(
		questionId: string,
		updater: (prev: QuestionDraftAnswer) => QuestionDraftAnswer
	) {
		setConfirmIncomplete(false);
		setAnswers((prev) => ({
			...prev,
			[questionId]: updater(prev[questionId] ?? {}),
		}));
	}

	function toggleHint(questionId: string) {
		setRevealedHints((prev) => {
			const next = new Set(prev);
			if (next.has(questionId)) next.delete(questionId);
			else next.add(questionId);
			return next;
		});
	}

	function handleSubmitClick(attempt: LessonQuizActiveAttempt) {
		const unanswered = attempt.questions.filter(
			(q) => !isQuestionAnswered(q, answers[q.id])
		).length;

		if (unanswered > 0 && !confirmIncomplete) {
			setConfirmIncomplete(true);
			return;
		}
		submitMutation.mutate(attempt);
	}

	// ── Active attempt UI ─────────────────────────────────────────────────────
	if (activeAttempt) {
		const totalQuestions = activeAttempt.questions.length;
		const answeredCount = activeAttempt.questions.filter((q) =>
			isQuestionAnswered(q, answers[q.id])
		).length;
		const unansweredCount = totalQuestions - answeredCount;
		const pct =
			totalQuestions > 0
				? Math.round((answeredCount / totalQuestions) * 100)
				: 0;

		return (
			<div className="space-y-4">
				{note && (
					<p className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
						{note}
					</p>
				)}

				<Card className="overflow-hidden border-primary/30">
					{/* Sticky attempt status header */}
					<div className="sticky top-0 z-10 border-b bg-background/95 px-5 py-3.5 backdrop-blur">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="min-w-0 space-y-0.5">
								<h3 className="font-semibold text-base leading-tight">
									{quiz.title}
								</h3>
								<p className="text-xs text-muted-foreground">
									{t("attemptProgress", {
										attempt: activeAttempt.attempt_number,
										answered: answeredCount,
										total: totalQuestions,
									})}
								</p>
							</div>

							{secondsLeft !== null && (
								<div
									aria-live="polite"
									className={cn(
										"inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
										secondsLeft <= 30
											? "animate-pulse border-destructive/50 bg-destructive/10 text-destructive"
											: secondsLeft <= 120
												? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
												: "bg-muted/50 text-foreground"
									)}
								>
									<ClockIcon className="size-4" />
									{formatCountdown(secondsLeft)}
								</div>
							)}
						</div>
						<Progress value={pct} className="mt-2.5 h-1.5" />
					</div>

					<CardContent className="space-y-6 pt-6">
						{quiz.instructions && (
							<div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground whitespace-pre-line">
								{quiz.instructions}
							</div>
						)}

						{/* Questions list */}
						<ol className="space-y-6">
							{activeAttempt.questions.map((q, idx) => {
								const draft = answers[q.id];
								const isMulti = q.allow_multiple;
								const orderedIds =
									draft?.orderedOptionIds &&
									draft.orderedOptionIds.length === q.options.length
										? draft.orderedOptionIds
										: q.options.map((o) => o.id);

								return (
									<li
										key={q.id}
										className="rounded-lg border bg-card p-4 sm:p-5 space-y-4"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<span className="text-xs font-medium text-muted-foreground">
													{t("questionLabel", { number: idx + 1 })}
												</span>
												<p className="text-sm sm:text-base font-medium leading-relaxed whitespace-pre-line">
													{q.question_type === "fill_in_the_blanks"
														? formatPromptWithBlanks(q.question_text)
														: q.question_text}
												</p>
												{isMulti && (
													<p className="text-xs text-muted-foreground">
														{t("selectAllThatApply")}
													</p>
												)}
											</div>
											<Badge variant="outline" className="shrink-0 text-xs">
												{t("pointsLabel", { points: q.points })}
											</Badge>
										</div>

										{q.image_url && (
											// biome-ignore lint/performance/noImgElement: dynamic user-uploaded quiz image URL
											<img
												src={q.image_url}
												alt={t("questionLabel", { number: idx + 1 })}
												className="max-h-72 rounded-md border object-contain"
											/>
										)}

										{/* Single / Multiple choice, True-False, Yes-No, Image with options */}
										{(q.question_type === "multiple_choice_single_correct" ||
											q.question_type === "multiple_choice_multiple_correct" ||
											q.question_type === "true_false" ||
											q.question_type === "yes_no" ||
											(q.question_type === "image_based_question" &&
												q.options.length > 0)) && (
											<div className="space-y-2">
												{q.options.map((opt) => {
													const selected =
														draft?.selectedOptionIds?.includes(opt.id) ?? false;
													return (
														<button
															key={opt.id}
															type="button"
															aria-pressed={selected}
															onClick={() =>
																updateAnswer(q.id, (prev) => {
																	if (!isMulti) {
																		return {
																			...prev,
																			selectedOptionIds: [opt.id],
																		};
																	}
																	const cur = prev.selectedOptionIds ?? [];
																	const next = cur.includes(opt.id)
																		? cur.filter((id) => id !== opt.id)
																		: [...cur, opt.id];
																	return { ...prev, selectedOptionIds: next };
																})
															}
															className={cn(
																"flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-start text-sm transition-colors",
																selected
																	? "border-primary bg-primary/10 font-medium text-foreground ring-1 ring-primary/30"
																	: "border-border hover:bg-muted/50"
															)}
														>
															<span
																className={cn(
																	"flex size-4 shrink-0 items-center justify-center border transition-colors",
																	isMulti ? "rounded" : "rounded-full",
																	selected
																		? "border-primary bg-primary text-primary-foreground"
																		: "border-muted-foreground/50"
																)}
															>
																{selected && (
																	<span
																		className={cn(
																			"bg-primary-foreground",
																			isMulti
																				? "size-2 rounded-[2px]"
																				: "size-1.5 rounded-full"
																		)}
																	/>
																)}
															</span>
															<span className="flex-1">{opt.option_text}</span>
														</button>
													);
												})}
											</div>
										)}

										{/* Fill in the blanks */}
										{q.question_type === "fill_in_the_blanks" && (
											<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
												{Array.from(
													{ length: Math.max(1, q.blank_count) },
													(_, bIdx) => (
														<div key={bIdx} className="flex items-center gap-2">
															<span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted font-mono text-xs font-medium">
																{bIdx + 1}
															</span>
															<Input
																value={draft?.blanks?.[bIdx] ?? ""}
																onChange={(e) =>
																	updateAnswer(q.id, (prev) => {
																		const next = Array.from(
																			{
																				length: Math.max(1, q.blank_count),
																			},
																			(_, i) => prev.blanks?.[i] ?? ""
																		);
																		next[bIdx] = e.target.value;
																		return { ...prev, blanks: next };
																	})
																}
																placeholder={t("blankPlaceholder", {
																	number: bIdx + 1,
																})}
															/>
														</div>
													)
												)}
											</div>
										)}

										{/* Matching */}
										{q.question_type === "matching" && (
											<div className="space-y-2.5">
												{q.options.map((opt) => (
													<div
														key={opt.id}
														className="grid grid-cols-1 items-center gap-2 rounded-md border bg-muted/20 p-2.5 sm:grid-cols-2"
													>
														<span className="text-sm font-medium">
															{opt.option_text}
														</span>
														<Select
															value={draft?.pairs?.[opt.id] ?? ""}
															onValueChange={(val) =>
																updateAnswer(q.id, (prev) => ({
																	...prev,
																	pairs: {
																		...(prev.pairs ?? {}),
																		[opt.id]: val,
																	},
																}))
															}
														>
															<SelectTrigger className="bg-background">
																<SelectValue
																	placeholder={t("matchSelectPlaceholder")}
																/>
															</SelectTrigger>
															<SelectContent>
																{q.match_targets.map((target, tIdx) => (
																	<SelectItem
																		key={`${target}-${tIdx}`}
																		value={target}
																	>
																		{target}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
												))}
											</div>
										)}

										{/* Ordering */}
										{q.question_type === "ordering" && (
											<div className="space-y-2">
												<p className="text-xs text-muted-foreground">
													{t("orderingHint")}
												</p>
												{orderedIds.map((optId, pos) => {
													const opt = q.options.find((o) => o.id === optId);
													if (!opt) return null;
													return (
														<div
															key={opt.id}
															className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2"
														>
															<div className="flex items-center gap-2.5 min-w-0">
																<span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted font-mono text-xs font-medium">
																	{pos + 1}
																</span>
																<span className="text-sm">
																	{opt.option_text}
																</span>
															</div>
															<div className="flex items-center gap-1 shrink-0">
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="size-7"
																	disabled={pos === 0}
																	aria-label={t("moveUp")}
																	onClick={() =>
																		updateAnswer(q.id, (prev) => {
																			const next = [...orderedIds];
																			[next[pos - 1], next[pos]] = [
																				next[pos],
																				next[pos - 1],
																			];
																			return {
																				...prev,
																				orderedOptionIds: next,
																			};
																		})
																	}
																>
																	<ArrowUpIcon className="size-3.5" />
																</Button>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="size-7"
																	disabled={pos === orderedIds.length - 1}
																	aria-label={t("moveDown")}
																	onClick={() =>
																		updateAnswer(q.id, (prev) => {
																			const next = [...orderedIds];
																			[next[pos], next[pos + 1]] = [
																				next[pos + 1],
																				next[pos],
																			];
																			return {
																				...prev,
																				orderedOptionIds: next,
																			};
																		})
																	}
																>
																	<ArrowDownIcon className="size-3.5" />
																</Button>
															</div>
														</div>
													);
												})}
											</div>
										)}

										{/* Short answer / image without options */}
										{(q.question_type === "short_answer_text" ||
											(q.question_type === "image_based_question" &&
												q.options.length === 0)) && (
											<Input
												value={draft?.answerText ?? ""}
												onChange={(e) =>
													updateAnswer(q.id, (prev) => ({
														...prev,
														answerText: e.target.value,
													}))
												}
												placeholder={t("shortAnswerPlaceholder")}
											/>
										)}

										{/* Long answer */}
										{q.question_type === "long_answer_text" && (
											<Textarea
												rows={4}
												value={draft?.answerText ?? ""}
												onChange={(e) =>
													updateAnswer(q.id, (prev) => ({
														...prev,
														answerText: e.target.value,
													}))
												}
												placeholder={t("longAnswerPlaceholder")}
											/>
										)}

										{/* Optional hint */}
										{q.hint && (
											<div>
												<button
													type="button"
													onClick={() => toggleHint(q.id)}
													className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
												>
													<LightbulbIcon className="size-3.5 text-amber-500" />
													{revealedHints.has(q.id)
														? t("hideHint")
														: t("showHint")}
												</button>
												{revealedHints.has(q.id) && (
													<p className="mt-1.5 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
														{q.hint}
													</p>
												)}
											</div>
										)}
									</li>
								);
							})}
						</ol>

						{/* Incomplete warning + submit footer */}
						<div className="space-y-3 border-t pt-4">
							{confirmIncomplete && unansweredCount > 0 && (
								<div
									role="alert"
									className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300"
								>
									<AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
									<span>
										{t("unansweredWarning", { count: unansweredCount })}
									</span>
								</div>
							)}

							<div className="flex flex-wrap items-center justify-between gap-3">
								<span className="text-xs text-muted-foreground">
									{t("answeredSummary", {
										answered: answeredCount,
										total: totalQuestions,
									})}
								</span>
								<Button
									type="button"
									onClick={() => handleSubmitClick(activeAttempt)}
									disabled={submitMutation.isPending}
									className="gap-2"
								>
									{submitMutation.isPending ? (
										<Loader2Icon className="size-4 animate-spin" />
									) : (
										<SendIcon className="size-4" />
									)}
									{confirmIncomplete ? t("confirmSubmit") : t("submitExam")}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// ── Overview / Results UI ─────────────────────────────────────────────────
	const hasPendingManual = attempts.some((a) => a.awaiting_manual_grade);

	return (
		<div className="space-y-4">
			{note && (
				<p className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
					{note}
				</p>
			)}

			<Card
				className={cn(
					has_passed && "border-emerald-500/40 bg-emerald-500/[0.02]"
				)}
			>
				<CardHeader className="space-y-2 border-b">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="flex items-start gap-3 min-w-0">
							<div
								className={cn(
									"flex size-10 shrink-0 items-center justify-center rounded-lg",
									has_passed
										? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
										: "bg-primary/10 text-primary"
								)}
							>
								{has_passed ? (
									<TrophyIcon className="size-5" />
								) : (
									<ClipboardCheckIcon className="size-5" />
								)}
							</div>
							<div className="min-w-0 space-y-1">
								<CardTitle className="text-base sm:text-lg leading-snug">
									{quiz.title}
								</CardTitle>
								{quiz.description && (
									<p className="text-sm text-muted-foreground">
										{quiz.description}
									</p>
								)}
							</div>
						</div>

						{has_passed ? (
							<Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
								<CheckCircle2Icon className="size-3.5" />
								{t("statusPassed")}
							</Badge>
						) : hasPendingManual ? (
							<Badge
								variant="secondary"
								className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400"
							>
								<ClockIcon className="size-3.5" />
								{t("statusPendingGrade")}
							</Badge>
						) : (
							<Badge variant="outline" className="gap-1">
								<TargetIcon className="size-3.5" />
								{t("statusRequired")}
							</Badge>
						)}
					</div>
				</CardHeader>

				<CardContent className="space-y-5 pt-5">
					{/* Metadata chips */}
					<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
							<ListChecksIcon className="size-3.5" />
							{t("metaQuestions", { count: quiz.question_count })}
						</span>

						{quiz.passing_score_percentage != null && (
							<span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
								<TargetIcon className="size-3.5" />
								{t("metaPassingScore", {
									score: quiz.passing_score_percentage,
								})}
							</span>
						)}

						<span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
							<ClockIcon className="size-3.5" />
							{quiz.time_limit_minutes != null
								? t("metaTimeLimit", { minutes: quiz.time_limit_minutes })
								: t("metaNoTimeLimit")}
						</span>

						<span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
							<RotateCcwIcon className="size-3.5" />
							{quiz.max_attempts != null
								? t("metaAttemptsLimited", {
										used: attempts_used,
										max: quiz.max_attempts,
									})
								: t("metaAttemptsUnlimited")}
						</span>
					</div>

					{quiz.instructions && (
						<div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground whitespace-pre-line">
							{quiz.instructions}
						</div>
					)}

					{/* Latest submission feedback banner */}
					{lastResult && (
						<div
							role="status"
							className={cn(
								"rounded-lg border p-4 space-y-1.5",
								lastResult.attempt.passed === true
									? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
									: lastResult.attempt.awaiting_manual_grade
										? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
										: "border-destructive/40 bg-destructive/10 text-destructive"
							)}
						>
							<div className="flex items-center gap-2 font-semibold text-sm">
								{lastResult.attempt.passed === true ? (
									<>
										<CheckCircle2Icon className="size-4 shrink-0" />
										<span>{t("resultPassedTitle")}</span>
									</>
								) : lastResult.attempt.awaiting_manual_grade ? (
									<>
										<ClockIcon className="size-4 shrink-0" />
										<span>{t("resultPendingTitle")}</span>
									</>
								) : (
									<>
										<XCircleIcon className="size-4 shrink-0" />
										<span>{t("resultFailedTitle")}</span>
									</>
								)}
							</div>
							<p className="text-xs opacity-90">
								{lastResult.attempt.awaiting_manual_grade
									? t("resultPendingDescription")
									: t("resultScoreSummary", {
											score: lastResult.attempt.score,
											max: lastResult.attempt.max_score_possible,
											percentage: Math.round(
												lastResult.attempt.score_percentage
											),
											required:
												lastResult.attempt.passing_score_percentage ?? 0,
										})}
							</p>
						</div>
					)}

					{/* Start / Retake CTA */}
					<div className="flex flex-wrap items-center gap-3">
						{quiz.question_count === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("noQuestions")}
							</p>
						) : can_start ? (
							<Button
								type="button"
								variant={has_passed ? "outline" : "default"}
								onClick={() => startMutation.mutate()}
								disabled={startMutation.isPending}
								className="gap-2"
							>
								{startMutation.isPending ? (
									<Loader2Icon className="size-4 animate-spin" />
								) : attempts_used > 0 ? (
									<RotateCcwIcon className="size-4" />
								) : (
									<PlayIcon className="size-4" />
								)}
								{has_passed
									? t("retakePassed")
									: attempts_used > 0
										? t("retryExam")
										: t("startExam")}
							</Button>
						) : (
							!has_passed && (
								<p className="text-sm font-medium text-destructive">
									{t("noAttemptsLeft")}
								</p>
							)
						)}

						{!has_passed &&
							can_start &&
							remaining_attempts !== null &&
							attempts_used > 0 && (
								<span className="text-xs text-muted-foreground">
									{t("remainingAttempts", { count: remaining_attempts })}
								</span>
							)}
					</div>

					{/* Post-attempt answer review (only when enabled by quiz settings) */}
					{lastResult?.show_answers &&
						lastResult.review &&
						lastResult.review.length > 0 && (
							<div className="space-y-3 border-t pt-4">
								<h4 className="text-sm font-semibold">{t("reviewHeading")}</h4>
								<div className="space-y-3">
									{lastResult.review.map((item, rIdx) => {
										const correctOptions = item.options.filter(
											(o) => o.is_correct && o.option_text
										);
										return (
											<div
												key={item.question_id}
												className="rounded-lg border p-3.5 space-y-2 text-sm"
											>
												<div className="flex items-start justify-between gap-2">
													<p className="font-medium">
														{rIdx + 1}.{" "}
														{formatPromptWithBlanks(item.question_text)}
													</p>
													{item.is_correct === true ? (
														<CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
													) : item.is_correct === false ? (
														<XCircleIcon className="size-4 shrink-0 text-destructive" />
													) : (
														<ClockIcon className="size-4 shrink-0 text-amber-500" />
													)}
												</div>

												{item.question_type === "matching" ? (
													<div className="text-xs text-muted-foreground space-y-0.5">
														{item.options.map((o) => (
															<div key={o.id}>
																{o.option_text} →{" "}
																<span className="font-medium text-foreground">
																	{o.match_target_text}
																</span>
															</div>
														))}
													</div>
												) : item.question_type === "ordering" ? (
													<p className="text-xs text-muted-foreground">
														{t("correctAnswerLabel")}:{" "}
														<span className="font-medium text-foreground">
															{item.options
																.map((o) => o.option_text)
																.join(" → ")}
														</span>
													</p>
												) : (
													correctOptions.length > 0 && (
														<p className="text-xs text-muted-foreground">
															{t("correctAnswerLabel")}:{" "}
															<span className="font-medium text-emerald-700 dark:text-emerald-400">
																{correctOptions
																	.map((o) => o.option_text)
																	.join(", ")}
															</span>
														</p>
													)
												)}

												{item.feedback && (
													<p className="text-xs text-muted-foreground">
														{item.feedback}
													</p>
												)}
												{item.explanation && (
													<p className="rounded bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
														{item.explanation}
													</p>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}

					{/* Previous attempts history */}
					{attempts.length > 0 && (
						<div className="space-y-2 border-t pt-4">
							<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{t("previousAttempts")}
							</h4>
							<div className="space-y-1.5">
								{attempts.slice(0, 5).map((att) => {
									const max = att.max_score_possible ?? 0;
									const score = att.score ?? 0;
									const pct = max > 0 ? Math.round((score * 100) / max) : 0;
									return (
										<div
											key={att.id}
											className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs"
										>
											<span className="font-medium">
												{t("attemptNumber", { number: att.attempt_number })}
											</span>
											<div className="flex items-center gap-2">
												{!att.awaiting_manual_grade && max > 0 && (
													<span className="tabular-nums text-muted-foreground">
														{score}/{max} ({pct}%)
													</span>
												)}
												{att.passed === true ? (
													<Badge
														variant="secondary"
														className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
													>
														{t("statusPassed")}
													</Badge>
												) : att.awaiting_manual_grade ? (
													<Badge
														variant="secondary"
														className="bg-amber-500/15 text-amber-700 dark:text-amber-400"
													>
														{t("statusPendingGrade")}
													</Badge>
												) : (
													<Badge
														variant="secondary"
														className="bg-destructive/10 text-destructive"
													>
														{t("statusFailed")}
													</Badge>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
