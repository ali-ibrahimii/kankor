import { NextRequest, NextResponse } from "next/server";
import {
	buildApprovedMessage,
	SLACK_APPROVE_INSTRUCTOR,
	SLACK_APPROVE_SCHOOL,
	type SlackMessage,
	verifySlackSignature,
} from "@/lib/slack/client";
import { createServiceRoleClient } from "@/lib/supabase/server";

type SlackInteractionPayload = {
	type: string;
	user?: { id?: string; username?: string };
	response_url?: string;
	message?: SlackMessage;
	actions?: Array<{ action_id: string; value: string }>;
};

/** Replace the original Slack message once the account is approved. */
async function updateSlackMessage(
	responseUrl: string,
	message: SlackMessage
): Promise<void> {
	await fetch(responseUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ replace_original: true, ...message }),
	}).catch(() => {
		// Best-effort — the account is already approved; a failed message
		// update shouldn't turn the interaction into an error for Slack.
	});
}

/**
 * Handles Slack interactivity — specifically the "Approve" button on the
 * school/instructor signup notifications. Verifies the request came from
 * Slack, flips the corresponding account's status to `active`, then swaps the
 * button out for an "approved" note.
 */
export async function POST(request: NextRequest) {
	const rawBody = await request.text();

	if (
		!verifySlackSignature(
			rawBody,
			request.headers.get("x-slack-request-timestamp"),
			request.headers.get("x-slack-signature")
		)
	) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	const encoded = new URLSearchParams(rawBody).get("payload");
	if (!encoded) {
		return NextResponse.json({ error: "Missing payload" }, { status: 400 });
	}

	let payload: SlackInteractionPayload;
	try {
		payload = JSON.parse(encoded) as SlackInteractionPayload;
	} catch {
		return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
	}

	const action = payload.actions?.[0];
	if (!action) {
		return NextResponse.json({ ok: true });
	}

	const admin = createServiceRoleClient();
	let ok = false;

	if (action.action_id === SLACK_APPROVE_SCHOOL) {
		const { error } = await admin
			.from("schools")
			.update({ status: "active" })
			.eq("id", action.value);
		ok = !error;
	} else if (action.action_id === SLACK_APPROVE_INSTRUCTOR) {
		const { error } = await admin
			.from("profiles")
			.update({ instructor_status: "active" })
			.eq("id", action.value);
		ok = !error;
	} else {
		return NextResponse.json({ ok: true, skipped: "unknown-action" });
	}

	if (!ok) {
		return NextResponse.json(
			{ error: "Failed to approve account" },
			{ status: 500 }
		);
	}

	if (payload.response_url && payload.message) {
		await updateSlackMessage(
			payload.response_url,
			buildApprovedMessage(
				payload.message,
				payload.user?.id ?? payload.user?.username ?? "admin"
			)
		);
	}

	return NextResponse.json({ ok: true });
}
