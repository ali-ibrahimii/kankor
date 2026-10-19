import { NextRequest, NextResponse } from "next/server";
import {
	buildInstructorSignupMessage,
	isSlackConfigured,
	postSlackMessage,
	verifyDbWebhookSecret,
} from "@/lib/slack/client";
import type { SupabaseWebhookPayload } from "@/lib/slack/webhook.types";
import type { Tables } from "@/lib/supabase/database.types";

type Payload = SupabaseWebhookPayload<Tables<"profiles">>;

/**
 * Supabase database webhook on `public.profiles`. Fires when an instructor
 * account is created or updated and — while it's still pending approval —
 * posts a notification (with an Approve button) into Slack so an admin can
 * verify it manually.
 */
export async function POST(request: NextRequest) {
	if (!verifyDbWebhookSecret(request.headers.get("x-webhook-secret"))) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = (await request.json().catch(() => null)) as Payload | null;
	const profile = payload?.record;

	if (!profile || profile.role !== "instructor") {
		return NextResponse.json({ ok: true, skipped: "not-instructor" });
	}

	// Only notify while the account still needs approval.
	if (profile.instructor_status === "active") {
		return NextResponse.json({ ok: true, skipped: "already-active" });
	}

	// On UPDATE, avoid re-notifying unless the account just became a pending
	// instructor (role or status changed into this state).
	if (payload?.type === "UPDATE") {
		const prev = payload.old_record;
		const becameInstructor = prev.role !== "instructor";
		const statusChanged = prev.instructor_status !== profile.instructor_status;
		if (!becameInstructor && !statusChanged) {
			return NextResponse.json({ ok: true, skipped: "no-relevant-change" });
		}
	}

	if (!isSlackConfigured()) {
		return NextResponse.json({ ok: true, skipped: "slack-not-configured" });
	}

	const sent = await postSlackMessage(
		buildInstructorSignupMessage({
			id: profile.id,
			fullName: profile.full_name,
			email: profile.email,
			phone: profile.phone,
		})
	);

	return NextResponse.json({ ok: true, sent });
}
