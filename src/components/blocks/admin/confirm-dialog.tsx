"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog as BaseConfirmDialog } from "@/components/ui/confirm-dialog";

/** Shared destructive-action confirmation dialog for admin tables. */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	onConfirm: () => void;
}) {
	const t = useTranslations("admin.common");

	return (
		<BaseConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			description={description}
			onConfirm={onConfirm}
			confirmText={t("confirm")}
			cancelText={t("cancel")}
			variant="destructive"
		/>
	);
}
