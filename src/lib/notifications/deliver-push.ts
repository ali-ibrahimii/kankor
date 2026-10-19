import type { Messaging } from "firebase-admin/messaging";
import type { createServiceRoleClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createServiceRoleClient>;

type NotificationRow = {
	id: string;
	user_id: string;
	title: string;
	message: string | null;
};

const STALE_TOKEN_ERROR_CODES = new Set([
	"messaging/registration-token-not-registered",
	"messaging/invalid-registration-token",
]);

/**
 * Shared by both the reconciliation cron (batch of pending rows) and the
 * notification-created webhook (a single row) — same delivery logic either
 * way, just a different-sized `notifications` array.
 */
export async function deliverPushNotifications(
	admin: AdminClient,
	messaging: Messaging,
	notifications: NotificationRow[]
): Promise<{
	processed: number;
	delivered: number;
	skipped: number;
	pruned: number;
}> {
	if (notifications.length === 0) {
		return { processed: 0, delivered: 0, skipped: 0, pruned: 0 };
	}

	const userIds = [...new Set(notifications.map((n) => n.user_id))];
	const { data: tokenRows } = await admin
		.from("fcm_tokens")
		.select("token, user_id")
		.in("user_id", userIds);

	const tokensByUser = new Map<string, string[]>();
	for (const row of tokenRows ?? []) {
		const list = tokensByUser.get(row.user_id) ?? [];
		list.push(row.token);
		tokensByUser.set(row.user_id, list);
	}

	let delivered = 0;
	let skipped = 0;
	const staleTokens = new Set<string>();
	const processedIds: string[] = [];

	for (const notification of notifications) {
		const tokens = tokensByUser.get(notification.user_id);
		if (!tokens || tokens.length === 0) {
			skipped += 1;
			processedIds.push(notification.id);
			continue;
		}

		const response = await messaging.sendEachForMulticast({
			tokens,
			notification: {
				title: notification.title,
				...(notification.message ? { body: notification.message } : {}),
			},
		});

		response.responses.forEach((res, index) => {
			if (res.success) {
				delivered += 1;
			} else if (res.error && STALE_TOKEN_ERROR_CODES.has(res.error.code)) {
				staleTokens.add(tokens[index]);
			}
		});

		processedIds.push(notification.id);
	}

	if (staleTokens.size > 0) {
		await admin
			.from("fcm_tokens")
			.delete()
			.in("token", [...staleTokens]);
	}

	await admin
		.from("notifications")
		.update({ push_delivered_at: new Date().toISOString() })
		.in("id", processedIds);

	return {
		processed: notifications.length,
		delivered,
		skipped,
		pruned: staleTokens.size,
	};
}
