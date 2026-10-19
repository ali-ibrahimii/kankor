"use client";

import { useTranslations } from "next-intl";
import {
	ListPagination,
	ListSearchInput,
	type SimpleColumn,
	SimpleDataTable,
} from "@/components/blocks/admin";
import { Badge } from "@/components/ui/badge";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { TableRow as DbRow } from "@/types/db.types";

type TopupRow = DbRow<"agency_topups_view">;

/**
 * Top-up transaction list, shared by the agency dashboard and the admin
 * agency detail page. Student identity is limited to name + masked email.
 */
export function AgencyTopupsTable({ agencyId }: { agencyId: string }) {
	const t = useTranslations("admin.agencies.topups");

	const query = useQueryFilters<"agency_topups_view">({
		table: "agency_topups_view",
		selectColumns:
			"id, agency_id, amount, note, created_at, member_name, student_name, student_email_masked, dispute_id, dispute_status",
		searchColumns: ["student_name", "member_name"],
		initialState: {
			name: `agency-topups-${agencyId}`,
			filters: [{ field: "agency_id", operator: "eq", value: agencyId }],
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const topups = query.data?.data ?? [];
	const total = query.data?.count ?? null;
	const page = query.state.pagination?.page ?? 1;
	const pageSize = query.state.pagination?.pageSize ?? 20;

	const columns: SimpleColumn<TopupRow>[] = [
		{
			key: "student",
			header: t("table.student"),
			cell: (row) => (
				<div className="flex min-w-0 flex-col">
					<span className="truncate font-medium">
						{row.student_name ?? "—"}
					</span>
					<span className="truncate text-xs text-muted-foreground">
						{row.student_email_masked}
					</span>
				</div>
			),
		},
		{
			key: "amount",
			header: t("table.amount"),
			className: "tabular-nums font-medium",
			cell: (row) => row.amount?.toLocaleString(),
		},
		{
			key: "member",
			header: t("table.member"),
			className: "text-sm text-muted-foreground",
			cell: (row) => row.member_name ?? "—",
		},
		{
			key: "dispute",
			header: t("table.dispute"),
			cell: (row) =>
				row.dispute_status ? (
					<Badge
						variant={row.dispute_status === "open" ? "destructive" : "outline"}
					>
						{t(`disputeStatus.${row.dispute_status}` as never)}
					</Badge>
				) : (
					"—"
				),
		},
		{
			key: "date",
			header: t("table.date"),
			className: "text-sm text-muted-foreground",
			cell: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleString() : "—",
		},
	];

	return (
		<div className="space-y-4">
			<ListSearchInput
				value={query.state.search ?? ""}
				onChange={query.setSearch}
				placeholder={t("searchPlaceholder")}
			/>

			<SimpleDataTable
				columns={columns}
				rows={topups}
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
