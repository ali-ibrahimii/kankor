"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import {
	ConfirmDialog,
	type SimpleColumn,
	SimpleDataTable,
} from "@/components/blocks/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppForm } from "@/hooks/use-form";
import { useSupabase } from "@/hooks/use-supabase";
import type { Database } from "@/lib/supabase/database.types";
import type { TableRow as DbRow } from "@/types/db.types";
import {
	addAgencyMember,
	removeAgencyMember,
	setAgencyMemberRole,
	setAgencyMemberStatus,
} from "./actions";

type MemberRow = DbRow<"agency_members_view">;
type AgencyMemberRole = Database["public"]["Enums"]["agency_member_role"];

/**
 * Agency roster. Rendered on the admin detail page (canManage, canSeatOwner)
 * and the agency dashboard members page (canManage for owner/admin members).
 */
export function AgencyMembersTable({
	agencyId,
	canManage,
	canSeatOwner = false,
}: {
	agencyId: string;
	canManage: boolean;
	canSeatOwner?: boolean;
}) {
	const t = useTranslations("admin.agencies.members");
	const queryClient = useQueryClient();
	const [addOpen, setAddOpen] = React.useState(false);
	const [removeTarget, setRemoveTarget] = React.useState<MemberRow | null>(
		null
	);

	const membersQuery = useSupabase({
		table: "agency_members_view",
		selectColumns:
			"id, agency_id, user_id, role, status, created_at, full_name, email, avatar_url",
		state: {
			filters: [{ field: "agency_id", operator: "eq", value: agencyId }],
		},
	});
	const members = membersQuery.data?.data ?? [];
	const isLoading = membersQuery.isLoading;

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: ["agency_members_view"] });
	}

	const form = useAppForm({
		defaultValues: { email: "", role: "staff" as AgencyMemberRole },
		onSubmit: async ({ value }) => {
			const result = await addAgencyMember(
				agencyId,
				value.email.trim(),
				value.role
			);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(t("added"));
			setAddOpen(false);
			form.reset();
			invalidate();
		},
	});

	async function handleRoleChange(member: MemberRow, role: AgencyMemberRole) {
		const result = await setAgencyMemberRole(member.id ?? "", role);
		if (!result.success) toast.error(result.error);
		else invalidate();
	}

	async function handleStatusToggle(member: MemberRow) {
		const result = await setAgencyMemberStatus(
			member.id ?? "",
			member.status === "active" ? "disabled" : "active"
		);
		if (!result.success) toast.error(result.error);
		else invalidate();
	}

	async function handleRemove() {
		if (!removeTarget) return;
		const result = await removeAgencyMember(removeTarget.id ?? "");
		if (!result.success) toast.error(result.error);
		else {
			toast.success(t("removed"));
			invalidate();
		}
		setRemoveTarget(null);
	}

	const roleOptions: AgencyMemberRole[] = canSeatOwner
		? ["owner", "admin", "staff"]
		: ["admin", "staff"];

	const columns: SimpleColumn<MemberRow>[] = [
		{
			key: "member",
			header: t("table.member"),
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
			key: "role",
			header: t("table.role"),
			cell: (row) => (
				<Badge variant={row.role === "owner" ? "default" : "outline"}>
					{t(`roles.${row.role ?? "staff"}` as never)}
				</Badge>
			),
		},
		{
			key: "status",
			header: t("table.status"),
			cell: (row) => (
				<Badge variant={row.status === "active" ? "outline" : "destructive"}>
					{t(`status.${row.status ?? "active"}` as never)}
				</Badge>
			),
		},
		{
			key: "joined",
			header: t("table.joined"),
			className: "text-sm text-muted-foreground",
			cell: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
		},
	];

	if (canManage) {
		columns.push({
			key: "actions",
			header: null,
			className: "w-12 text-end",
			cell: (row) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{roleOptions
							.filter((role) => role !== row.role)
							.map((role) => (
								<DropdownMenuItem
									key={role}
									onClick={() => handleRoleChange(row, role)}
								>
									{t("makeRole", { role: t(`roles.${role}` as never) })}
								</DropdownMenuItem>
							))}
						<DropdownMenuItem onClick={() => handleStatusToggle(row)}>
							{row.status === "active" ? t("disable") : t("enable")}
						</DropdownMenuItem>
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setRemoveTarget(row)}
						>
							{t("remove")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		});
	}

	return (
		<div className="space-y-4">
			{canManage && (
				<div className="flex justify-end">
					<Button size="sm" onClick={() => setAddOpen(true)}>
						<Plus className="size-4" />
						{t("add")}
					</Button>
				</div>
			)}

			<SimpleDataTable
				columns={columns}
				rows={members}
				rowKey={(row) => row.id ?? ""}
				isLoading={isLoading}
				emptyText={t("empty")}
			/>

			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("addTitle")}</DialogTitle>
					</DialogHeader>
					<form.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-4"
						>
							<form.AppField
								name="email"
								validators={{
									onBlur: z.string().email(t("validation.invalidEmail")),
								}}
							>
								{(field) => <field.TextField label={t("email")} />}
							</form.AppField>

							<form.AppField name="role">
								{(field) => (
									<field.SelectField
										label={t("table.role")}
										options={roleOptions.map((role) => ({
											label: t(`roles.${role}` as never),
											value: role,
										}))}
									/>
								)}
							</form.AppField>

							<div className="flex justify-end pt-2">
								<form.SubmitButton className="cursor-pointer">
									{t("add")}
								</form.SubmitButton>
							</div>
						</form>
					</form.AppForm>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={removeTarget !== null}
				onOpenChange={(open) => !open && setRemoveTarget(null)}
				title={t("removeTitle")}
				description={t("removeDescription", {
					name: removeTarget?.full_name ?? removeTarget?.email ?? "",
				})}
				onConfirm={handleRemove}
			/>
		</div>
	);
}
