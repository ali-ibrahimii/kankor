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

export async function markNotificationRead(id: string): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("notifications")
		.update({ is_read: true, read_at: new Date().toISOString() })
		.eq("id", id)
		.eq("user_id", user.id);
	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}

export async function markAllNotificationsRead(): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("notifications")
		.update({ is_read: true, read_at: new Date().toISOString() })
		.eq("user_id", user.id)
		.eq("is_read", false);
	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}
