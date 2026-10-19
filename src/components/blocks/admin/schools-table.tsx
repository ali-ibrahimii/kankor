"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { Link, useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import type { TableRow as DbRow } from "@/types/db.types";
import { AccountStatusBadge } from "./account-status-badge";
import { ListPagination } from "./list-pagination";
import { ListSearchInput } from "./list-search-input";
import { type SimpleColumn, SimpleDataTable } from "./simple-data-table";
import { StatusActionsMenu } from "./status-actions-menu";
import {
	StatusFilterToggle,
	type StatusFilterValue,
} from "./status-filter-toggle";

type SchoolRow = DbRow<"admin_schools_view">;

export function SchoolsTable() {
	const t = useTranslations("admin.schools");
	const tCommon = useTranslations("admin.common");
	const queryClient = useQueryClient();
	const router = useRouter();

	const query = useQueryFilters<"admin_schools_view">({
		table: "admin_schools_view",
		selectColumns:
			"id, name, status, admin_email, address, owner_id, owner_name, owner_email, created_at, members_count, courses_count, decks_count, quizzes_count",
		searchColumns: ["name", "admin_email", "owner_name", "owner_email"],
		initialState: {
			name: "admin-schools",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const schools = query.data?.data ?? [];
	const total = query.data?.count ?? null;
	const page = query.state.pagination?.page ?? 1;
	const pageSize = query.state.pagination?.pageSize ?? 20;

	const statusFilter = (query.state.filters?.find((f) => f.field === "status")
		?.value ?? "all") as StatusFilterValue;

	function handleStatusFilter(value: StatusFilterValue) {
		if (value === "all") query.removeFilter("status");
		else query.setFilter({ field: "status", operator: "eq", value });
	}

	function handleChanged() {
		queryClient.invalidateQueries({ queryKey: ["admin_schools_view"] });
		router.refresh();
	}

	const columns: SimpleColumn<SchoolRow>[] = [
		{
			key: "name",
			header: t("table.name"),
			cell: (row) => (
				<div className="flex min-w-0 flex-col">
					<Link
						href={routes.d.admin.schools.school_id.page({
							school_id: row.id ?? "",
						})}
						className="truncate font-medium hover:underline"
					>
						{row.name ?? t("unnamed")}
					</Link>
					<span className="truncate text-xs text-muted-foreground">
						{row.admin_email}
					</span>
				</div>
			),
		},
		{
			key: "owner",
			header: t("table.owner"),
			className: "text-sm text-muted-foreground",
			cell: (row) => (
				<div className="flex min-w-0 flex-col">
					<span className="truncate">{row.owner_name ?? "—"}</span>
					<span className="truncate text-xs">{row.owner_email}</span>
				</div>
			),
		},
		{
			key: "members",
			header: t("table.members"),
			className: "tabular-nums",
			cell: (row) => row.members_count,
		},
		{
			key: "courses",
			header: t("table.courses"),
			className: "tabular-nums",
			cell: (row) => row.courses_count,
		},
		{
			key: "decks",
			header: t("table.decks"),
			className: "tabular-nums",
			cell: (row) => row.decks_count,
		},
		{
			key: "quizzes",
			header: t("table.quizzes"),
			className: "tabular-nums",
			cell: (row) => row.quizzes_count,
		},
		{
			key: "status",
			header: t("table.status"),
			cell: (row) => <AccountStatusBadge status={row.status} />,
		},
		{
			key: "created",
			header: t("table.created"),
			className: "text-sm text-muted-foreground",
			cell: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
		},
		{
			key: "actions",
			header: null,
			className: "w-12 text-end",
			cell: (row) => (
				<StatusActionsMenu
					entity={{ kind: "school", id: row.id ?? "", status: row.status }}
					onChanged={handleChanged}
				>
					<DropdownMenuItem asChild>
						<Link
							href={routes.d.admin.schools.school_id.page({
								school_id: row.id ?? "",
							})}
						>
							<Eye className="size-4" />
							{tCommon("viewDetails")}
						</Link>
					</DropdownMenuItem>
				</StatusActionsMenu>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-3">
				<ListSearchInput
					value={query.state.search ?? ""}
					onChange={query.setSearch}
					placeholder={t("searchPlaceholder")}
				/>
				<StatusFilterToggle
					value={statusFilter}
					onValueChange={handleStatusFilter}
				/>
			</div>

			<SimpleDataTable
				columns={columns}
				rows={schools}
				rowKey={(row) => row.id ?? ""}
				isLoading={query.isFetching}
				emptyText={t("empty")}
			/>

			<ListPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(next) => query.setPagination({ page: next })}
			/>
		</div>
	);
}
