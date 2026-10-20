"use server";

import { serverEnv } from "@/lib/env/server-env";
import { guardServerAction } from "@/lib/security/action-guard";
import { createClient } from "@/lib/supabase/server";

export async function forgotPasswordAction(values: { email: string }) {
	// Password-reset emails are a spam/abuse vector — same strict window as
	// login, keyed per (IP, email).
	const denied = await guardServerAction("forgot-password", values.email);
	if (!denied.ok) {
		return { error: "common.rateLimited" };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.resetPasswordForEmail(
		values.email.toLowerCase().trim(),
		{
			redirectTo: `${serverEnv.app.address}/api/auth/callback?next=/auth/reset-password`,
		}
	);
	if (error) return { error: error.message };
	return { error: null };
}
