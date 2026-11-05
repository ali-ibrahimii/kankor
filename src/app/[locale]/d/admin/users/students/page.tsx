"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CoinsIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import {
	type AccountStatus,
	AccountStatusBadge,
	RoleCell,
	StatusActionsMenu,
	StatusFilterToggle,
	type StatusFilterValue,
} from "@/components/blocks/admin";
import { ChargeCreditsDialog } from "@/components/blocks/credits";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
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
import { defaultQueryFn } from "@/hooks/filter/query-state-mapping";
import type { QueryFn } from "@/hooks/filter/types";
import { useSupabase } from "@/hooks/use-supabase";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import type { Tables } from "@/lib/supabase/database.types";

// ─── Row shape ────────────────────────────────────────────────────────────────
//
// `admin_students_view` already aggregates the per-student counters
// (enrollments, quiz attempts, average score, grades/subjects, …) in the
// database, so the list shows them without an extra round-trip per row.

type StudentViewRow = Tables<"admin_students_view">;

// The view's `id` column is nullable in the generated types (PostgREST
// types every view column as nullable), but it mirrors `profiles.id`, which
// is the primary key and never null. Narrow it here so the row handlers get
// a definite `string`.
type StudentRow = Omit<StudentViewRow, "id"> & { id: string };

const SELECT = [
	"id",
	"full_name",
	"email",
	"phone",
	"credit_balance",
	"student_status",
	"created_at",
	"province_id",
	"province_name",
	"enrolled_courses_count",
	"completed_courses_count",
	"active_decks_count",
	"quiz_attempts_count",
	"quizzes_passed_count",
	"average_quiz_score",
	"certificates_count",
	"classrooms_count",
	"distinct_grades_count",
	"distinct_subjects_count",
	"grade_names",
	"subject_names",
	"last_activity_at",
].join(", ");

const studentsQueryFn: QueryFn<"admin_students_view", StudentRow[]> = (
	client,
	table,
	state,
	single
) =>
	defaultQueryFn<"admin_students_view", StudentRow[]>(SELECT, [
		"full_name",
		"email",
		"phone",
		"grade_names",
		"subject_names",
	])(client, table, state, single);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStudentsPage() {
	const t = useTranslations("credits.admin");
	const t2 = useTranslations("admin.instructors");
	const tStudents = useTranslations("admin.students");
	const tCommon = useTranslations("admin.common");
	const queryClient = useQueryClient();
	const [chargeTarget, setChargeTarget] = React.useState<StudentRow | null>(
		null
	);

	const studentsQuery = useQueryFilters<"admin_students_view", StudentRow[]>({
		table: "admin_students_view",
		queryFn: studentsQueryFn,
		initialState: {
			name: "admin-students",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const provincesQuery = useSupabase<
		"provinces",
		{ id: string; name: string }[]
	>({
		table: "provinces",
		selectColumns: "id, name",
		state: { sort: [{ field: "name", direction: "asc" }] },
		staleTime: Infinity,
	});

	const provinceFilter =
		(studentsQuery.state.filters?.find((f) => f.field === "province_id")
			?.value as string | null) ?? "all";

	const statusFilter = (studentsQuery.state.filters?.find(
		(f) => f.field === "student_status"
	)?.value ?? "all") as StatusFilterValue;

	const students = (
		((studentsQuery.data as any)?.data ?? []) as StudentViewRow[]
	)
		// `id` mirrors the profiles primary key — a null there would mean a
		// broken row, which has no detail page to link to.
		.filter((row): row is StudentRow => Boolean(row.id));
	const total = (studentsQuery.data as any)?.count ?? null;

	function handleProvinceFilter(value: string) {
		if (value === "all") studentsQuery.removeFilter("province_id");
		else
			studentsQuery.setFilter({ field: "province_id", operator: "eq", value });
	}

	function handleStatusFilter(value: StatusFilterValue) {
		if (value === "all") studentsQuery.removeFilter("student_status");
		else
			studentsQuery.setFilter({
				field: "student_status",
				operator: "eq",
				value,
			});
	}

	function handleCharged() {
		queryClient.invalidateQueries({ queryKey: ["admin_students_view"] });
		queryClient.invalidateQueries({ queryKey: ["profiles"] });
	}

	function handleStatusChanged() {
		queryClient.invalidateQueries({ queryKey: ["admin_students_view"] });
		queryClient.invalidateQueries({ queryKey: ["profiles"] });
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				{total != null && (
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("subtitle", { count: total })}
					</p>
				)}
			</div>

			<div className="flex flex-col md:flex-row gap-2 md:justify-between">
				<InputGroup className="min-w-48 max-w-md">
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupInput
						placeholder={t("searchPlaceholder")}
						value={studentsQuery.state.search ?? ""}
						onChange={(e) => studentsQuery.setSearch(e.target.value)}
					/>
				</InputGroup>

				<StatusFilterToggle
					value={statusFilter}
					onValueChange={handleStatusFilter}
					statuses={["active", "suspended", "disabled"]}
				/>

				<Select value={provinceFilter} onValueChange={handleProvinceFilter}>
					<SelectTrigger className="w-44" size="sm">
						<SelectValue placeholder={t2("provinceFilter")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={"all"}>{t2("allProvinces")}</SelectItem>
						{(provincesQuery.data?.data ?? []).map((province) => (
							<SelectItem key={province.id} value={province.id}>
								{province.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-xl border overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("table.name")}</TableHead>
							<TableHead>{t("table.contact")}</TableHead>
							<TableHead>{tStudents("table.classes")}</TableHead>
							<TableHead>{tStudents("table.gradesSubjects")}</TableHead>
							<TableHead>{tStudents("table.score")}</TableHead>
							<TableHead>{t("table.balance")}</TableHead>
							<TableHead>{t("table.status")}</TableHead>
							<TableHead className="w-32" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{studentsQuery.isFetching && students.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={8}
									className="py-10 text-center text-sm text-muted-foreground"
								>
									{t("loading")}
								</TableCell>
							</TableRow>
						) : students.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={8}
									className="py-10 text-center text-sm text-muted-foreground"
								>
									{t("empty")}
								</TableCell>
							</TableRow>
						) : (
							students.map((student: StudentRow) => (
								<TableRow key={student.id}>
									<TableCell>
										<Link
											href={routes.d.admin.users.students.user_id.page({
												user_id: student.id,
											})}
											className="font-medium hover:underline"
										>
											{student.full_name ?? t("unnamedStudent")}
										</Link>
										{student.province_name && (
											<p className="text-xs text-muted-foreground">
												{student.province_name}
											</p>
										)}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										<div className="flex flex-col">
											{student.email && <span>{student.email}</span>}
											{student.phone && <span>{student.phone}</span>}
										</div>
									</TableCell>
									<TableCell className="text-sm">
										<div className="flex flex-col gap-0.5">
											<span className="tabular-nums">
												{tStudents("list.courses", {
													count: student.enrolled_courses_count ?? 0,
												})}
											</span>
											<span className="text-xs text-muted-foreground">
												{tStudents("list.decks", {
													count: student.active_decks_count ?? 0,
												})}
											</span>
											{(student.classrooms_count ?? 0) > 0 && (
												<span className="text-xs text-muted-foreground">
													{tStudents("list.classrooms", {
														count: student.classrooms_count ?? 0,
													})}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell className="max-w-48 text-sm">
										{student.grade_names || student.subject_names ? (
											<div className="flex flex-col gap-0.5">
												{student.grade_names && (
													<span className="truncate">
														{student.grade_names}
													</span>
												)}
												{student.subject_names && (
													<span className="truncate text-xs text-muted-foreground">
														{student.subject_names}
													</span>
												)}
											</div>
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell className="text-sm">
										<div className="flex flex-col gap-0.5">
											<span className="font-semibold tabular-nums">
												{(student.average_quiz_score ?? 0) > 0
													? `${student.average_quiz_score}%`
													: "—"}
											</span>
											<span className="text-xs text-muted-foreground">
												{tStudents("list.attempts", {
													count: student.quiz_attempts_count ?? 0,
												})}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<RoleCell
											userId={student.id}
											userName={student.full_name}
											currentRole="student"
											onSuccess={handleStatusChanged}
										/>
									</TableCell>
									<TableCell className="font-semibold tabular-nums">
										{t("balanceCredits", {
											count: student.credit_balance ?? 0,
										})}
									</TableCell>
									<TableCell>
										<div className="flex items-center justify-end gap-1">
											<Button
												size="sm"
												variant="outline"
												onClick={() => setChargeTarget(student)}
											>
												<CoinsIcon className="size-3.5" />
												{t("charge")}
											</Button>
											<StatusActionsMenu
												entity={{
													kind: "student",
													id: student.id,
													status: student.student_status as AccountStatus,
												}}
												onChanged={handleStatusChanged}
											/>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{total != null &&
				total > (studentsQuery.state.pagination?.pageSize ?? 20) && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							{t("showing", {
								from:
									((studentsQuery.state.pagination?.page ?? 1) - 1) *
										(studentsQuery.state.pagination?.pageSize ?? 20) +
									1,
								to: Math.min(
									(studentsQuery.state.pagination?.page ?? 1) *
										(studentsQuery.state.pagination?.pageSize ?? 20),
									total
								),
								total,
							})}
						</span>
						<div className="flex items-center gap-1">
							<Button
								size="sm"
								variant="outline"
								disabled={(studentsQuery.state.pagination?.page ?? 1) <= 1}
								onClick={() =>
									studentsQuery.setPagination({
										page: (studentsQuery.state.pagination?.page ?? 1) - 1,
									})
								}
							>
								{t("previous")}
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={
									(studentsQuery.state.pagination?.page ?? 1) *
										(studentsQuery.state.pagination?.pageSize ?? 20) >=
									total
								}
								onClick={() =>
									studentsQuery.setPagination({
										page: (studentsQuery.state.pagination?.page ?? 1) + 1,
									})
								}
							>
								{t("next")}
							</Button>
						</div>
					</div>
				)}

			{chargeTarget && (
				<ChargeCreditsDialog
					open={!!chargeTarget}
					onOpenChange={(open) => !open && setChargeTarget(null)}
					userId={chargeTarget.id}
					userName={chargeTarget.full_name}
					onCharged={handleCharged}
				/>
			)}
		</div>
	);
}
