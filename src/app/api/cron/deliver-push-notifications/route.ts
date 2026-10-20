import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server-env";
import { getFirebaseAdminMessaging } from "@/lib/firebase/admin";
import { deliverPushNotifications } from "@/lib/notifications/deliver-push";
import { requireBearerSecret } from "@/lib/security/guard";
import { createServiceRoleClient } from "@/lib/supabase/server";

const BATCH_SIZE = 50;

/**
 * Reconciliation fallback: same role as deliver-telegram-notifications — the
 * notifications_webhook Postgres trigger delivers new notifications
 * instantly, this cron re-scans for anything still missing
 * push_delivered_at in case a webhook call failed or wasn't configured yet.
 */
export async function GET(request: NextRequest) {
	const denied = requireBearerSecret(request, serverEnv.cron.secret, {
		serviceName: "Cron",
	});
	if (denied) return denied;

	const messaging = getFirebaseAdminMessaging();
	if (!messaging) {
		return NextResponse.json({
			processed: 0,
			delivered: 0,
			skipped: 0,
			pruned: 0,
		});
	}

	const admin = createServiceRoleClient();

	const { data: notifications, error } = await admin
		.from("notifications")
		.select("id, user_id, title, message")
		.is("push_delivered_at", null)
		.order("created_at", { ascending: true })
		.limit(BATCH_SIZE);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const result = await deliverPushNotifications(
		admin,
		messaging,
		notifications ?? []
	);

	return NextResponse.json(result);
}
