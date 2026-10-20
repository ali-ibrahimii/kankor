import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server-env";
import { timingSafeStringEqual } from "@/lib/security/secret";
import { createServiceRoleClient } from "@/lib/supabase/server";

type TelegramUpdate = {
	message?: {
		text?: string;
		chat?: { id: number };
	};
};

async function sendTelegramMessage(chatId: number, text: string) {
	if (!serverEnv.telegram.botToken) return;

	await fetch(
		`https://api.telegram.org/bot${serverEnv.telegram.botToken}/sendMessage`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ chat_id: chatId, text }),
		}
	).catch(() => {
		// Best-effort — a failed confirmation message shouldn't fail the webhook.
	});
}

/**
 * Telegram calls this on every update sent to the bot. We only care about
 * `/start <token>` — the deep link produced by createTelegramLinkToken —
 * which links the sender's chat id to the profile that requested it.
 */
export async function POST(request: NextRequest) {
	if (!serverEnv.telegram.botToken) {
		return NextResponse.json(
			{ error: "Telegram is not configured" },
			{ status: 503 }
		);
	}

	if (serverEnv.telegram.webhookSecret) {
		const secret = request.headers.get("x-telegram-bot-api-secret-token");
		if (
			!secret ||
			!timingSafeStringEqual(secret, serverEnv.telegram.webhookSecret)
		) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
	}

	const update = (await request
		.json()
		.catch(() => null)) as TelegramUpdate | null;
	const text = update?.message?.text?.trim();
	const chatId = update?.message?.chat?.id;

	if (!text || !chatId || !text.startsWith("/start")) {
		return NextResponse.json({ ok: true });
	}

	const token = text.slice("/start".length).trim();
	if (!token) {
		await sendTelegramMessage(
			chatId,
			"Open Abzar Kankor → Notifications → Connect Telegram to link your account."
		);
		return NextResponse.json({ ok: true });
	}

	const admin = createServiceRoleClient();

	const { data: linkToken } = await admin
		.from("telegram_link_tokens")
		.select("id, user_id, expires_at, used_at")
		.eq("token", token)
		.maybeSingle();

	if (
		!linkToken ||
		linkToken.used_at ||
		new Date(linkToken.expires_at) < new Date()
	) {
		await sendTelegramMessage(
			chatId,
			"This link is invalid or has expired. Please generate a new one from Abzar Kankor."
		);
		return NextResponse.json({ ok: true });
	}

	await admin
		.from("profiles")
		.update({
			telegram_chat_id: chatId,
			telegram_linked_at: new Date().toISOString(),
		})
		.eq("id", linkToken.user_id);

	await admin
		.from("telegram_link_tokens")
		.update({ used_at: new Date().toISOString() })
		.eq("id", linkToken.id);

	await sendTelegramMessage(
		chatId,
		"You're connected! You'll now get Abzar Kankor notifications here on Telegram."
	);

	return NextResponse.json({ ok: true });
}
