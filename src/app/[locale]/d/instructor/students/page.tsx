"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchIcon, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { QueryFn } from "@/hooks/filter/types";
import { createClient } from "@/lib/supabase/client";
import { useAuthProfile } from "@/providers/auth.provider";

// ─── Types & Query Config ───────────────────────────────────────────────────

type StudentRow = {
	id: string;
	full_name: string | null;
	email: string | null;
	phone: string | null;
	created_at: string;
	classroom_members: {
		id: string;
		role: string;
		classroom: {
			id: string;
			name: string;
			user_id: string;
		};
	}[];
};

const studentsQueryFn = (
	instructorId: string
): QueryFn<"profiles", StudentRow[]> => {
	return async (client, table, state, single) => {
		let query = client.from("profiles").select(
			`
				id,
				full_name,
				email,
				phone,
				created_at,
				classroom_members!inner(
					id,
					role,
					classroom:classrooms!inner(
						id,
						name,
						user_id
					)
				)
			`,
			{ count: "exact" }
		);

		// Filter profiles to only students who belong to classrooms owned by the instructor
		query = query.eq("classroom_members.role", "student");
		query = query.eq("classroom_members.classroom.user_id", instructorId);

		// Apply classroom filter if it exists in state
		const classroomFilter = state?.filters?.find(
			(f) => f.field === ("classroom_id" as any)
		);
		if (classroomFilter?.value) {
			query = query.eq(
				"classroom_members.classroom_id",
				classroomFilter.value as string
			);
		}

		// Apply search
		if (state?.search) {
			query = query.or(
				`full_name.ilike.%${state.search}%,email.ilike.%${state.search}%,phone.ilike.%${state.search}%`
			);
		}

		// Sort
		if (state?.sort && state.sort.length > 0) {
			for (const s of state.sort) {
				query = query.order(s.field as string, {
					ascending: s.direction === "asc",
				});
			}
		} else {
			query = query.order("created_at", { ascending: false });
		}

		// Pagination
		if (state?.pagination) {
			const from = (state.pagination.page - 1) * state.pagination.pageSize;
			const to = from + state.pagination.pageSize - 1;
			query = query.range(from, to);
		}

		return single ? await query.single() : await query;
	};
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstructorStudentsPage() {
	const t = useTranslations("instructorStudents");
	const profile = useAuthProfile();
	const instructorId = profile?.id;
	const supabase = React.useMemo(() => createClient(), []);

	// Fetch instructor's classrooms for the filter dropdown
	const { data: classrooms } = useQuery({
		queryKey: ["instructor-classrooms-filter-list", instructorId],
		queryFn: async () => {
			if (!instructorId) return [];
			const { data, error } = await supabase
				.from("classrooms")
				.select("id, name")
				.eq("user_id", instructorId)
				.eq("is_archived", false)
				.order("name");
			if (error) throw error;
			return data;
		},
		enabled: !!instructorId,
	});

	// Build the scoped query function
	const queryFn = React.useMemo(() => {
		return instructorId ? studentsQueryFn(instructorId) : undefined;
	}, [instructorId]);

	// Initialize useQueryFilters hook
	const studentsQuery = useQueryFilters<"profiles", StudentRow[]>({
		table: "profiles",
		queryFn,
		initialState: {
			name: "instructor-students",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 20 },
		},
		enabled: !!instructorId,
	});

	const students = (studentsQuery.data as any)?.data ?? [];
	const total = (studentsQuery.data as any)?.count ?? null;

	// Extract active classroom filter ID
	const activeClassroomFilter = studentsQuery.state.filters?.find(
		(f) => f.field === ("classroom_id" as any)
	);
	const activeClassroomId = activeClassroomFilter?.value
		? String(activeClassroomFilter.value)
		: "all";

	const handleClassroomChange = (val: string) => {
		if (val === "all") {
			studentsQuery.removeFilter("classroom_id" as any);
		} else {
			studentsQuery.setFilter({
				field: "classroom_id" as any,
				operator: "eq",
				value: val,
			});
		}
	};

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div className="flex items-center justify-between gap-4 border-b pb-5">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400">
						<Users className="size-5" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
						{total !== null && (
							<p className="text-sm text-muted-foreground">
								{t("subtitle", { count: total })}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Filter controls */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full max-w-sm">
					<SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						className="ps-8"
						placeholder={t("searchPlaceholder")}
						value={studentsQuery.state.search ?? ""}
						onChange={(e) => studentsQuery.setSearch(e.target.value)}
					/>
				</div>

				<div className="w-full sm:w-auto">
					<Select
						value={activeClassroomId}
						onValueChange={handleClassroomChange}
					>
						<SelectTrigger className="w-full sm:w-[220px]">
							<SelectValue placeholder={t("classroomFilterAll")} />
						</SelectTrigger>
						<SelectContent position="popper">
							<SelectItem value="all">{t("classroomFilterAll")}</SelectItem>
							{classrooms?.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Tabular data */}
			<div className="rounded-xl border bg-card text-card-foreground shadow-xs">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("table.name")}</TableHead>
							<TableHead>{t("table.contact")}</TableHead>
							<TableHead>{t("table.classrooms")}</TableHead>
							<TableHead>{t("table.joinedAt")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{studentsQuery.isFetching && students.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-10 text-center text-sm text-muted-foreground"
								>
									{t("loading")}
								</TableCell>
							</TableRow>
						) : students.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-10 text-center text-sm text-muted-foreground"
								>
									{t("empty")}
								</TableCell>
							</TableRow>
						) : (
							students.map((student: StudentRow) => {
								const uniqueClassrooms = Array.from(
									new Map(
										student.classroom_members
											?.map((cm) => cm.classroom)
											?.filter(Boolean)
											?.map((c) => [c.id, c])
									).values()
								);

								return (
									<TableRow key={student.id}>
										<TableCell className="font-medium">
											{student.full_name ?? t("unnamedStudent")}
										</TableCell>
										<TableCell className="text-sm">
											<div className="flex flex-col">
												<span className="font-medium text-foreground">
													{student.email || "—"}
												</span>
												{student.phone && (
													<span className="text-xs text-muted-foreground">
														{student.phone}
													</span>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-1.5">
												{uniqueClassrooms.map((c) => (
													<Badge key={c.id} variant="secondary">
														{c.name}
													</Badge>
												))}
											</div>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{new Date(student.created_at).toLocaleDateString()}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{total !== null &&
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
		</div>
	);
}
