"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
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
import { useAppForm } from "@/hooks/use-form";
import type { TableRow as DbRow } from "@/types/db.types";
import { agencySetSchoolStatus, agencyUpdateSchool } from "./actions";
import { ModerationReasonDialog } from "./moderation-reason-dialog";

type SchoolRow = DbRow<"agency_moderated_schools_view">;

/**
 * Schools within this agency's moderation scope. Suspend/reactivate needs
 * `schools.suspend`; detail edits need `schools.manage` — both re-checked
 * server-side per row, the view only drives what buttons render.
 */
export function AgencySchoolsTable({ agencyId }: { agencyId: string }) {
	const t = useTranslations("dashboard.agency.schools");
	const tMod = useTranslations("dashboard.agency.moderation");
	const queryClient = useQueryClient();
	const [suspendTarget, setSuspendTarget] = React.useState<SchoolRow | null>(
		null
	);
	const [editTarget, setEditTarget] = React.useState<SchoolRow | null>(null);

	const query = useQueryFilters<"agency_moderated_schools_view">({
		table: "agency_moderated_schools_view",
		selectColumns:
			"id, agency_id, name, admin_email, address, status, province_id, province_name, suspended_by_agency_id, suspension_reason, can_suspend, can_manage",
		searchColumns: ["name", "admin_email"],
		initialState: {
			name: `agency-schools-${agencyId}`,
			filters: [{ field: "agency_id", operator: "eq", value: agencyId }],
			sort: [{ field: "name", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const schools = query.data?.data ?? [];
	const total = query.data?.count ?? null;
	const page = query.state.pagination?.page ?? 1;
	const pageSize = query.state.pagination?.pageSize ?? 20;

	function invalidate() {
		queryClient.invalidateQueries({
			queryKey: ["agency_moderated_schools_view"],
		});
	}

	async function handleSuspend(reason: string) {
		if (!suspendTarget) return;
		const result = await agencySetSchoolStatus({
			agencyId,
			schoolId: suspendTarget.id ?? "",
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

	async function handleReactivate(row: SchoolRow) {
		const result = await agencySetSchoolStatus({
			agencyId,
			schoolId: row.id ?? "",
			action: "reactivate",
		});
		if (!result.success) toast.error(result.error);
		else {
			toast.success(tMod("reactivated"));
			invalidate();
		}
	}

	const editForm = useAppForm({
		defaultValues: { name: "", address: "", adminEmail: "" },
		onSubmit: async ({ value }) => {
			if (!editTarget) return;
			const result = await agencyUpdateSchool({
				agencyId,
				schoolId: editTarget.id ?? "",
				name: value.name.trim() || undefined,
				address: value.address.trim() || undefined,
				adminEmail: value.adminEmail.trim() || undefined,
			});
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(t("updated"));
			setEditTarget(null);
			invalidate();
		},
	});

	function openEdit(row: SchoolRow) {
		editForm.reset({
			name: row.name ?? "",
			address: row.address ?? "",
			adminEmail: row.admin_email ?? "",
		});
		setEditTarget(row);
	}

	const columns: SimpleColumn<SchoolRow>[] = [
		{
			key: "name",
			header: t("table.name"),
			cell: (row) => (
				<div className="flex min-w-0 flex-col">
					<span className="truncate font-medium">{row.name}</span>
					<span className="truncate text-xs text-muted-foreground">
						{row.admin_email}
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
					<AccountStatusBadge status={row.status} />
					{row.suspension_reason && (
						<span className="truncate text-xs text-muted-foreground">
							{row.suspension_reason}
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
					row.status === "suspended" && row.suspended_by_agency_id === agencyId;
				return (
					<div className="flex justify-end gap-2">
						{row.can_manage && (
							<Button variant="outline" size="sm" onClick={() => openEdit(row)}>
								{t("edit")}
							</Button>
						)}
						{row.can_suspend && row.status === "active" && (
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

			<ModerationReasonDialog
				open={suspendTarget !== null}
				onOpenChange={(open) => !open && setSuspendTarget(null)}
				title={tMod("suspendSchoolTitle")}
				description={tMod("suspendSchoolDescription", {
					name: suspendTarget?.name ?? "",
				})}
				onConfirm={handleSuspend}
			/>

			<Dialog
				open={editTarget !== null}
				onOpenChange={(open) => !open && setEditTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("editTitle")}</DialogTitle>
					</DialogHeader>
					<editForm.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								editForm.handleSubmit();
							}}
							className="space-y-4"
						>
							<editForm.AppField
								name="name"
								validators={{
									onBlur: z.string().min(1, t("validation.nameRequired")),
								}}
							>
								{(field) => <field.TextField label={t("table.name")} />}
							</editForm.AppField>
							<editForm.AppField name="address">
								{(field) => <field.TextField label={t("address")} />}
							</editForm.AppField>
							<editForm.AppField
								name="adminEmail"
								validators={{
									onBlur: z
										.string()
										.email(t("validation.invalidEmail"))
										.or(z.literal("")),
								}}
							>
								{(field) => <field.TextField label={t("adminEmail")} />}
							</editForm.AppField>
							<div className="flex justify-end pt-2">
								<editForm.SubmitButton className="cursor-pointer">
									{t("save")}
								</editForm.SubmitButton>
							</div>
						</form>
					</editForm.AppForm>
				</DialogContent>
			</Dialog>
		</div>
	);
}
