"use server";

import { createClient } from "@/lib/supabase/server";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

async function requireUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return { supabase, user };
}

export async function registerFcmToken(
	token: string,
	userAgent?: string
): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase.from("fcm_tokens").upsert(
		{
			user_id: user.id,
			token,
			user_agent: userAgent ?? null,
			last_seen_at: new Date().toISOString(),
		},
		{ onConflict: "token" }
	);
	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}

export async function unregisterFcmToken(token: string): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("fcm_tokens")
		.delete()
		.eq("token", token)
		.eq("user_id", user.id);
	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}
