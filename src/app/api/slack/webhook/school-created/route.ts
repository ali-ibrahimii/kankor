import { NextRequest, NextResponse } from "next/server";
import {
	buildSchoolCreatedMessage,
	isSlackConfigured,
	postSlackMessage,
	verifyDbWebhookSecret,
} from "@/lib/slack/client";
import type { SupabaseWebhookPayload } from "@/lib/slack/webhook.types";
import type { Tables } from "@/lib/supabase/database.types";

type Payload = SupabaseWebhookPayload<Tables<"schools">>;

/**
 * Supabase database webhook on `public.schools`. Fires when a school is
 * registered and — while it's still pending approval — posts a notification
 * (with an Approve button) into Slack so an admin can verify it manually.
 */
export async function POST(request: NextRequest) {
	if (!verifyDbWebhookSecret(request.headers.get("x-webhook-secret"))) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = (await request.json().catch(() => null)) as Payload | null;
	const school = payload?.record;

	if (!school) {
		return NextResponse.json({ ok: true, skipped: "no-record" });
	}

	// Only notify while the school still needs approval.
	if (school.status === "active") {
		return NextResponse.json({ ok: true, skipped: "already-active" });
	}

	// On UPDATE, avoid re-notifying unless the status actually changed.
	if (
		payload?.type === "UPDATE" &&
		payload.old_record.status === school.status
	) {
		return NextResponse.json({ ok: true, skipped: "no-relevant-change" });
	}

	if (!isSlackConfigured()) {
		return NextResponse.json({ ok: true, skipped: "slack-not-configured" });
	}

	const sent = await postSlackMessage(
		buildSchoolCreatedMessage({
			id: school.id,
			name: school.name,
			adminEmail: school.admin_email,
			address: school.address,
		})
	);

	return NextResponse.json({ ok: true, sent });
}
