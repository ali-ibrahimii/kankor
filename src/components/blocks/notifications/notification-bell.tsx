"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { markAllNotificationsRead, markNotificationRead } from "./actions";
import {
	NotificationItem,
	NotificationItemSkeleton,
} from "./notification-item";
import type { NotificationRow } from "./types";

const RECENT_LIMIT = 8;
const POLL_INTERVAL_MS = 30_000;

async function fetchRecentNotifications() {
	const client = createClient();
	const [{ data: recent, error: recentError }, { count, error: countError }] =
		await Promise.all([
			client
				.from("notifications")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(RECENT_LIMIT),
			client
				.from("notifications")
				.select("id", { count: "exact", head: true })
				.eq("is_read", false),
		]);

	if (recentError) throw recentError;
	if (countError) throw countError;

	return {
		recent: (recent ?? []) as NotificationRow[],
		unreadCount: count ?? 0,
	};
}

export type NotificationBellProps = {
	notificationsHref: string;
};

export function NotificationBell({ notificationsHref }: NotificationBellProps) {
	const t = useTranslations("notifications");
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["notifications", "recent"],
		queryFn: fetchRecentNotifications,
		refetchInterval: POLL_INTERVAL_MS,
	});

	const recent = data?.recent ?? [];
	const unreadCount = data?.unreadCount ?? 0;

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: ["notifications"] });
	}

	async function handleRead(id: string) {
		await markNotificationRead(id);
		invalidate();
	}

	async function handleMarkAllRead() {
		await markAllNotificationsRead();
		invalidate();
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className="relative text-muted-foreground"
				>
					<BellIcon className="size-4" />
					{unreadCount > 0 && (
						<span className="absolute inset-e-1.5 top-1.5 size-1.5 rounded-full bg-[#1461B8]" />
					)}
					<span className="sr-only">{t("title")}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 gap-0 p-0">
				<div className="flex items-center justify-between gap-2 p-3">
					<p className="text-sm font-semibold">{t("title")}</p>
					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
							onClick={handleMarkAllRead}
						>
							{t("markAllRead")}
						</Button>
					)}
				</div>
				<Separator />
				<ScrollArea className="max-h-96">
					<div className="flex flex-col gap-1 p-2">
						{isLoading ? (
							Array.from({ length: 4 }).map((_, i) => (
								<NotificationItemSkeleton key={i} />
							))
						) : recent.length === 0 ? (
							<p className="p-6 text-center text-sm text-muted-foreground">
								{t("noNotifications")}
							</p>
						) : (
							recent.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									onRead={handleRead}
								/>
							))
						)}
					</div>
				</ScrollArea>
				<Separator />
				<Link
					href={notificationsHref}
					onClick={() => setOpen(false)}
					className="block p-3 text-center text-sm font-medium text-primary hover:underline"
				>
					{t("viewAll")}
				</Link>
			</PopoverContent>
		</Popover>
	);
}
