"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	CopyIcon,
	GlobeIcon,
	Link2Icon,
	ListChecksIcon,
	Loader2Icon,
	LockIcon,
	RefreshCwIcon,
	RotateCcwIcon,
	ShieldCheckIcon,
	TargetIcon,
	UnlinkIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	getQuizSummaryForBlock,
	listAttachableQuizzesForCourse,
	type QuizBlockLookupErrorCode,
	resolveQuizForBlock,
} from "./actions";
import { courseBuilderAtom, patchBlockAtom } from "./store";
import type { DraftContentBlock, ResolvedQuizSummary } from "./types";

export function QuizBlockField({ block }: { block: DraftContentBlock }) {
	const t = useTranslations("courseBuilder");
	const patchBlock = useSetAtom(patchBlockAtom);
	const builderCourseId = useAtomValue(courseBuilderAtom).courseId;
	const courseId = block.course_id || builderCourseId;
	const queryClient = useQueryClient();

	const [referenceInput, setReferenceInput] = React.useState("");
	const [isResolving, setIsResolving] = React.useState(false);
	const [lookupError, setLookupError] =
		React.useState<QuizBlockLookupErrorCode | null>(null);
	const [isChanging, setIsChanging] = React.useState(false);

	const showPicker = !block.quiz_id || isChanging;

	// Hydrate currently attached quiz preview card
	const linkedQuizQuery = useQuery({
		queryKey: ["course-block-quiz", courseId, block.quiz_id],
		queryFn: () => getQuizSummaryForBlock(courseId, block.quiz_id ?? ""),
		enabled: Boolean(courseId && block.quiz_id),
		staleTime: 60 * 1000,
	});

	// Load instructor/admin's attachable quizzes when the picker is open
	const attachableQuery = useQuery({
		queryKey: ["course-attachable-quizzes", courseId],
		queryFn: () => listAttachableQuizzesForCourse(courseId),
		enabled: Boolean(courseId && showPicker),
		staleTime: 60 * 1000,
	});

	function applyQuiz(summary: ResolvedQuizSummary) {
		queryClient.setQueryData(
			["course-block-quiz", courseId, summary.id],
			summary
		);
		patchBlock({ id: block.id, patch: { quiz_id: summary.id } });
		setReferenceInput("");
		setLookupError(null);
		setIsChanging(false);
		toast.success(t("block.quiz.linkedToast", { title: summary.title }));
	}

	async function handleResolveByReference() {
		const trimmed = referenceInput.trim();
		if (!trimmed) {
			setLookupError("invalid_reference");
			return;
		}
		if (!courseId) return;

		setIsResolving(true);
		setLookupError(null);
		try {
			const res = await resolveQuizForBlock(courseId, trimmed);
			if (!res.success) {
				setLookupError(res.code);
				return;
			}
			applyQuiz(res.data);
		} finally {
			setIsResolving(false);
		}
	}

	function handleSelectFromList(quizId: string) {
		const found = (attachableQuery.data ?? []).find((q) => q.id === quizId);
		if (!found) return;
		applyQuiz(found);
	}

	function handleUnlink() {
		patchBlock({ id: block.id, patch: { quiz_id: null } });
		setLookupError(null);
		setIsChanging(false);
	}

	function copyCode(code: string) {
		navigator.clipboard.writeText(code);
		toast.success(t("block.quiz.codeCopied"));
	}

	function renderErrorMessage(code: QuizBlockLookupErrorCode): string {
		switch (code) {
			case "invalid_reference":
				return t("block.quiz.errors.invalidReference");
			case "not_found":
				return t("block.quiz.errors.notFound");
			case "bound_to_other_course":
				return t("block.quiz.errors.boundToOtherCourse");
			case "forbidden":
				return t("block.quiz.errors.forbidden");
			default:
				return t("block.quiz.errors.database");
		}
	}

	const summary = linkedQuizQuery.data;
	const attachableQuizzes = attachableQuery.data ?? [];

	return (
		<div className="space-y-4">
			{/* Linked quiz summary card */}
			{block.quiz_id && !isChanging && (
				<div className="rounded-lg border bg-muted/20 p-4 space-y-3">
					{linkedQuizQuery.isLoading ? (
						<div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
							<Loader2Icon className="size-4 animate-spin" />
							<span>{t("block.quiz.loading")}</span>
						</div>
					) : summary ? (
						<>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
										<h4 className="font-semibold text-sm leading-snug">
											{summary.title}
										</h4>
										{summary.visibility === "private" ? (
											<Badge
												variant="secondary"
												className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400"
											>
												<LockIcon className="size-3" />
												{t("block.quiz.courseOnlyBadge")}
											</Badge>
										) : (
											<Badge
												variant="secondary"
												className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
											>
												<GlobeIcon className="size-3" />
												{t("block.quiz.publicBadge")}
											</Badge>
										)}
									</div>
									{summary.description && (
										<p className="text-xs text-muted-foreground line-clamp-2">
											{summary.description}
										</p>
									)}
								</div>

								<div className="flex items-center gap-1.5 shrink-0">
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-7 gap-1 px-2.5 text-xs"
										onClick={() => {
											setLookupError(null);
											setIsChanging(true);
										}}
									>
										<RefreshCwIcon className="size-3" />
										{t("block.quiz.change")}
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
										onClick={handleUnlink}
									>
										<UnlinkIcon className="size-3" />
										{t("block.quiz.unlink")}
									</Button>
								</div>
							</div>

							{/* Metadata pills */}
							<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<button
									type="button"
									onClick={() => copyCode(summary.entrance_code)}
									className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 font-mono text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
									title={t("block.quiz.copyCode")}
								>
									{summary.entrance_code}
									<CopyIcon className="size-3 text-muted-foreground" />
								</button>

								<span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
									<ListChecksIcon className="size-3" />
									{t("block.quiz.questionCount", {
										count: summary.question_count,
									})}
								</span>

								<span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
									<TargetIcon className="size-3" />
									{summary.passing_score_percentage != null
										? t("block.quiz.passingScore", {
												score: summary.passing_score_percentage,
											})
										: t("block.quiz.noPassingScore")}
								</span>

								<span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
									<ClockIcon className="size-3" />
									{summary.time_limit_minutes != null
										? t("block.quiz.timeLimit", {
												minutes: summary.time_limit_minutes,
											})
										: t("block.quiz.noTimeLimit")}
								</span>

								<span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
									{summary.max_attempts != null
										? t("block.quiz.maxAttempts", {
												count: summary.max_attempts,
											})
										: t("block.quiz.unlimitedAttempts")}
								</span>

								{summary.shuffle_questions && (
									<span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
										<RotateCcwIcon className="size-3" />
										{t("block.quiz.shuffled")}
									</span>
								)}
							</div>

							{summary.question_count === 0 && (
								<div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
									<AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
									<span>{t("block.quiz.emptyQuizWarning")}</span>
								</div>
							)}

							<div className="flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
								<ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
								<span>{t("block.quiz.passGateNotice")}</span>
							</div>
						</>
					) : (
						<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-400">
							<span className="flex items-center gap-1.5">
								<AlertTriangleIcon className="size-4 shrink-0" />
								{t("block.quiz.unavailable")}
							</span>
							<div className="flex items-center gap-1.5">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-7 text-xs"
									onClick={() => setIsChanging(true)}
								>
									{t("block.quiz.change")}
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 text-xs"
									onClick={handleUnlink}
								>
									{t("block.quiz.unlink")}
								</Button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Code / link input + quick picker */}
			{showPicker && (
				<div className="space-y-3 rounded-lg border border-dashed p-4">
					<div className="space-y-2">
						<Label htmlFor={`quiz-ref-${block.id}`}>
							{t("block.quiz.inputLabel")}
						</Label>
						<div className="flex flex-col gap-2 sm:flex-row">
							<div className="relative flex-1">
								<Link2Icon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id={`quiz-ref-${block.id}`}
									dir="ltr"
									className="ps-9 font-mono text-sm"
									value={referenceInput}
									onChange={(e) => {
										setReferenceInput(e.target.value);
										if (lookupError) setLookupError(null);
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											void handleResolveByReference();
										}
									}}
									placeholder={t("block.quiz.inputPlaceholder")}
									disabled={isResolving}
								/>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<Button
									type="button"
									size="sm"
									className="h-9 gap-1.5"
									onClick={() => void handleResolveByReference()}
									disabled={isResolving || !referenceInput.trim()}
								>
									{isResolving && (
										<Loader2Icon className="size-3.5 animate-spin" />
									)}
									{t("block.quiz.attachButton")}
								</Button>
								{isChanging && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-9"
										onClick={() => {
											setLookupError(null);
											setIsChanging(false);
										}}
										disabled={isResolving}
									>
										{t("common.cancel")}
									</Button>
								)}
							</div>
						</div>
						<p className="text-xs text-muted-foreground">
							{t("block.quiz.inputHint")}
						</p>
						{lookupError && (
							<p
								role="alert"
								className="flex items-center gap-1.5 text-xs font-medium text-destructive"
							>
								<AlertTriangleIcon className="size-3.5 shrink-0" />
								{renderErrorMessage(lookupError)}
							</p>
						)}
					</div>

					{attachableQuizzes.length > 0 && (
						<div className="space-y-1.5 border-t pt-3">
							<Label
								htmlFor={`quiz-select-${block.id}`}
								className="text-xs text-muted-foreground"
							>
								{t("block.quiz.orPickExisting")}
							</Label>
							<Select onValueChange={handleSelectFromList}>
								<SelectTrigger id={`quiz-select-${block.id}`}>
									<SelectValue
										placeholder={t("block.quiz.selectPlaceholder")}
									/>
								</SelectTrigger>
								<SelectContent>
									{attachableQuizzes.map((q) => (
										<SelectItem key={q.id} value={q.id}>
											{q.title} — [{q.entrance_code}] (
											{t("block.quiz.questionCount", {
												count: q.question_count,
											})}
											{q.visibility === "private"
												? ` · ${t("block.quiz.courseOnlyBadge")}`
												: ""}
											)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>
			)}

			{/* Optional instructor note displayed above the exam */}
			<div className="space-y-2">
				<Label htmlFor={`quiz-note-${block.id}`}>
					{t("block.quiz.noteLabel")}{" "}
					<span className="font-normal text-muted-foreground">
						({t("common.optional")})
					</span>
				</Label>
				<Textarea
					id={`quiz-note-${block.id}`}
					value={block.text_content ?? ""}
					onChange={(e) =>
						patchBlock({
							id: block.id,
							patch: { text_content: e.target.value || null },
						})
					}
					placeholder={t("block.quiz.notePlaceholder")}
					rows={2}
				/>
			</div>
		</div>
	);
}
