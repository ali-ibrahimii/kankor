"use server";

import { createClient } from "@/lib/supabase/server";

export async function resendConfirmationEmailAction(values: { email: string }) {
	const supabase = await createClient();
	const { error } = await supabase.auth.resend({
		type: "signup",
		email: values.email.toLowerCase().trim(),
	});
	if (error) return { error: error.message };
	return { error: null };
}
