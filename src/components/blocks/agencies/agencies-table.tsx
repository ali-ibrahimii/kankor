"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	AccountStatusBadge,
	ListPagination,
	ListSearchInput,
	type SimpleColumn,
	SimpleDataTable,
} from "@/components/blocks/admin";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { Link, useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import type { TableRow as DbRow } from "@/types/db.types";
import { type AgencyUpsertValues, createAgency } from "./actions";
import { AgencyForm } from "./agency-form";

type AgencyRow = DbRow<"agency_liability_summary">;

/** Super-admin agencies list with liability summary and create dialog. */
export function AgenciesTable() {
	const t = useTranslations("admin.agencies");
	const queryClient = useQueryClient();
	const router = useRouter();
	const [createOpen, setCreateOpen] = React.useState(false);

	const query = useQueryFilters<"agency_liability_summary">({
		table: "agency_liability_summary",
		selectColumns:
			"id, name, status, commission_rate, liability_limit, charged_total, settled_gross, commission_total, outstanding, last_topup_at, last_settlement_at",
		searchColumns: ["name"],
		initialState: {
			name: "admin-agencies",
			sort: [{ field: "name", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const agencies = query.data?.data ?? [];
	const total = query.data?.count ?? null;
	const page = query.state.pagination?.page ?? 1;
	const pageSize = query.state.pagination?.pageSize ?? 20;

	async function handleCreate(values: AgencyUpsertValues) {
		const result = await createAgency(values);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(t("created"));
		setCreateOpen(false);
		queryClient.invalidateQueries({ queryKey: ["agency_liability_summary"] });
		router.push(
			routes.d.admin.agencies.agency_id.page({ agency_id: result.data.id })
		);
	}

	const columns: SimpleColumn<AgencyRow>[] = [
		{
			key: "name",
			header: t("table.name"),
			cell: (row) => (
				<Link
					href={routes.d.admin.agencies.agency_id.page({
						agency_id: row.id ?? "",
					})}
					className="truncate font-medium hover:underline"
				>
					{row.name}
				</Link>
			),
		},
		{
			key: "status",
			header: t("table.status"),
			cell: (row) => <AccountStatusBadge status={row.status} />,
		},
		{
			key: "commission",
			header: t("table.commission"),
			className: "tabular-nums",
			cell: (row) => `${((row.commission_rate ?? 0) * 100).toFixed(1)}%`,
		},
		{
			key: "charged",
			header: t("table.charged"),
			className: "tabular-nums",
			cell: (row) => row.charged_total?.toLocaleString(),
		},
		{
			key: "settled",
			header: t("table.settled"),
			className: "tabular-nums",
			cell: (row) => row.settled_gross?.toLocaleString(),
		},
		{
			key: "outstanding",
			header: t("table.outstanding"),
			className: "tabular-nums font-medium",
			cell: (row) => (
				<span
					className={
						(row.outstanding ?? 0) >= (row.liability_limit ?? 0)
							? "text-destructive"
							: undefined
					}
				>
					{row.outstanding?.toLocaleString()} /{" "}
					{row.liability_limit?.toLocaleString()}
				</span>
			),
		},
		{
			key: "lastTopup",
			header: t("table.lastTopup"),
			className: "text-sm text-muted-foreground",
			cell: (row) =>
				row.last_topup_at
					? new Date(row.last_topup_at).toLocaleDateString()
					: "—",
		},
		{
			key: "actions",
			header: null,
			className: "w-12 text-end",
			cell: (row) => (
				<Button asChild variant="ghost" size="icon">
					<Link
						href={routes.d.admin.agencies.agency_id.page({
							agency_id: row.id ?? "",
						})}
					>
						<Eye className="size-4" />
					</Link>
				</Button>
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
				<Button className="ms-auto" onClick={() => setCreateOpen(true)}>
					<Plus className="size-4" />
					{t("create")}
				</Button>
			</div>

			<SimpleDataTable
				columns={columns}
				rows={agencies}
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

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("createTitle")}</DialogTitle>
					</DialogHeader>
					<AgencyForm
						onSubmit={handleCreate}
						onCancel={() => setCreateOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
