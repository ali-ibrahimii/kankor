"use server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "../env/server-env";
import { TablesUpdate } from "../supabase/database.types";
import { getDashboardPath } from "./auth.util";

export type AuthResult = {
	error: string | null;
	code?: string;
	redirectTo?: string;
};

export async function loginAction(values: {
	email: string;
	password: string;
	locale: string;
}): Promise<AuthResult> {
	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email: values.email,
		password: values.password,
	});
	if (error) return { error: error.message };

	const user = await getCurrentUser();
	return { error: null, redirectTo: getDashboardPath(user, values.locale) };
}

export async function registerInstructorAction(values: {
	fullName: string;
	email: string;
	password: string;
}): Promise<AuthResult> {
	const supabase = await createClient();
	const { error } = await supabase.auth.signUp({
		email: values.email,
		password: values.password,
		options: {
			data: { full_name: values.fullName, role: "instructor" },
			emailRedirectTo: `${serverEnv.app.address}/api/auth/callback`,
		},
	});
	if (error) return { error: error.message, code: error.code };
	return { error: null };
}

export async function registerSchoolAction(values: {
	fullName: string;
	schoolName: string;
	email: string;
	password: string;
}): Promise<AuthResult> {
	const supabase = await createClient();
	const { error, data } = await supabase.auth.signUp({
		email: values.email,
		password: values.password,
		options: {
			data: {
				full_name: values.fullName,
				school_name: values.schoolName,
				role: "school_owner",
			},
			emailRedirectTo: `${serverEnv.app.address}/api/auth/callback`,
		},
	});
	if (error) return { error: error.message, code: error.code };

	if (data.user) {
		const { error: schoolError } = await supabase.from("schools").insert({
			name: values.schoolName,
			user_id: data.user.id,
			admin_email: values.email.toLowerCase().trim(),
		});
		if (schoolError)
			return { error: schoolError.message, code: schoolError.code };
	}
	return { error: null };
}

export async function resetPasswordAction(values: {
	email: string;
}): Promise<AuthResult> {
	const supabase = await createClient();
	const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
		redirectTo: `${serverEnv.app.address}/api/auth/update-password`,
	});
	if (error) return { error: error.message };
	return { error: null };
}

export async function signOutAction(): Promise<void> {
	const supabase = await createClient();
	await supabase.auth.signOut();
}

export async function updateProfile(update: TablesUpdate<"profiles">) {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getClaims();
	if (error) return { error: error.message, code: error.code };
	if (data?.claims) {
		const { error } = await supabase
			.from("profiles")
			.update(update)
			.eq("id", data.claims.sub);
		if (error) return { error: error.message, code: error.code };

		if (update.locale) {
			const { error: userError } = await supabase.auth.updateUser({
				data: {
					locale: update.locale,
				},
			});
			if (userError) return { error: userError.message, code: userError.code };
		}

		return { success: true };
	} else return { success: false, error: "Unauthorized" };
}
