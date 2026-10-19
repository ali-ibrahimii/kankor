import type { createServiceRoleClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createServiceRoleClient>;

type NotificationRow = {
	id: string;
	user_id: string;
	title: string;
	message: string | null;
};

function formatMessage(title: string, message: string | null) {
	return message ? `${title}\n\n${message}` : title;
}

async function sendTelegramMessage(
	botToken: string,
	chatId: number,
	text: string
): Promise<boolean> {
	const response = await fetch(
		`https://api.telegram.org/bot${botToken}/sendMessage`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ chat_id: chatId, text }),
		}
	).catch(() => null);

	return !!response?.ok;
}

/**
 * Shared by both the reconciliation cron (batch of pending rows) and the
 * notification-created webhook (a single row) — same delivery logic either
 * way, just a different-sized `notifications` array.
 */
export async function deliverTelegramNotifications(
	admin: AdminClient,
	botToken: string,
	notifications: NotificationRow[]
): Promise<{ processed: number; delivered: number; skipped: number }> {
	if (notifications.length === 0) {
		return { processed: 0, delivered: 0, skipped: 0 };
	}

	const userIds = [...new Set(notifications.map((n) => n.user_id))];
	const { data: profiles } = await admin
		.from("profiles")
		.select("id, telegram_chat_id")
		.in("id", userIds);

	const chatIdByUser = new Map(
		(profiles ?? []).map((p) => [p.id, p.telegram_chat_id])
	);

	let delivered = 0;
	let skipped = 0;
	const processedIds: string[] = [];

	for (const notification of notifications) {
		const chatId = chatIdByUser.get(notification.user_id);
		if (chatId) {
			const ok = await sendTelegramMessage(
				botToken,
				chatId,
				formatMessage(notification.title, notification.message)
			);
			if (ok) delivered += 1;
		} else {
			skipped += 1;
		}
		// Mark processed whether or not the user has Telegram linked, so we
		// don't re-scan the same rows forever — this column tracks "handled",
		// not strictly "delivered".
		processedIds.push(notification.id);
	}

	await admin
		.from("notifications")
		.update({ telegram_delivered_at: new Date().toISOString() })
		.in("id", processedIds);

	return { processed: notifications.length, delivered, skipped };
}
