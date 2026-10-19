import crypto from "node:crypto";
import { serverEnv } from "@/lib/env/server-env";

/**
 * Slack integration for the manual account-approval flow.
 *
 * When a school is created or an instructor signs up, a Supabase database
 * webhook calls our `/api/slack/webhook/*` routes, which post a Block Kit
 * message (with an "Approve" button) into the abzarkankor Slack channel using
 * an Incoming Webhook. Clicking Approve makes Slack POST the interaction back
 * to `/api/slack/interactions`, which flips the account status to `active`.
 */

/** action_id values on the Approve buttons — routed on in the interactions handler. */
export const SLACK_APPROVE_SCHOOL = "approve_school" as const;
export const SLACK_APPROVE_INSTRUCTOR = "approve_instructor" as const;

// Minimal Block Kit typing — enough for the messages we build here.
type SlackBlock = Record<string, unknown>;
export type SlackMessage = {
	text: string;
	blocks: SlackBlock[];
};

/** True when an Incoming Webhook URL is configured. */
export function isSlackConfigured(): boolean {
	return Boolean(serverEnv.slack.webhookUrl);
}

/**
 * Post a message to the abzarkankor channel via the configured Incoming
 * Webhook. Best-effort: returns `false` (without throwing) when Slack is not
 * configured or the request fails, so a Slack outage never fails the caller.
 */
export async function postSlackMessage(
	message: SlackMessage
): Promise<boolean> {
	const url = serverEnv.slack.webhookUrl;
	if (!url) return false;

	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(message),
		});
		return res.ok;
	} catch {
		return false;
	}
}

// ─── Message builders ─────────────────────────────────────────────────────────

function approveButton(actionId: string, value: string): SlackBlock {
	return {
		type: "actions",
		elements: [
			{
				type: "button",
				text: { type: "plain_text", text: "Approve", emoji: true },
				style: "primary",
				action_id: actionId,
				value,
				confirm: {
					title: { type: "plain_text", text: "Approve account?" },
					text: {
						type: "mrkdwn",
						text: "This grants the account full access. Continue?",
					},
					confirm: { type: "plain_text", text: "Approve" },
					deny: { type: "plain_text", text: "Cancel" },
				},
			},
		],
	};
}

function fieldsSection(fields: Array<[string, string]>): SlackBlock {
	return {
		type: "section",
		fields: fields.map(([label, value]) => ({
			type: "mrkdwn",
			text: `*${label}:*\n${value || "—"}`,
		})),
	};
}

export function buildInstructorSignupMessage(instructor: {
	id: string;
	fullName: string | null;
	email: string | null;
	phone: string | null;
}): SlackMessage {
	const name = instructor.fullName || instructor.email || "New instructor";
	return {
		text: `New instructor pending approval: ${name}`,
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: "🧑‍🏫 New instructor signup",
					emoji: true,
				},
			},
			fieldsSection([
				["Name", instructor.fullName ?? ""],
				["Email", instructor.email ?? ""],
				["Phone", instructor.phone ?? ""],
				["Profile ID", instructor.id],
			]),
			approveButton(SLACK_APPROVE_INSTRUCTOR, instructor.id),
		],
	};
}

export function buildSchoolCreatedMessage(school: {
	id: string;
	name: string | null;
	adminEmail: string | null;
	address: string | null;
}): SlackMessage {
	const name = school.name || "New school";
	return {
		text: `New school pending approval: ${name}`,
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: "🏫 New school registration",
					emoji: true,
				},
			},
			fieldsSection([
				["Name", school.name ?? ""],
				["Admin email", school.adminEmail ?? ""],
				["Address", school.address ?? ""],
				["School ID", school.id],
			]),
			approveButton(SLACK_APPROVE_SCHOOL, school.id),
		],
	};
}

/** Replacement blocks shown after someone clicks Approve, via `response_url`. */
export function buildApprovedMessage(
	original: SlackMessage,
	approvedBy: string
): SlackMessage {
	const keptBlocks = original.blocks.filter(
		(block) => (block as { type?: string }).type !== "actions"
	);
	return {
		text: original.text,
		blocks: [
			...keptBlocks,
			{
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: `✅ Approved by <@${approvedBy}> on ${new Date().toISOString().slice(0, 10)}`,
					},
				],
			},
		],
	};
}

/**
 * Guard for the Supabase database webhooks that trigger the Slack
 * notifications. When `SLACK_DB_WEBHOOK_SECRET` is set, the database webhook
 * must send it as an `x-webhook-secret` header. Returns `true` when no secret
 * is configured so local/dev setups aren't blocked.
 */
export function verifyDbWebhookSecret(header: string | null): boolean {
	const secret = serverEnv.slack.dbWebhookSecret;
	if (!secret) return true;
	if (!header) return false;
	const a = Buffer.from(header);
	const b = Buffer.from(secret);
	return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ─── Request signature verification ───────────────────────────────────────────

/**
 * Verify an interactivity request actually came from Slack, using the app's
 * signing secret. Follows Slack's v0 signing scheme. Returns `true` when no
 * signing secret is configured (dev), so local testing isn't blocked — set
 * `SLACK_SIGNING_SECRET` in production to enforce verification.
 *
 * @see https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function verifySlackSignature(
	rawBody: string,
	timestamp: string | null,
	signature: string | null
): boolean {
	const secret = serverEnv.slack.signingSecret;
	if (!secret) return true;
	if (!timestamp || !signature) return false;

	// Reject requests older than 5 minutes to prevent replay attacks.
	const age = Math.abs(Date.now() / 1000 - Number(timestamp));
	if (!Number.isFinite(age) || age > 60 * 5) return false;

	const basestring = `v0:${timestamp}:${rawBody}`;
	const expected = `v0=${crypto
		.createHmac("sha256", secret)
		.update(basestring)
		.digest("hex")}`;

	const a = Buffer.from(expected);
	const b = Buffer.from(signature);
	return a.length === b.length && crypto.timingSafeEqual(a, b);
}
