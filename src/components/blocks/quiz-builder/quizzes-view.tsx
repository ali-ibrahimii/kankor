"use client";

import {
	ClockIcon,
	CopyIcon,
	EditIcon,
	EllipsisIcon,
	FileTextIcon,
	ListChecksIcon,
	Loader2Icon,
	PlusIcon,
	PrinterIcon,
	RotateCcwIcon,
	ShieldCheckIcon,
	TargetIcon,
	Trash2Icon,
	UploadIcon,
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ImportRunSummary } from "@/features/import";
import { ImportDialog } from "@/features/import";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { deleteQuiz, loadQuizForEditing } from "./actions";
import { QuizBuilder } from "./quiz-builder";
import type { QuizDraft } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface QuizListItem {
	id: string;
	title: string;
	entrance_code: string;
	time_limit_minutes: number | null;
	max_attempts: number | null;
	passing_score_percentage: number | null;
	show_correct_answers_after: string | null;
	shuffle_questions: boolean | null;
	created_at: string;
	question_count: number;
	lesson_title: string | null;
	school_id: string | null;
}

export interface QuizzesViewProps {
	quizzes: QuizListItem[];
	schoolId?: string;
	/** When set, new quizzes are created as agency-owned (see saveQuiz). */
	agencyId?: string;
	heading?: string;
	description?: string;
	/** Route prefix for the print/OMR link when neither `schoolId` applies, e.g. "/d/admin". Defaults to the instructor route. */
	omrBasePath?: string;
	/** Rendered above the stats row — lets callers add URL-synced search/filter UI without duplicating the table/sheet/import/delete logic. */
	filtersSlot?: React.ReactNode;
	/** Rendered below the table — for pagination controls. */
	footerSlot?: React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatTimeLimit(
	minutes: number | null,
	t: ReturnType<typeof useTranslations<"quizBuilder.list.table">>
) {
	if (!minutes) return t("noLimit");
	if (minutes < 60) return `${minutes} min`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m ? `${h}h ${m}m` : `${h}h`;
}

function ShowAnswersBadge({
	value,
	t,
}: {
	value: string | null;
	t: ReturnType<typeof useTranslations<"quizBuilder.list.showAnswersLabels">>;
}) {
	if (!value) return <span className="text-muted-foreground">—</span>;

	const map: Record<string, string> = {
		attempt: "attempt",
		quiz_end_time: "quiz_end_time",
		never: "never",
	};
	const key = map[value];
	if (!key) return <span className="text-muted-foreground">—</span>;

	const colorMap: Record<string, string> = {
		attempt: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
		quiz_end_time: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
		never: "bg-secondary text-secondary-foreground",
	};

	return (
		<span
			className={cn(
				"inline-flex rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium",
				colorMap[key]
			)}
		>
			{t(key as "attempt" | "quiz_end_time" | "never")}
		</span>
	);
}

// ─── Main Component ────────────────────────────────────────────────────────

export function QuizzesView({
	quizzes,
	schoolId,
	agencyId,
	heading,
	description,
	omrBasePath,
	filtersSlot,
	footerSlot,
}: QuizzesViewProps) {
	const router = useRouter();
	const t = useTranslations("quizBuilder");
	const tTable = useTranslations("quizBuilder.list.table");
	const tAnswers = useTranslations("quizBuilder.list.showAnswersLabels");

	const [sheetOpen, setSheetOpen] = React.useState(false);
	const [editingDraft, setEditingDraft] = React.useState<QuizDraft | null>(
		null
	);
	const [loadingEditId, setLoadingEditId] = React.useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<QuizListItem | null>(
		null
	);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [importDialogOpen, setImportDialogOpen] = React.useState(false);

	// ── Actions ────────────────────────────────────────────────────────────

	function openNewQuiz() {
		setEditingDraft(null);
		setSheetOpen(true);
	}

	async function openEditQuiz(quiz: QuizListItem) {
		setLoadingEditId(quiz.id);
		const result = await loadQuizForEditing(quiz.id);
		setLoadingEditId(null);
		if (!result.success) {
			toast.error(t("toast.loadError", { error: result.error }));
			return;
		}
		setEditingDraft(result.draft);
		setSheetOpen(true);
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setIsDeleting(true);
		const result = await deleteQuiz(deleteTarget.id);
		setIsDeleting(false);
		if (result.success) {
			toast.success(t("toast.quizDeleted", { title: deleteTarget.title }));
			setDeleteTarget(null);
			router.refresh();
		} else {
			toast.error(result.error ?? t("toast.deleteError"));
		}
	}

	function handleSaved() {
		setSheetOpen(false);
		router.refresh();
	}

	function copyCode(code: string) {
		navigator.clipboard.writeText(code);
		toast.success(t("toast.codeCopied"));
	}

	function omrHref(quiz: { id: string; slug?: string | null }) {
		const identifier = quiz.slug ?? quiz.id;
		if (schoolId) {
			return routes.d.school.quizzes.slug.page({
				school_id: schoolId,
				slug: identifier,
			});
		}
		if (omrBasePath) return `${omrBasePath}/quizzes/${identifier}`;
		return routes.d.instructor.quizzes.slug.page({ slug: identifier });
	}

	function handleImportComplete(summary: ImportRunSummary) {
		if (summary.insertedCount > 0) {
			router.refresh();
		}
		if (summary.errors.length === 0) {
			toast.success(t("toast.importSuccess", { count: summary.insertedCount }));
		} else {
			toast.warning(
				t("toast.importPartial", {
					inserted: summary.insertedCount,
					failed: summary.errors.length,
				})
			);
		}
	}

	// ── Stats ──────────────────────────────────────────────────────────────

	const totalQuestions = quizzes.reduce((s, q) => s + q.question_count, 0);
	const passingQuizzes = quizzes.filter(
		(q) => q.passing_score_percentage != null
	);
	const avgPassing =
		passingQuizzes.length > 0
			? Math.round(
					passingQuizzes.reduce(
						(s, q) => s + (q.passing_score_percentage ?? 0),
						0
					) / passingQuizzes.length
				)
			: null;

	const stats = [
		{
			label: t("list.stats.total"),
			value: quizzes.length,
			icon: FileTextIcon,
			color: "text-blue-600",
		},
		{
			label: t("list.stats.questions"),
			value: totalQuestions,
			icon: ListChecksIcon,
			color: "text-violet-600",
		},
		{
			label: t("list.stats.avgPassing"),
			value: avgPassing != null ? `${avgPassing}%` : "—",
			icon: TargetIcon,
			color: "text-emerald-600",
		},
		{
			label: t("list.stats.withLimit"),
			value: quizzes.filter((q) => q.time_limit_minutes).length,
			icon: ClockIcon,
			color: "text-amber-600",
		},
	];

	const pageHeading = heading ?? t("list.defaultDescription");
	const pageDescription = description ?? t("list.defaultDescription");

	// ── Render ─────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-xl font-semibold">{pageHeading}</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{pageDescription}
					</p>
				</div>
				<div className="flex shrink-0 gap-2">
					<Button
						variant="outline"
						onClick={() => setImportDialogOpen(true)}
						className="gap-1.5"
					>
						<UploadIcon className="size-4" />
						{t("actions.importQuizzes")}
					</Button>
					<Button onClick={openNewQuiz} className="gap-1.5">
						<PlusIcon className="size-4" />
						{t("actions.newQuiz")}
					</Button>
				</div>
			</div>

			{filtersSlot}

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{stats.map((s) => (
					<Card key={s.label} size="sm">
						<CardContent className="flex items-center gap-3 pb-4 pt-4">
							<div className="rounded-lg bg-muted p-2">
								<s.icon className={cn("size-4", s.color)} />
							</div>
							<div>
								<p className="text-xl font-bold tabular-nums leading-none">
									{s.value}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Table */}
			<Card>
				{quizzes.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
							<FileTextIcon className="size-6 text-muted-foreground" />
						</div>
						<p className="text-sm font-medium">{t("list.empty.title")}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{t("list.empty.description")}
						</p>
						<Button onClick={openNewQuiz} className="mt-4 gap-1.5" size="sm">
							<PlusIcon className="size-4" />
							{t("actions.newQuiz")}
						</Button>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{tTable("quiz")}</TableHead>
								<TableHead className="hidden sm:table-cell">
									{tTable("code")}
								</TableHead>
								<TableHead className="hidden md:table-cell text-center">
									{tTable("questions")}
								</TableHead>
								<TableHead className="hidden lg:table-cell">
									{tTable("timeLimit")}
								</TableHead>
								<TableHead className="hidden lg:table-cell text-center">
									{tTable("maxAttempts")}
								</TableHead>
								<TableHead className="hidden md:table-cell text-center">
									{tTable("passScore")}
								</TableHead>
								<TableHead className="hidden xl:table-cell">
									{tTable("showAnswers")}
								</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{quizzes.map((quiz) => (
								<TableRow key={quiz.id}>
									<TableCell>
										<div className="flex flex-col gap-0.5">
											<span className="font-medium leading-snug">
												{quiz.title}
											</span>
											{quiz.lesson_title && (
												<span className="text-xs text-muted-foreground truncate max-w-48">
													{quiz.lesson_title}
												</span>
											)}
											{quiz.shuffle_questions && (
												<span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
													<RotateCcwIcon className="size-2.5" />
													{tTable("shuffled")}
												</span>
											)}
											<div className="flex flex-wrap items-center gap-1.5 pt-1 sm:hidden">
												<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-widest">
													{quiz.entrance_code}
												</span>
												<span className="text-xs text-muted-foreground">
													{quiz.question_count} q
												</span>
											</div>
										</div>
									</TableCell>

									<TableCell className="hidden sm:table-cell">
										<button
											type="button"
											onClick={() => copyCode(quiz.entrance_code)}
											className="group flex items-center gap-1.5 text-left"
											title={t("actions.copyCode")}
										>
											<span className="font-mono text-sm tracking-widest">
												{quiz.entrance_code}
											</span>
											<CopyIcon className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
										</button>
									</TableCell>

									<TableCell className="hidden md:table-cell text-center tabular-nums">
										{quiz.question_count}
									</TableCell>

									<TableCell className="hidden lg:table-cell text-sm">
										{formatTimeLimit(quiz.time_limit_minutes, tTable)}
									</TableCell>

									<TableCell className="hidden lg:table-cell text-center">
										{quiz.max_attempts ?? (
											<span className="text-muted-foreground">
												{tTable("unlimited")}
											</span>
										)}
									</TableCell>

									<TableCell className="hidden md:table-cell text-center">
										{quiz.passing_score_percentage != null ? (
											<span className="text-sm">
												{quiz.passing_score_percentage}%
											</span>
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>

									<TableCell className="hidden xl:table-cell">
										<ShowAnswersBadge
											value={quiz.show_correct_answers_after}
											t={tAnswers}
										/>
									</TableCell>

									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-muted-foreground"
													disabled={loadingEditId === quiz.id}
												>
													{loadingEditId === quiz.id ? (
														<Loader2Icon className="size-4 animate-spin" />
													) : (
														<EllipsisIcon className="size-4" />
													)}
													<span className="sr-only">Actions</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => copyCode(quiz.entrance_code)}
												>
													<CopyIcon className="size-4" />
													{t("actions.copyCode")}
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem onClick={() => openEditQuiz(quiz)}>
													<EditIcon className="size-4" />
													{t("actions.editQuiz")}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => router.push(omrHref(quiz))}
												>
													<PrinterIcon className="size-4" />
													{t("actions.printAndScan")}
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-destructive focus:text-destructive"
													onClick={() => setDeleteTarget(quiz)}
												>
													<Trash2Icon className="size-4" />
													{t("actions.delete")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>

			{footerSlot}

			{/* Quiz Builder Sheet */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent
					side="right"
					className="flex w-full max-w-xl sm:max-w-2xl md:max-w-3xl flex-col gap-0 p-0"
					showCloseButton={false}
				>
					<SheetHeader className="border-b px-6 py-4">
						<div className="flex items-center gap-2">
							<ShieldCheckIcon className="size-4 text-muted-foreground" />
							<SheetTitle className="text-base">
								{editingDraft ? t("sheet.editTitle") : t("sheet.newTitle")}
							</SheetTitle>
						</div>
						<SheetDescription className="text-xs">
							{editingDraft
								? t("sheet.editDescription", { title: editingDraft.title })
								: t("sheet.newDescription")}
						</SheetDescription>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto p-6">
						<QuizBuilder
							key={editingDraft?.id ?? "new"}
							initialDraft={editingDraft ?? undefined}
							schoolId={schoolId}
							agencyId={agencyId}
							onSave={handleSaved}
							onCancel={() => setSheetOpen(false)}
						/>
					</div>
				</SheetContent>
			</Sheet>

			{/* Import */}
			<ImportDialog
				table="quizzes"
				open={importDialogOpen}
				onOpenChange={setImportDialogOpen}
				onComplete={handleImportComplete}
			/>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteDialog.description", {
								title: deleteTarget?.title ?? "",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							{t("deleteDialog.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								t("deleteDialog.confirm")
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
