"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { Database } from "@/lib/supabase/database.types";
import type { TableRow as DbRow } from "@/types/db.types";
import { removeSchoolMember, setSchoolMemberRole } from "./actions";
import { ConfirmDialog } from "./confirm-dialog";
import { ListPagination } from "./list-pagination";
import { ListSearchInput } from "./list-search-input";
import { type SimpleColumn, SimpleDataTable } from "./simple-data-table";

type MemberRow = DbRow<"admin_school_members_view">;
type SchoolMemberRole = Database["public"]["Enums"]["school_member_role"];

const MEMBER_ROLES: SchoolMemberRole[] = [
	"owner",
	"admin",
	"instructor",
	"manager",
	"staff",
	"viewer",
];

/** Members tab of the admin school detail page. */
export function SchoolMembersTable({ schoolId }: { schoolId: string }) {
	const t = useTranslations("admin.members");
	const queryClient = useQueryClient();
	const [removeTarget, setRemoveTarget] = React.useState<MemberRow | null>(
		null
	);

	const query = useQueryFilters<"admin_school_members_view">({
		table: "admin_school_members_view",
		selectColumns:
			"id, school_id, user_id, role, created_at, full_name, email, phone, avatar_url",
		searchColumns: ["full_name", "email"],
		initialState: {
			name: "admin-school-members",
			filters: [{ field: "school_id", operator: "eq", value: schoolId }],
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 10 },
		},
	});

	const members = query.data?.data ?? [];
	const total = query.data?.count ?? null;
	const page = query.state.pagination?.page ?? 1;
	const pageSize = query.state.pagination?.pageSize ?? 10;

	function invalidate() {
		queryClient.invalidateQueries({
			queryKey: ["admin_school_members_view"],
		});
	}

	async function handleRoleChange(member: MemberRow, role: SchoolMemberRole) {
		if (!member.id || member.role === role) return;
		const result = await setSchoolMemberRole(member.id, role);
		if (result.success) {
			toast.success(t("roleChanged"));
			invalidate();
		} else {
			toast.error(result.error);
		}
	}

	async function handleRemove() {
		if (!removeTarget?.id) return;
		const result = await removeSchoolMember(removeTarget.id);
		if (result.success) {
			toast.success(t("removed"));
			invalidate();
		} else {
			toast.error(result.error);
		}
		setRemoveTarget(null);
	}

	const columns: SimpleColumn<MemberRow>[] = [
		{
			key: "member",
			header: t("table.member"),
			cell: (row) => (
				<div className="flex items-center gap-2.5">
					<Avatar className="size-8">
						<AvatarImage src={row.avatar_url ?? undefined} />
						<AvatarFallback>
							{(row.full_name ?? "?").slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex min-w-0 flex-col">
						<span className="truncate font-medium">
							{row.full_name ?? t("unnamed")}
						</span>
						<span className="truncate text-xs text-muted-foreground">
							{row.email}
						</span>
					</div>
				</div>
			),
		},
		{
			key: "role",
			header: t("table.role"),
			cell: (row) => (
				<Badge variant="outline">{t(`roles.${row.role ?? "viewer"}`)}</Badge>
			),
		},
		{
			key: "joined",
			header: t("table.joined"),
			className: "text-sm text-muted-foreground",
			cell: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
		},
		{
			key: "actions",
			header: null,
			className: "w-12 text-end",
			cell: (row) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon-sm" aria-label={t("openMenu")}>
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							{t("changeRole")}
						</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							value={row.role ?? undefined}
							onValueChange={(role) =>
								handleRoleChange(row, role as SchoolMemberRole)
							}
						>
							{MEMBER_ROLES.map((role) => (
								<DropdownMenuRadioItem key={role} value={role}>
									{t(`roles.${role}`)}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onSelect={() => setRemoveTarget(row)}
						>
							<UserMinus className="size-4" />
							{t("remove")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
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
				rows={members}
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
			<ConfirmDialog
				open={!!removeTarget}
				onOpenChange={(open) => !open && setRemoveTarget(null)}
				title={t("removeTitle")}
				description={t("removeDescription", {
					name: removeTarget?.full_name ?? "",
				})}
				onConfirm={handleRemove}
			/>
		</div>
	);
}
