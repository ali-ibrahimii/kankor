"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircleIcon,
	ArrowLeft,
	LockIcon,
	PrinterIcon,
	ScanLineIcon,
	TrophyIcon,
	UsersIcon,
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { decodeSlugParam, getSlugOrIdColumn } from "@/lib/utils";
import { unlockQuiz } from "./actions";
import { PrintTab } from "./print-tab";
import { ResultsTab } from "./results-tab";
import { RosterTab } from "./roster-tab";
import { ScansTab } from "./scans-tab";
import type { QuizOmrSummary } from "./types";

async function fetchQuizSummary(identifier: string): Promise<QuizOmrSummary> {
	const slug = decodeSlugParam(identifier);
	const client = createClient();
	const { data, error } = await client
		.from("quizzes")
		.select(
			"id, title, locked_at, print_version, registration_deadline, school_id, user_id, questions(count)"
		)
		.eq(getSlugOrIdColumn(slug), slug)
		.single();
	if (error) throw error;

	const countArr = data.questions as unknown as { count: number }[];
	return {
		id: data.id,
		title: data.title,
		question_count: countArr?.[0]?.count ?? 0,
		locked_at: data.locked_at,
		print_version: data.print_version,
		registration_deadline: data.registration_deadline,
		school_id: data.school_id,
		user_id: data.user_id,
	};
}

export interface QuizOmrDetailProps {
	quizId: string;
	backHref: string;
}

export function QuizOmrDetail({ quizId, backHref }: QuizOmrDetailProps) {
	const t = useTranslations("quizOmr");
	const queryClient = useQueryClient();
	const [isUnlocking, setIsUnlocking] = React.useState(false);

	const {
		data: quiz,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["quiz-omr", quizId, "summary"],
		queryFn: () => fetchQuizSummary(quizId),
		enabled: !!quizId,
	});

	async function handleUnlock() {
		if (!quiz) return;
		setIsUnlocking(true);
		const result = await unlockQuiz(quiz.id);
		setIsUnlocking(false);
		if (result.success) {
			toast.success(t("lock.unlocked"));
			queryClient.invalidateQueries({ queryKey: ["quiz-omr", quizId] });
		} else {
			toast.error(result.error);
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (error || !quiz) {
		return (
			<div className="p-6 text-center">
				<p className="text-sm text-muted-foreground">{t("notFound")}</p>
				<Button asChild variant="outline" size="sm" className="mt-3">
					<Link href={backHref}>
						<ArrowLeft className="size-4" />
						{t("back")}
					</Link>
				</Button>
			</div>
		);
	}

	const isLocked = !!quiz.locked_at;

	return (
		<div className="space-y-0">
			{/* Toolbar */}
			<div className="sticky top-14 z-10 flex items-center justify-between gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="flex min-w-0 items-center gap-3">
					<Button asChild variant="ghost" size="icon-sm">
						<Link href={backHref}>
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">{quiz.title}</p>
						<p className="text-xs text-muted-foreground">
							{t("questionCount", { count: quiz.question_count })}
						</p>
					</div>
				</div>
			</div>

			{/* Lock banner */}
			{isLocked && (
				<div className="flex flex-col gap-3 border-b bg-amber-500/5 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-400">
						<LockIcon className="mt-0.5 size-4 shrink-0" />
						<p>{t("lock.bannerText", { version: quiz.print_version })}</p>
					</div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="shrink-0"
								disabled={isUnlocking}
							>
								{t("lock.unlockAction")}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t("lock.confirmTitle")}</AlertDialogTitle>
								<AlertDialogDescription>
									{t("lock.confirmDescription")}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t("lock.confirmCancel")}</AlertDialogCancel>
								<AlertDialogAction onClick={handleUnlock}>
									{t("lock.confirmAction")}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			)}

			{quiz.question_count === 0 && (
				<div className="flex items-center gap-2 border-b bg-destructive/5 px-6 py-3 text-sm text-destructive">
					<AlertCircleIcon className="size-4 shrink-0" />
					{t("noQuestionsWarning")}
				</div>
			)}

			{/* Tabs */}
			<Tabs defaultValue="roster" className="flex-1">
				<div className="border-b px-6">
					<TabsList className="h-auto gap-4 rounded-none bg-transparent p-0">
						{[
							{ value: "roster", label: t("tabs.roster"), icon: UsersIcon },
							{ value: "print", label: t("tabs.print"), icon: PrinterIcon },
							{ value: "scans", label: t("tabs.scans"), icon: ScanLineIcon },
							{ value: "results", label: t("tabs.results"), icon: TrophyIcon },
						].map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="relative rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
							>
								<tab.icon className="me-1.5 size-3.5" />
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				<div className="p-6">
					<TabsContent value="roster" className="mt-0">
						<RosterTab
							quizId={quiz.id}
							registrationDeadline={quiz.registration_deadline}
						/>
					</TabsContent>
					<TabsContent value="print" className="mt-0">
						<PrintTab quiz={quiz} />
					</TabsContent>
					<TabsContent value="scans" className="mt-0">
						<ScansTab quizId={quiz.id} />
					</TabsContent>
					<TabsContent value="results" className="mt-0">
						<ResultsTab quizId={quiz.id} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
