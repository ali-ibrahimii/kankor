"use server";

import { revalidatePath } from "next/cache";
import { Locale } from "@/i18n";
import type { Database } from "@/lib/supabase/database.types";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export interface UpdateProfileInput {
	fullName?: string | null;
	bio?: string | null;
	phone?: string | null;
	websiteUrl?: string | null;
	locale?: Locale;
	avatarUrl?: string | null;
}

export async function updateProfileAction(input: UpdateProfileInput) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Unauthenticated" };
	}

	const updateData: Database["public"]["Tables"]["profiles"]["Update"] = {};
	if (input.fullName !== undefined) updateData.full_name = input.fullName;
	if (input.bio !== undefined) updateData.bio = input.bio;
	if (input.phone !== undefined) updateData.phone = input.phone;
	if (input.websiteUrl !== undefined) updateData.website_url = input.websiteUrl;
	if (input.locale !== undefined) updateData.locale = input.locale;
	if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;

	const { error } = await supabase
		.from("profiles")
		.update(updateData)
		.eq("id", user.id);

	if (error) {
		return { success: false, error: error.message };
	}

	revalidatePath("/", "layout");
	return { success: true, error: null };
}

export async function updatePasswordAction(values: { password: string }) {
	if (!values.password || values.password.length < 6) {
		return {
			success: false,
			error: "Password must be at least 6 characters long.",
		};
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({
		password: values.password,
	});

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true, error: null };
}

export async function updateEmailAction(values: { email: string }) {
	if (!values.email || !values.email.includes("@")) {
		return { success: false, error: "Invalid email address." };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({
		email: values.email,
	});

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true, error: null };
}

export async function deleteAccountAction() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Unauthenticated" };
	}

	const adminSupabase = createServiceRoleClient();
	const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

	if (error) {
		return { success: false, error: error.message };
	}

	await supabase.auth.signOut();
	return { success: true, error: null };
}
