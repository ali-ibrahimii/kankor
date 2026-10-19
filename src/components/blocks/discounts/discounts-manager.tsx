"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteDiscount, listDiscounts } from "./actions";
import { DiscountDialog } from "./discount-dialog";
import { DiscountsList } from "./discounts-list";
import type { DiscountRow } from "./types";

export interface DiscountsManagerProps {
	/** Which discounts to show/create for — omit for admin platform-wide oversight. */
	owner?: { profileId: string } | { schoolId: string };
	/** Only true on the admin page — allows creating scope:"all" discounts. */
	canCreateGlobal?: boolean;
	/** Show the owner-type column (admin oversight view). */
	showOwner?: boolean;
}

export function DiscountsManager({
	owner,
	canCreateGlobal = false,
	showOwner = false,
}: DiscountsManagerProps) {
	const t = useTranslations("discounts.list");
	const queryClient = useQueryClient();
	const queryKey = [
		"discounts",
		owner && "profileId" in owner ? owner.profileId : undefined,
		owner && "schoolId" in owner ? owner.schoolId : undefined,
	];

	const { data, isLoading } = useQuery({
		queryKey,
		queryFn: async () => {
			const result = await listDiscounts(owner);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
	});

	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [editingDiscount, setEditingDiscount] =
		React.useState<DiscountRow | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<DiscountRow | null>(
		null
	);
	const [deletingId, setDeletingId] = React.useState<string | null>(null);

	const schoolId = owner && "schoolId" in owner ? owner.schoolId : undefined;

	function handleCreate() {
		setEditingDiscount(null);
		setDialogOpen(true);
	}

	function handleEdit(discount: DiscountRow) {
		setEditingDiscount(discount);
		setDialogOpen(true);
	}

	function handleSaved() {
		queryClient.invalidateQueries({ queryKey: ["discounts"] });
	}

	async function handleConfirmDelete() {
		if (!deleteTarget) return;
		setDeletingId(deleteTarget.id);
		try {
			const result = await deleteDiscount(deleteTarget.id);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(t("deleted"));
			queryClient.invalidateQueries({ queryKey: ["discounts"] });
		} finally {
			setDeletingId(null);
			setDeleteTarget(null);
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button size="sm" onClick={handleCreate}>
					<PlusIcon className="size-4" />
					{t("newDiscount")}
				</Button>
			</div>

			<DiscountsList
				discounts={data ?? []}
				isLoading={isLoading}
				onEdit={handleEdit}
				onDelete={setDeleteTarget}
				deletingId={deletingId}
				showOwner={showOwner}
			/>

			<DiscountDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				schoolId={schoolId}
				canCreateGlobal={canCreateGlobal}
				editingDiscount={editingDiscount}
				onSaved={handleSaved}
			/>

			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteConfirmDescription", {
								code: deleteTarget?.code ?? "",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmDelete}>
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
