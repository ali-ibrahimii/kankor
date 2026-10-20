"use server";

import { guardServerAction } from "@/lib/security/action-guard";
import { createClient } from "@/lib/supabase/server";

export async function resetPasswordAction(values: { password: string }) {
	// Keyed by IP only — the session holder is already authenticated, this
	// only caps rapid password changes from a stolen session.
	const denied = await guardServerAction("reset-password", "session");
	if (!denied.ok) {
		return { error: "common.rateLimited" };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({
		password: values.password,
	});
	if (error) return { error: error.message };
	return { error: null };
}
