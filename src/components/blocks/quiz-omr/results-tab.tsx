"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, TargetIcon, TrophyIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { listResults } from "./actions";

export interface ResultsTabProps {
	quizId: string;
}

export function ResultsTab({ quizId }: ResultsTabProps) {
	const t = useTranslations("quizOmr.results");

	const { data, isLoading } = useQuery({
		queryKey: ["quiz-omr", quizId, "results"],
		queryFn: async () => {
			const result = await listResults(quizId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
	});

	if (isLoading || !data) {
		return (
			<div className="flex justify-center py-10">
				<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const stats = [
		{
			label: t("stats.scored"),
			value: data.scored_count,
			icon: UsersIcon,
			color: "text-blue-600",
		},
		{
			label: t("stats.average"),
			value:
				data.average_score_pct != null ? `${data.average_score_pct}%` : "—",
			icon: TrophyIcon,
			color: "text-emerald-600",
		},
		{
			label: t("stats.total"),
			value: data.rows.length,
			icon: TargetIcon,
			color: "text-violet-600",
		},
	];

	return (
		<div className="max-w-4xl space-y-6">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

			<div>
				<p className="mb-2 text-sm font-medium">{t("scoresTitle")}</p>
				{data.rows.length === 0 ? (
					<p className="text-xs text-muted-foreground">{t("noScores")}</p>
				) : (
					<div className="rounded-xl border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("table.student")}</TableHead>
									<TableHead>{t("table.status")}</TableHead>
									<TableHead>{t("table.score")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.rows.map((r) => (
									<TableRow key={r.id}>
										<TableCell className="font-medium">
											{r.student_full_name ?? t("unknownStudent")}
										</TableCell>
										<TableCell>
											<Badge variant="secondary">{r.status}</Badge>
										</TableCell>
										<TableCell className="tabular-nums">
											{r.score_pct != null ? `${r.score_pct}%` : "—"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			<div>
				<p className="mb-2 text-sm font-medium">{t("difficultyTitle")}</p>
				{data.per_question.length === 0 ? (
					<p className="text-xs text-muted-foreground">{t("noQuestions")}</p>
				) : (
					<div className="rounded-xl border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("table.question")}</TableHead>
									<TableHead>{t("table.answered")}</TableHead>
									<TableHead>{t("table.wrongPct")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.per_question.map((q) => (
									<TableRow key={q.question_id}>
										<TableCell>{t("questionN", { n: q.position })}</TableCell>
										<TableCell className="tabular-nums">
											{q.total_answered}
										</TableCell>
										<TableCell className="tabular-nums">
											<span
												className={
													q.wrong_pct >= 50
														? "font-medium text-destructive"
														: undefined
												}
											>
												{q.wrong_pct}%
											</span>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</div>
	);
}
