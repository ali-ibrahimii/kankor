"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { scopedQueryFn } from "@/hooks/filter/query-state-mapping";
import type { TableRow as DbTableRow } from "@/types/db.types";
import { computeResultStats } from "./school-report-utils";

type AttemptRow = DbTableRow<"quiz_attempts"> & {
	quiz: { title: string } | null;
	student: { full_name: string | null } | null;
};

const PAGE_SIZE = 20;
const ALL = "__all__";

/**
 * Filterable results table for a school's quizzes. Attempts are scoped to the
 * school's quiz ids through `scopedQueryFn` fixed filters, so editing the
 * URL's filters can never widen the result set.
 */
export function SchoolResultsPanel({
	schoolId,
	quizIds,
	quizOptions,
}: {
	schoolId: string;
	quizIds: string[];
	quizOptions: { id: string; title: string }[];
}) {
	const t = useTranslations("schoolResults");

	const filters = useQueryFilters<"quiz_attempts", AttemptRow[]>({
		table: "quiz_attempts",
		queryFn: scopedQueryFn<"quiz_attempts", AttemptRow[]>(
			"id, attempt_number, score, max_score_possible, passed, started_at, completed_at, user_id, quiz_id, quiz:quizzes(title), student:profiles(full_name)",
			undefined,
			[
				{
					field: "quiz_id",
					operator: "in",
					// Filter["value"] predates the `in` operator taking a list.
					value: quizIds as never,
				},
			]
		),
		initialState: {
			name: `school-results-${schoolId}`,
			sort: [{ field: "completed_at", direction: "desc" }],
			pagination: { page: 1, pageSize: PAGE_SIZE },
		},
	});

	const rows =
		(filters.data as { data: AttemptRow[] | null } | undefined)?.data ?? [];
	const total =
		(filters.data as { count: number | null } | undefined)?.count ?? 0;
	const page = filters.state.pagination?.page ?? 1;
	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

	const status = React.useMemo(() => {
		const found = (filters.state.filters ?? []).find(
			(f) => f.field === "passed"
		);
		if (!found) return ALL;
		return found.value ? "passed" : "failed";
	}, [filters.state.filters]);

	const selectedQuiz = React.useMemo(() => {
		const found = (filters.state.filters ?? []).find(
			(f) => f.field === "quiz_id" && f.operator === "eq"
		);
		return found ? String(found.value) : ALL;
	}, [filters.state.filters]);

	const setStatus = (value: string) => {
		if (value === ALL) {
			filters.removeFilter("passed");
		} else {
			filters.setFilter({
				field: "passed",
				operator: "is",
				value: value === "passed",
			});
		}
	};

	const setQuiz = (value: string) => {
		// The school scope (`quiz_id in quizIds`) lives in scopedQueryFn's
		// fixedFilters and always applies — this state filter only narrows it.
		if (value === ALL) {
			filters.removeFilter("quiz_id");
		} else {
			filters.setFilter({ field: "quiz_id", operator: "eq", value });
		}
	};

	const stats = React.useMemo(() => computeResultStats(rows), [rows]);

	return (
		<div className="space-y-4">
			{/* Summary strip */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<SummaryTile label={t("statsTotal")} value={stats.total} />
				<SummaryTile label={t("statsPassed")} value={stats.passed} />
				<SummaryTile label={t("statsPassRate")} value={`${stats.passRate}%`} />
				<SummaryTile
					label={t("statsAvgScore")}
					value={`${stats.avgScorePct}%`}
				/>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<Select value={selectedQuiz} onValueChange={setQuiz}>
					<SelectTrigger className="w-[220px]">
						<SelectValue placeholder={t("filterQuiz")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{t("filterAllQuizzes")}</SelectItem>
						{quizOptions.map((quiz) => (
							<SelectItem key={quiz.id} value={quiz.id}>
								{quiz.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={status} onValueChange={setStatus}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder={t("filterStatus")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{t("filterAllStatuses")}</SelectItem>
						<SelectItem value="passed">{t("statusPassed")}</SelectItem>
						<SelectItem value="failed">{t("statusFailed")}</SelectItem>
					</SelectContent>
				</Select>

				<div className="ms-auto flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => filters.setPagination({ page: page - 1 })}
					>
						{t("prevPage")}
					</Button>
					<span className="text-xs text-muted-foreground tabular-nums">
						{t("pageOf", { page, total: pageCount })}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= pageCount}
						onClick={() => filters.setPagination({ page: page + 1 })}
					>
						{t("nextPage")}
					</Button>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("colStudent")}</TableHead>
							<TableHead>{t("colQuiz")}</TableHead>
							<TableHead className="w-16">{t("colAttempt")}</TableHead>
							<TableHead className="w-24">{t("colScore")}</TableHead>
							<TableHead className="w-24">{t("colResult")}</TableHead>
							<TableHead className="hidden w-40 sm:table-cell">
								{t("colDate")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									{t("loading")}
								</TableCell>
							</TableRow>
						) : rows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									{t("empty")}
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => {
								const pct =
									row.score != null && (row.max_score_possible ?? 0) > 0
										? Math.round(
												(row.score / (row.max_score_possible ?? 1)) * 100
											)
										: null;
								return (
									<TableRow key={row.id}>
										<TableCell className="font-medium">
											{row.student?.full_name ?? t("unknownStudent")}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{row.quiz?.title ?? "—"}
										</TableCell>
										<TableCell className="tabular-nums">
											{row.attempt_number}
										</TableCell>
										<TableCell className="tabular-nums">
											{row.score != null
												? `${row.score}${row.max_score_possible != null ? ` / ${row.max_score_possible}` : ""}`
												: "—"}
											{pct != null && (
												<span className="ms-1 text-xs text-muted-foreground">
													({pct}%)
												</span>
											)}
										</TableCell>
										<TableCell>
											{row.passed === true ? (
												<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
													{t("statusPassed")}
												</Badge>
											) : row.passed === false ? (
												<Badge variant="destructive">{t("statusFailed")}</Badge>
											) : (
												<Badge variant="outline">{t("statusPending")}</Badge>
											)}
										</TableCell>
										<TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
											{row.completed_at
												? new Date(row.completed_at).toLocaleDateString()
												: row.started_at
													? new Date(row.started_at).toLocaleDateString()
													: "—"}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function SummaryTile({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
			<p className="text-xl font-bold tabular-nums leading-none">{value}</p>
			<p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
		</div>
	);
}
