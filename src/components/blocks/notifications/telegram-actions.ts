"use server";

import { randomUUID } from "node:crypto";
import { serverEnv } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

async function requireUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return { supabase, user };
}

export async function createTelegramLinkToken(): Promise<
	Result<{ deepLink: string }>
> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };
	if (!serverEnv.telegram.botUsername) {
		return { success: false, error: "Telegram is not configured" };
	}

	const token = randomUUID();
	const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString();

	const { error } = await supabase.from("telegram_link_tokens").insert({
		user_id: user.id,
		token,
		expires_at: expiresAt,
	});
	if (error) return { success: false, error: error.message };

	return {
		success: true,
		data: {
			deepLink: `https://t.me/${serverEnv.telegram.botUsername}?start=${token}`,
		},
	};
}

export async function disconnectTelegram(): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("profiles")
		.update({ telegram_chat_id: null, telegram_linked_at: null })
		.eq("id", user.id);
	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}
