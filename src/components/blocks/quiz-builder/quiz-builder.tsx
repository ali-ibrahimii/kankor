"use client";

import { Provider, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	ListOrderedIcon,
	SaveIcon,
	SettingsIcon,
	Trash2Icon,
} from "lucide-react";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppForm } from "@/hooks/use-form";
import { deleteQuiz, type SaveQuizResult, saveQuiz } from "./actions";
import { QuestionList } from "./question-list";
import { QuizSettings } from "./quiz-settings";
import {
	activeQuestionsAtom,
	initQuizAtom,
	quizAtom,
	totalPointsAtom,
} from "./store";
import {
	formValuesToQuizPatch,
	type QuizDraft,
	type QuizSettingsValues,
	quizDraftToFormValues,
} from "./types";

// ─── Props ────────────────────────────────────────────────────────────────

export interface QuizBuilderProps {
	initialDraft?: QuizDraft & { entrance_code?: string };
	lessonId?: string;
	schoolId?: string;
	/** When set, new quizzes are created as agency-owned (see saveQuiz). */
	agencyId?: string;
	onSave?: (quizId: string) => void;
	onDelete?: () => void;
	onCancel?: () => void;
}

// ─── Inner component (inside Provider) ───────────────────────────────────

function QuizBuilderInner({
	initialDraft,
	lessonId: lessonIdProp,
	schoolId: schoolIdProp,
	agencyId: agencyIdProp,
	onSave,
	onDelete,
	onCancel,
}: QuizBuilderProps) {
	const t = useTranslations("quizBuilder");

	// ── Single quiz atom + two derived read-only atoms ───────────────────

	const [quiz, setQuiz] = useAtom(quizAtom);
	const activeQuestions = useAtomValue(activeQuestionsAtom);
	const totalPoints = useAtomValue(totalPointsAtom);
	const initQuiz = useSetAtom(initQuizAtom);

	const {
		id: quizId,
		questions,
		isSaving,
		isDeleting,
		validationErrors,
		activeTab,
	} = quiz;

	// ── Initialize store from initialDraft ───────────────────────────────

	React.useEffect(() => {
		initQuiz({
			id: initialDraft?.id,
			entrance_code: initialDraft?.entrance_code,
			lesson_id: lessonIdProp ?? initialDraft?.lesson_id ?? undefined,
			school_id: schoolIdProp ?? initialDraft?.school_id ?? undefined,
			questions: initialDraft?.questions ?? [],
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const isEditing = !!quizId;

	// ── Question-level validation (not managed by the form) ──────────────

	function validateQuestions(): string[] {
		const errors: string[] = [];
		for (const [i, q] of activeQuestions.entries()) {
			if (!q.question_text.trim())
				errors.push(t("validation.questionNoText", { n: i + 1 }));
			const activeOpts = q.options.filter((o) => !o._deleted);
			const needsCorrect = [
				"multiple_choice_single_correct",
				"multiple_choice_multiple_correct",
				"true_false",
				"yes_no",
			].includes(q.question_type);
			if (needsCorrect && !activeOpts.some((o) => o.is_correct)) {
				errors.push(t("validation.questionNoAnswer", { n: i + 1 }));
			}
		}
		return errors;
	}

	// ── Form (settings fields) ────────────────────────────────────────────

	const form = useAppForm({
		defaultValues: quizDraftToFormValues(initialDraft),
		onSubmit: async ({ value }: { value: QuizSettingsValues }) => {
			const qErrors = validateQuestions();
			if (qErrors.length > 0) {
				setQuiz((prev) => ({ ...prev, validationErrors: qErrors }));
				toast.error(t("validation.fixIssues"));
				return;
			}

			setQuiz((prev) => ({ ...prev, validationErrors: [], isSaving: true }));
			try {
				const result: SaveQuizResult = await saveQuiz({
					id: quizId,
					...formValuesToQuizPatch(value),
					lesson_id: initialDraft?.lesson_id ?? lessonIdProp ?? null,
					school_id: initialDraft?.school_id ?? schoolIdProp ?? null,
					agency_id: initialDraft?.agency_id ?? agencyIdProp ?? null,
					questions,
				});

				if (result.success) {
					toast.success(
						isEditing ? t("toast.quizUpdated") : t("toast.quizCreated")
					);
					if (!quizId) setQuiz((prev) => ({ ...prev, id: result.quizId }));
					onSave?.(result.quizId);
				} else {
					toast.error(result.error);
				}
			} finally {
				setQuiz((prev) => ({ ...prev, isSaving: false }));
			}
		},
	});

	// ── Delete ────────────────────────────────────────────────────────────

	async function handleDelete() {
		if (!quizId) return;
		setQuiz((prev) => ({ ...prev, isDeleting: true }));
		try {
			const result = await deleteQuiz(quizId);
			if (result.success) {
				toast.success(
					t("toast.quizDeleted", { title: form.state.values.title })
				);
				onDelete?.();
			} else {
				toast.error(result.error ?? t("toast.deleteError"));
			}
		} finally {
			setQuiz((prev) => ({ ...prev, isDeleting: false }));
		}
	}

	// ── Render ────────────────────────────────────────────────────────────

	return (
		<div className="flex flex-col gap-0">
			{/* Toolbar */}
			<div className="flex items-center justify-between gap-3 pb-4">
				<div className="flex items-center gap-2 min-w-0">
					<h2 className="truncate text-base font-semibold">
						{form.state.values.title ||
							(isEditing ? t("sheet.editTitle") : t("sheet.newTitle"))}
					</h2>
					{isEditing && (
						<Badge variant="secondary" className="shrink-0">
							{t("status.editing")}
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{isEditing && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="destructive"
									size="sm"
									disabled={isDeleting || isSaving}
								>
									{isDeleting ? (
										<Spinner className="size-4" />
									) : (
										<Trash2Icon className="size-4" />
									)}
									<span className="hidden sm:inline">
										{t("actions.delete")}
									</span>
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
									<AlertDialogDescription>
										{t("deleteDialog.description", {
											title: form.state.values.title,
										})}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										{t("deleteDialog.cancel")}
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDelete}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										{t("deleteDialog.confirm")}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}

					{onCancel && (
						<Button
							variant="outline"
							size="sm"
							onClick={onCancel}
							disabled={isSaving}
						>
							{t("actions.cancel")}
						</Button>
					)}

					<Button
						size="sm"
						onClick={() => form.handleSubmit()}
						disabled={isSaving || isDeleting}
					>
						{isSaving ? (
							<Spinner className="size-4" />
						) : (
							<SaveIcon className="size-4" />
						)}
						{isEditing ? t("actions.saveChanges") : t("actions.createQuiz")}
					</Button>
				</div>
			</div>

			{/* Question validation errors */}
			{validationErrors.length > 0 && (
				<div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
					<p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-destructive">
						<AlertCircleIcon className="size-4" />
						{t("validation.fixIssuesTitle")}
					</p>
					<ul className="list-inside list-disc space-y-0.5 text-xs text-destructive">
						{validationErrors.map((e, i) => (
							<li key={i}>{e}</li>
						))}
					</ul>
				</div>
			)}

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(v) => setQuiz((prev) => ({ ...prev, activeTab: v }))}
			>
				<div className="mb-4 flex items-center justify-between">
					<TabsList>
						<TabsTrigger value="settings" className="gap-1.5">
							<SettingsIcon className="size-3.5" />
							{t("tabs.settings")}
						</TabsTrigger>
						<TabsTrigger value="questions" className="gap-1.5">
							<ListOrderedIcon className="size-3.5" />
							{t("tabs.questions")}
							{activeQuestions.length > 0 && (
								<span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary">
									{activeQuestions.length}
								</span>
							)}
						</TabsTrigger>
					</TabsList>

					{activeQuestions.length > 0 && (
						<div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
							<CheckCircle2Icon className="size-3.5" />
							{t("tabs.totalPts", { count: totalPoints })}
						</div>
					)}
				</div>

				<TabsContent value="settings">
					{/* withForm passes form as a prop and handles context internally */}
					<QuizSettings form={form} />
				</TabsContent>

				<TabsContent value="questions">
					<QuestionList />
				</TabsContent>
			</Tabs>
		</div>
	);
}

// ─── Public export: scoped Jotai Provider per sheet instance ─────────────

export function QuizBuilder(props: QuizBuilderProps) {
	return (
		<Provider>
			<QuizBuilderInner {...props} />
		</Provider>
	);
}
