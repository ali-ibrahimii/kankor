"use client";

import { BellIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { respondToInviteNotification } from "./respond-actions";
import type { NotificationRow, NotificationType } from "./types";
import { formatRelativeTime, NOTIFICATION_TYPE_ICON } from "./utils";

const RESPONDABLE_TYPES: NotificationType[] = [
	"classroom_invite",
	"classroom_join_request",
	"school_invite",
];

export type NotificationItemProps = {
	notification: NotificationRow;
	onRead?: (id: string) => void;
	className?: string;
};

export function NotificationItem({
	notification,
	onRead,
	className,
}: NotificationItemProps) {
	const t = useTranslations("notifications");
	const locale = useLocale();
	const Icon = NOTIFICATION_TYPE_ICON[notification.type] ?? BellIcon;
	const [isResponding, setIsResponding] = useState(false);
	const [responded, setResponded] = useState(false);

	const canRespond =
		!responded &&
		!!notification.related_entity_id &&
		RESPONDABLE_TYPES.includes(notification.type);

	async function handleRespond(approve: boolean) {
		if (!notification.related_entity_id) return;
		setIsResponding(true);
		const result = await respondToInviteNotification(
			notification.type,
			notification.related_entity_id,
			approve
		);
		setIsResponding(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		setResponded(true);
		toast.success(approve ? t("requestApproved") : t("requestDeclined"));
		if (!notification.is_read) onRead?.(notification.id);
	}

	return (
		<div
			className={cn(
				"flex w-full flex-col gap-2 rounded-lg p-3 transition-colors hover:bg-muted/60",
				!notification.is_read && "bg-primary/5",
				className
			)}
		>
			<button
				type="button"
				onClick={() => {
					if (!notification.is_read) onRead?.(notification.id);
				}}
				className="flex w-full items-start gap-3 text-start"
			>
				<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<p className="line-clamp-2 text-sm font-medium leading-snug">
							{notification.title}
						</p>
						{!notification.is_read && (
							<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
						)}
					</div>
					{notification.message && (
						<p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
							{notification.message}
						</p>
					)}
					<p className="mt-1 text-[11px] text-muted-foreground">
						{formatRelativeTime(notification.created_at, locale)}
					</p>
				</div>
			</button>

			{canRespond && (
				<div className="flex gap-2 ps-12">
					<Button
						size="sm"
						disabled={isResponding}
						onClick={() => handleRespond(true)}
					>
						{t("accept")}
					</Button>
					<Button
						size="sm"
						variant="outline"
						disabled={isResponding}
						onClick={() => handleRespond(false)}
					>
						{t("decline")}
					</Button>
				</div>
			)}
		</div>
	);
}

export function NotificationItemSkeleton() {
	return (
		<div className="flex items-start gap-3 p-3">
			<Skeleton className="size-9 shrink-0 rounded-full" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-3.5 w-4/5" />
				<Skeleton className="h-3 w-3/5" />
			</div>
		</div>
	);
}
