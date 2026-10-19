"use server";

import { serverEnv } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";

export async function forgotPasswordAction(values: { email: string }) {
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
