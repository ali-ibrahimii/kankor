"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Input } from "@/components/ui/input";
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
import { createClient } from "@/lib/supabase/client";
import {
	type AttendanceAttempt,
	type AttendanceRegistration,
	computeAttendance,
} from "./school-report-utils";

const ALL = "__all__";

/**
 * Exam attendance report: registered students vs. those who actually sat
 * each exam, aggregated per student and per quiz.
 */
export function SchoolAttendancePanel({
	schoolId,
	quizOptions,
}: {
	schoolId: string;
	quizOptions: { id: string; title: string }[];
}) {
	const t = useTranslations("schoolAttendance");
	const client = createClient();
	const quizIds = React.useMemo(
		() => quizOptions.map((quiz) => quiz.id),
		[quizOptions]
	);
	const [quizFilter, setQuizFilter] = React.useState(ALL);
	const [search, setSearch] = React.useState("");

	const attendanceQuery = useQuery({
		queryKey: ["school-attendance", schoolId, quizIds.join(",")],
		enabled: quizIds.length > 0,
		queryFn: async () => {
			const [regsRes, attemptsRes] = await Promise.all([
				client
					.from("quiz_registrations")
					.select("quiz_id, student_id, created_at")
					.in("quiz_id", quizIds)
					.order("created_at", { ascending: false })
					.limit(5000),
				client
					.from("quiz_attempts")
					.select("quiz_id, user_id, completed_at, created_at")
					.in("quiz_id", quizIds)
					.order("created_at", { ascending: false })
					.limit(5000),
			]);
			return {
				registrations: (regsRes.data ?? []) as AttendanceRegistration[],
				attempts: (attemptsRes.data ?? []) as AttendanceAttempt[],
			};
		},
	});

	const registrations = attendanceQuery.data?.registrations ?? [];
	const attempts = attendanceQuery.data?.attempts ?? [];

	// Names + last activity for everyone appearing in the report.
	const studentIds = React.useMemo(() => {
		const ids = new Set<string>();
		for (const reg of registrations) ids.add(reg.student_id);
		return [...ids].sort();
	}, [registrations]);

	const profilesQuery = useQuery({
		queryKey: ["school-attendance-profiles", studentIds.join(",")],
		enabled: studentIds.length > 0,
		queryFn: async () => {
			const [profilesRes, activityRes] = await Promise.all([
				client.from("profiles").select("id, full_name").in("id", studentIds),
				client
					.from("lesson_progress")
					.select("user_id, last_accessed_at")
					.in("user_id", studentIds)
					.not("last_accessed_at", "is", null)
					.order("last_accessed_at", { ascending: false })
					.limit(5000),
			]);
			const names = new Map<string, string>();
			for (const p of profilesRes.data ?? []) {
				names.set(p.id, p.full_name ?? p.id);
			}
			const lastActivity: Record<string, string> = {};
			for (const row of activityRes.data ?? []) {
				if (row.user_id && row.last_accessed_at) {
					if (!(row.user_id in lastActivity)) {
						lastActivity[row.user_id] = row.last_accessed_at;
					}
				}
			}
			return { names: Object.fromEntries(names), lastActivity };
		},
	});

	const names = profilesQuery.data?.names ?? {};
	const lastActivity = profilesQuery.data?.lastActivity ?? {};

	// Filter by quiz first, then compute the summary on the narrowed set.
	const filtered = React.useMemo(() => {
		if (quizFilter === ALL) return { registrations, attempts };
		return {
			registrations: registrations.filter((r) => r.quiz_id === quizFilter),
			attempts: attempts.filter((a) => a.quiz_id === quizFilter),
		};
	}, [registrations, attempts, quizFilter]);

	const summary = React.useMemo(
		() =>
			computeAttendance(
				filtered.registrations,
				filtered.attempts,
				lastActivity
			),
		[filtered, lastActivity]
	);

	const visibleStudents = React.useMemo(() => {
		const needle = search.trim().toLowerCase();
		if (!needle) return summary.perStudent;
		return summary.perStudent.filter((row) =>
			(names[row.studentId] ?? row.studentId).toLowerCase().includes(needle)
		);
	}, [summary.perStudent, search, names]);

	const quizTitle = (id: string) =>
		quizOptions.find((quiz) => quiz.id === id)?.title ?? id;

	return (
		<div className="space-y-4">
			{/* Summary */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<SummaryTile
					label={t("statsRegistered")}
					value={summary.totalRegistered}
				/>
				<SummaryTile label={t("statsAttended")} value={summary.totalAttended} />
				<SummaryTile label={t("statsRate")} value={`${summary.rate}%`} />
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<Select value={quizFilter} onValueChange={setQuizFilter}>
					<SelectTrigger className="w-[240px]">
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
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t("searchStudent")}
					className="w-[220px]"
				/>
			</div>

			{/* Per-student table */}
			<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("colStudent")}</TableHead>
							<TableHead className="w-28">{t("colRegistered")}</TableHead>
							<TableHead className="w-28">{t("colAttended")}</TableHead>
							<TableHead className="w-40">{t("colRate")}</TableHead>
							<TableHead className="hidden w-44 sm:table-cell">
								{t("colLastActivity")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{attendanceQuery.isLoading ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									{t("loading")}
								</TableCell>
							</TableRow>
						) : visibleStudents.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									{t("empty")}
								</TableCell>
							</TableRow>
						) : (
							visibleStudents.map((row) => (
								<TableRow key={row.studentId}>
									<TableCell className="font-medium">
										{names[row.studentId] ?? t("unknownStudent")}
									</TableCell>
									<TableCell className="tabular-nums">
										{row.registered}
									</TableCell>
									<TableCell className="tabular-nums">{row.attended}</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
												<div
													className="h-full rounded-full bg-primary"
													style={{ width: `${row.rate}%` }}
												/>
											</div>
											<span className="text-xs tabular-nums text-muted-foreground">
												{row.rate}%
											</span>
										</div>
									</TableCell>
									<TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
										{row.lastActivity
											? new Date(row.lastActivity).toLocaleDateString()
											: "—"}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Per-quiz attendance */}
			<div>
				<h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					{t("perQuizTitle")}
				</h2>
				{summary.perQuiz.length === 0 ? (
					<div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
						{t("empty")}
					</div>
				) : (
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{summary.perQuiz.map((quiz) => (
							<div
								key={quiz.quizId}
								className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
							>
								<p className="truncate text-sm font-bold">
									{quizTitle(quiz.quizId)}
								</p>
								<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
									<span>
										{t("quizRegisteredCount", { count: quiz.registered })}
									</span>
									<span aria-hidden="true">·</span>
									<span>
										{t("quizAttendedCount", { count: quiz.attended })}
									</span>
								</div>
								<div className="mt-2 flex items-center gap-2">
									<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
										<div
											className="h-full rounded-full bg-primary"
											style={{ width: `${quiz.rate}%` }}
										/>
									</div>
									<span className="text-xs font-bold tabular-nums">
										{quiz.rate}%
									</span>
								</div>
							</div>
						))}
					</div>
				)}
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
