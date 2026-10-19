"use server";

import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { SignUpFormValues } from "./signup-schema";

export async function signupAction(values: SignUpFormValues) {
	const supabase = await createClient();

	if (values.confirmPassword !== values.password)
		return { error: "validation.passwordMismatch" };

	const { error, data } = await supabase.auth.signUp({
		email: values.email.toLowerCase().trim(),
		password: values.password,
		options: {
			data: {
				full_name: values.fullName,
				locale: values.locale,
				role: values.type === "school" ? "student" : values.type,
				province_id: values.provinceId || null,
			},
			emailRedirectTo: routes.auth.login.page(undefined, { isAbsolute: true }),
		},
	});

	if (error) {
		return {
			error: error.message,
			code: `common.${error.code || "unknown_error"}`,
		};
	}

	if (data.user && values.type === "school") {
		const adminSupabase = createServiceRoleClient();
		const { error: schoolError } = await adminSupabase.from("schools").insert({
			name: values.schoolName,
			address: values.schoolAddress,
			user_id: data.user.id,
			admin_email: values.email.toLowerCase().trim(),
			province_id: values.provinceId || null,
		});
		if (schoolError?.code) {
			console.log("error school", schoolError);
			return { error: schoolError.message, code: `common.${schoolError.code}` };
		}
	}
	return { error: null };
}
