"use client";

import { useQueryClient } from "@tanstack/react-query";
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
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { TableRow as DbRow } from "@/types/db.types";
import { agencySetInstructorStatus } from "./actions";
import { ModerationReasonDialog } from "./moderation-reason-dialog";

type InstructorRow = DbRow<"agency_moderated_instructors_view">;

/**
 * Instructors within this agency's `instructors.suspend` scope. Suspension
 * immediately hides the instructor's published content (content gating via
 * is_content_owner_active); the RPC re-checks the grant per call.
 */
export function AgencyInstructorsTable({ agencyId }: { agencyId: string }) {
	const t = useTranslations("dashboard.agency.instructors");
	const tMod = useTranslations("dashboard.agency.moderation");
	const queryClient = useQueryClient();
	const [suspendTarget, setSuspendTarget] =
		React.useState<InstructorRow | null>(null);

	const query = useQueryFilters<"agency_moderated_instructors_view">({
		table: "agency_moderated_instructors_view",
		selectColumns:
			"id, agency_id, full_name, email, instructor_status, province_id, province_name, instructor_suspended_by_agency_id, instructor_suspension_reason, can_suspend",
		searchColumns: ["full_name", "email"],
		initialState: {
			name: `agency-instructors-${agencyId}`,
			filters: [{ field: "agency_id", operator: "eq", value: agencyId }],
			sort: [{ field: "full_name", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const instructors = query.data?.data ?? [];
	const total = query.data?.count ?? null;
	const page = query.state.pagination?.page ?? 1;
	const pageSize = query.state.pagination?.pageSize ?? 20;

	function invalidate() {
		queryClient.invalidateQueries({
			queryKey: ["agency_moderated_instructors_view"],
		});
	}

	async function handleSuspend(reason: string) {
		if (!suspendTarget) return;
		const result = await agencySetInstructorStatus({
			agencyId,
			instructorId: suspendTarget.id ?? "",
			action: "suspend",
			reason,
		});
		if (!result.success) toast.error(result.error);
		else {
			toast.success(tMod("suspended"));
			invalidate();
		}
		setSuspendTarget(null);
	}

	async function handleReactivate(row: InstructorRow) {
		const result = await agencySetInstructorStatus({
			agencyId,
			instructorId: row.id ?? "",
			action: "reactivate",
		});
		if (!result.success) toast.error(result.error);
		else {
			toast.success(tMod("reactivated"));
			invalidate();
		}
	}

	const columns: SimpleColumn<InstructorRow>[] = [
		{
			key: "instructor",
			header: t("table.instructor"),
			cell: (row) => (
				<div className="flex min-w-0 flex-col">
					<span className="truncate font-medium">{row.full_name ?? "—"}</span>
					<span className="truncate text-xs text-muted-foreground">
						{row.email}
					</span>
				</div>
			),
		},
		{
			key: "province",
			header: t("table.province"),
			className: "text-sm text-muted-foreground",
			cell: (row) => row.province_name ?? "—",
		},
		{
			key: "status",
			header: t("table.status"),
			cell: (row) => (
				<div className="flex min-w-0 flex-col gap-0.5">
					<AccountStatusBadge status={row.instructor_status} />
					{row.instructor_suspension_reason && (
						<span className="truncate text-xs text-muted-foreground">
							{row.instructor_suspension_reason}
						</span>
					)}
				</div>
			),
		},
		{
			key: "actions",
			header: null,
			className: "text-end",
			cell: (row) => {
				const suspendedByUs =
					row.instructor_status === "suspended" &&
					row.instructor_suspended_by_agency_id === agencyId;
				return (
					<div className="flex justify-end gap-2">
						{row.can_suspend && row.instructor_status === "active" && (
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setSuspendTarget(row)}
							>
								{tMod("suspend")}
							</Button>
						)}
						{row.can_suspend && suspendedByUs && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleReactivate(row)}
							>
								{tMod("reactivate")}
							</Button>
						)}
					</div>
				);
			},
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
				rows={instructors}
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

			<ModerationReasonDialog
				open={suspendTarget !== null}
				onOpenChange={(open) => !open && setSuspendTarget(null)}
				title={tMod("suspendInstructorTitle")}
				description={tMod("suspendInstructorDescription", {
					name: suspendTarget?.full_name ?? suspendTarget?.email ?? "",
				})}
				onConfirm={handleSuspend}
			/>
		</div>
	);
}
