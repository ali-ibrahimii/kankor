"use server";

import { createClient } from "@/lib/supabase/server";

export async function resetPasswordAction(values: { password: string }) {
	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({
		password: values.password,
	});
	if (error) return { error: error.message };
	return { error: null };
}
