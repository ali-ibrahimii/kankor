"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/database.types";
import { setUserRole } from "./actions";

type UserRole = Database["public"]["Enums"]["user_role"];

interface RoleCellProps {
	userId: string;
	userName: string | null;
	currentRole: UserRole;
	onSuccess: () => void;
}

function roleBadgeVariant(role: UserRole): "default" | "secondary" | "outline" {
	switch (role) {
		case "admin":
			return "default";
		case "instructor":
			return "secondary";
		case "student":
		default:
			return "outline";
	}
}

export function RoleCell({
	userId,
	userName,
	currentRole,
	onSuccess,
}: RoleCellProps) {
	const t = useTranslations("admin.common");
	const [isEditing, setIsEditing] = React.useState(false);
	const [pendingRole, setPendingRole] = React.useState<UserRole | null>(null);
	const [isUpdating, setIsUpdating] = React.useState(false);

	const handleRoleSelect = (value: string) => {
		const newRole = value as UserRole;
		if (newRole === currentRole) {
			setIsEditing(false);
			return;
		}
		setPendingRole(newRole);
	};

	const handleConfirm = async () => {
		if (!pendingRole) return;
		setIsUpdating(true);
		try {
			const res = await setUserRole(userId, pendingRole);
			if (res.success) {
				toast.success(t("roleChangedSuccess"));
				onSuccess();
			} else {
				toast.error(res.error);
			}
		} catch (err: any) {
			toast.error(err?.message || "An error occurred");
		} finally {
			setIsUpdating(false);
			setPendingRole(null);
			setIsEditing(false);
		}
	};

	const handleCancel = () => {
		setPendingRole(null);
		setIsEditing(false);
	};

	if (isEditing && !pendingRole) {
		return (
			<div className="w-32">
				<Select
					value={currentRole}
					onValueChange={handleRoleSelect}
					open={true}
					onOpenChange={(open) => {
						if (!open) {
							// Delay slightly to prevent focus/race conditions
							setTimeout(() => setIsEditing(false), 150);
						}
					}}
				>
					<SelectTrigger className="h-7 w-full text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="student">{t("userRoles.student")}</SelectItem>
						<SelectItem value="instructor">
							{t("userRoles.instructor")}
						</SelectItem>
						<SelectItem value="admin">{t("userRoles.admin")}</SelectItem>
					</SelectContent>
				</Select>
			</div>
		);
	}

	return (
		<>
			<div
				onDoubleClick={() => setIsEditing(true)}
				className="group flex w-fit items-center gap-1.5 cursor-pointer select-none rounded-md px-1.5 py-1 hover:bg-muted/60 transition-colors"
				title={t("doubleClickToEdit")}
			>
				<Badge variant={roleBadgeVariant(currentRole)}>
					{t(`userRoles.${currentRole}`)}
				</Badge>
				<Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
			</div>

			{pendingRole && (
				<ConfirmDialog
					open={!!pendingRole}
					onOpenChange={(open) => {
						if (!open) handleCancel();
					}}
					title={t("changeRoleConfirmTitle")}
					description={t("changeRoleConfirmDescription", {
						name: userName || t("userRoles.student"), // or fallback
						oldRole: t(`userRoles.${currentRole}`),
						newRole: t(`userRoles.${pendingRole}`),
					})}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
					confirmText={t("confirm")}
					cancelText={t("cancel")}
					variant="warning"
					isLoading={isUpdating}
				/>
			)}
		</>
	);
}
