import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server-env";
import { deliverTelegramNotifications } from "@/lib/notifications/deliver-telegram";
import { createServiceRoleClient } from "@/lib/supabase/server";

const BATCH_SIZE = 50;

/**
 * Reconciliation fallback: the notifications_webhook Postgres trigger
 * (supabase/migrations/20260712143835_notifications_webhook.sql) delivers
 * new notifications instantly, but pg_net webhook calls are fire-and-forget
 * with no automatic retry. This cron re-scans for anything still missing
 * telegram_delivered_at — whether the webhook failed, wasn't configured yet,
 * or the row was inserted before the trigger existed — so nothing is lost,
 * just delayed until the next tick.
 */
export async function GET(request: NextRequest) {
	if (!serverEnv.cron.secret) {
		return NextResponse.json(
			{ error: "Cron is not configured" },
			{ status: 503 }
		);
	}
	if (
		request.headers.get("authorization") !== `Bearer ${serverEnv.cron.secret}`
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	if (!serverEnv.telegram.botToken) {
		return NextResponse.json({ processed: 0, delivered: 0, skipped: 0 });
	}

	const admin = createServiceRoleClient();

	const { data: notifications, error } = await admin
		.from("notifications")
		.select("id, user_id, title, message")
		.is("telegram_delivered_at", null)
		.order("created_at", { ascending: true })
		.limit(BATCH_SIZE);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const result = await deliverTelegramNotifications(
		admin,
		serverEnv.telegram.botToken,
		notifications ?? []
	);

	return NextResponse.json(result);
}
