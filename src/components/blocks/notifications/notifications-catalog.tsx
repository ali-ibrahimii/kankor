"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { markAllNotificationsRead, markNotificationRead } from "./actions";
import {
	NotificationItem,
	NotificationItemSkeleton,
} from "./notification-item";
import { PushNotificationCard } from "./push-notification-card";
import { TelegramConnectCard } from "./telegram-connect-card";
import type { NotificationRow } from "./types";

const NOTIFICATION_SELECT =
	"id, user_id, actor_id, type, title, message, related_entity_type, related_entity_id, is_read, read_at, created_at, updated_at";

export type NotificationsCatalogProps = {
	telegramLinked: boolean;
};

export function NotificationsCatalog({
	telegramLinked,
}: NotificationsCatalogProps) {
	const t = useTranslations("notifications");
	const queryClient = useQueryClient();

	const notificationsQuery = useQueryFilters<
		"notifications",
		NotificationRow[]
	>({
		table: "notifications",
		selectColumns: NOTIFICATION_SELECT,
		initialState: {
			name: "notifications",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 15 },
		},
	});

	const notifications = (notificationsQuery.data as any)?.data ?? [];
	const total = (notificationsQuery.data as any)?.count ?? null;
	const page = notificationsQuery.state.pagination?.page ?? 1;
	const pageSize = notificationsQuery.state.pagination?.pageSize ?? 15;

	const isUnreadTab = (notificationsQuery.state.filters ?? []).some(
		(f) => f.field === "is_read"
	);

	function setTab(tab: string) {
		if (tab === "unread") {
			notificationsQuery.setFilter({
				field: "is_read",
				operator: "eq",
				value: false,
			});
		} else {
			notificationsQuery.removeFilter("is_read");
		}
	}

	async function handleRead(id: string) {
		await markNotificationRead(id);
		queryClient.invalidateQueries({ queryKey: ["notifications"] });
	}

	async function handleMarkAllRead() {
		await markAllNotificationsRead();
		queryClient.invalidateQueries({ queryKey: ["notifications"] });
	}

	return (
		<div className="flex flex-col gap-4">
			<TelegramConnectCard initiallyLinked={telegramLinked} />
			<PushNotificationCard />

			<div className="flex items-center justify-between gap-3">
				<Tabs value={isUnreadTab ? "unread" : "all"} onValueChange={setTab}>
					<TabsList>
						<TabsTrigger value="all">{t("all")}</TabsTrigger>
						<TabsTrigger value="unread">{t("unread")}</TabsTrigger>
					</TabsList>
				</Tabs>
				<Button variant="outline" size="sm" onClick={handleMarkAllRead}>
					{t("markAllRead")}
				</Button>
			</div>

			{notificationsQuery.isError ? (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 py-20 text-center">
					<p className="text-sm font-medium">{t("loadError")}</p>
					<p className="text-xs text-muted-foreground">
						{t("loadErrorDescription")}
					</p>
					<Button
						size="sm"
						variant="outline"
						onClick={() => notificationsQuery.refetch()}
					>
						{t("tryAgain")}
					</Button>
				</div>
			) : notificationsQuery.isFetching && notifications.length === 0 ? (
				<div className="flex flex-col gap-1 rounded-xl border bg-background">
					{Array.from({ length: 6 }).map((_, i) => (
						<NotificationItemSkeleton key={i} />
					))}
				</div>
			) : notifications.length === 0 ? (
				<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 py-20 text-center">
					<p className="text-sm font-medium">
						{isUnreadTab ? t("noUnreadNotifications") : t("noNotifications")}
					</p>
					<p className="text-xs text-muted-foreground">
						{t("noNotificationsDescription")}
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-1 rounded-xl border bg-background">
					{notifications.map((notification: NotificationRow) => (
						<NotificationItem
							key={notification.id}
							notification={notification}
							onRead={handleRead}
						/>
					))}
				</div>
			)}

			{!!total && total > pageSize && (
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						{t("showing", {
							from: (page - 1) * pageSize + 1,
							to: Math.min(page * pageSize, total),
							total,
						})}
					</span>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={() =>
								notificationsQuery.setPagination({ page: page - 1 })
							}
						>
							{t("previous")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page * pageSize >= total}
							onClick={() =>
								notificationsQuery.setPagination({ page: page + 1 })
							}
						>
							{t("next")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
