"use client";

import {
	BadgeCheck,
	Ban,
	CircleCheck,
	CircleX,
	MoreHorizontal,
	PauseCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	setInstructorStatus,
	setSchoolStatus,
	setStudentStatus,
} from "./actions";
import {
	type AccountStatus,
	getStatusActions,
	isDestructiveAction,
	STATUS_ACTION_TARGET,
	type StatusAction,
} from "./status.utils";

const ACTION_ICONS: Record<StatusAction, React.ElementType> = {
	verify: BadgeCheck,
	activate: CircleCheck,
	suspend: PauseCircle,
	disable: Ban,
	reject: CircleX,
};

export type StatusEntity = {
	kind: "instructor" | "school" | "student";
	id: string;
	status: AccountStatus | null;
};

/**
 * Row/detail actions dropdown for an instructor or school account.
 * Renders the status transitions valid for the current status (verify,
 * activate, suspend, disable, reject) plus any extra items passed as
 * children (e.g. a "view details" link).
 */
export function StatusActionsMenu({
	entity,
	onChanged,
	children,
}: React.PropsWithChildren<{
	entity: StatusEntity;
	/** Called after a successful status change (invalidate/refresh here). */
	onChanged?: (status: AccountStatus) => void;
}>) {
	const t = useTranslations("admin.actions");
	const [isPending, startTransition] = React.useTransition();

	const actions = getStatusActions(entity.status);

	function handleAction(action: StatusAction) {
		const target = STATUS_ACTION_TARGET[action];

		startTransition(async () => {
			const result =
				entity.kind === "instructor"
					? await setInstructorStatus(entity.id, target)
					: entity.kind === "student"
						? await setStudentStatus(entity.id, target)
						: await setSchoolStatus(entity.id, target);

			if (result.success) {
				toast.success(t("statusChanged"));
				onChanged?.(target);
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					disabled={isPending}
					aria-label={t("openMenu")}
				>
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{children}
				{children && actions.length > 0 && <DropdownMenuSeparator />}
				{actions.length > 0 && (
					<DropdownMenuLabel className="text-xs text-muted-foreground">
						{t("statusLabel")}
					</DropdownMenuLabel>
				)}
				{actions.map((action) => {
					const Icon = ACTION_ICONS[action];
					return (
						<DropdownMenuItem
							key={action}
							variant={isDestructiveAction(action) ? "destructive" : "default"}
							disabled={isPending}
							onSelect={() => handleAction(action)}
						>
							<Icon className="size-4" />
							{t(action)}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
