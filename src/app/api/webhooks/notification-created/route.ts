import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server-env";
import { getFirebaseAdminMessaging } from "@/lib/firebase/admin";
import { deliverPushNotifications } from "@/lib/notifications/deliver-push";
import { deliverTelegramNotifications } from "@/lib/notifications/deliver-telegram";
import { createServiceRoleClient } from "@/lib/supabase/server";

type NotificationInsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: {
		id: string;
		user_id: string;
		title: string;
		message: string | null;
	};
	old_record: null;
};

/**
 * Called by the notifications_webhook Postgres trigger
 * (supabase/migrations/20260712143835_notifications_webhook.sql) the instant
 * a row is inserted into `notifications`, so Telegram/push delivery happens
 * immediately instead of waiting for the next cron tick. The two
 * /api/cron/deliver-*-notifications routes stay in place as a lower-frequency
 * fallback since this call is fire-and-forget with no automatic retry.
 */
export async function POST(request: NextRequest) {
	if (!serverEnv.cron.secret) {
		return NextResponse.json(
			{ error: "Webhook is not configured" },
			{ status: 503 }
		);
	}
	if (
		request.headers.get("authorization") !== `Bearer ${serverEnv.cron.secret}`
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = (await request.json()) as NotificationInsertPayload;
	const notification = payload.record;
	if (!notification?.id || !notification.user_id || !notification.title) {
		return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
	}

	const admin = createServiceRoleClient();

	const [telegram, push] = await Promise.all([
		serverEnv.telegram.botToken
			? deliverTelegramNotifications(admin, serverEnv.telegram.botToken, [
					notification,
				])
			: { processed: 0, delivered: 0, skipped: 0 },
		(async () => {
			const messaging = getFirebaseAdminMessaging();
			return messaging
				? deliverPushNotifications(admin, messaging, [notification])
				: { processed: 0, delivered: 0, skipped: 0, pruned: 0 };
		})(),
	]);

	return NextResponse.json({ telegram, push });
}
