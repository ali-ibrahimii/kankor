"use server";

import { routes } from "@/lib/routes";
import { guardServerAction } from "@/lib/security/action-guard";
import {
	createClient,
	createServiceRoleClient,
	hasServiceRoleKey,
} from "@/lib/supabase/server";
import { SignUpFormValues } from "./signup-schema";

export async function signupAction(values: SignUpFormValues) {
	// Signup spam guard: 10 attempts per 15 minutes per (IP, email).
	const denied = await guardServerAction("signup", values.email);
	if (!denied.ok) {
		return { error: "common.rateLimited", code: "common.rateLimited" };
	}

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
				// School signups: the DB trigger handle_new_user_profile_creation()
				// reads these to provision the `schools` row inside the signup
				// transaction (migration 20261118000000) — no service-role needed.
				signup_type: values.type,
				school_name: values.schoolName ?? null,
				school_address: values.schoolAddress ?? null,
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
		const provisioned = await provisionSchool({
			userId: data.user.id,
			name: values.schoolName ?? "",
			address: values.schoolAddress ?? "",
			email: values.email.toLowerCase().trim(),
			provinceId: values.provinceId || null,
		});
		if (!provisioned) {
			return {
				error: "common.schoolCreationFailed",
				code: "common.schoolCreationFailed",
			};
		}
	}
	return { error: null };
}

/**
 * Ensure the `schools` row exists for a freshly signed-up school owner.
 *
 * The DB trigger is the primary path (works with no service-role key at
 * all). This doubles as a repair step for databases where the trigger has
 * not run yet — but only when a real service-role key is configured;
 * otherwise the insert would run as `anon` and fail with 42501.
 *
 * Returns false only when a configured service-role client actively failed
 * to create the row; a missing key is not a failure (the trigger owns that
 * path).
 */
async function provisionSchool(input: {
	userId: string;
	name: string;
	address: string;
	email: string;
	provinceId: string | null;
}): Promise<boolean> {
	if (!hasServiceRoleKey()) {
		// The trigger (migration 20261118000000_school_signup_provisioning)
		// already created the school inside the signup transaction. Applying
		// that migration is the fix; the service-role key is optional.
		console.warn(
			"[signup] SUPABASE_SERVICE_ROLE_KEY is missing or not a service_role key — relying on the DB trigger to provision the school. " +
				"Apply supabase/migrations/20261118000000_school_signup_provisioning.sql and set the service_role key (Supabase → Settings → API) to enable the repair path."
		);
		return true;
	}

	const adminSupabase = createServiceRoleClient();

	// Idempotent: the DB trigger may already have created the row.
	const { data: existing } = await adminSupabase
		.from("schools")
		.select("id")
		.eq("user_id", input.userId)
		.maybeSingle();
	if (existing) return true;

	const { error: schoolError } = await adminSupabase.from("schools").insert({
		name: input.name,
		address: input.address,
		user_id: input.userId,
		admin_email: input.email,
		province_id: input.provinceId,
	});
	if (schoolError?.code) {
		// Server log only — the user gets the localized
		// `common.schoolCreationFailed` message, never the raw server text.
		console.error("[signup] school record creation failed:", schoolError);
		if (schoolError.code === "42501") {
			console.error(
				"[signup] hint: the configured SUPABASE_SERVICE_ROLE_KEY cannot insert into `schools` — it is usually the anon/publishable key copied by mistake. " +
					"Copy the service_role secret from Supabase → Settings → API (and apply migration 20261118000000 as the key-independent fallback)."
			);
		}
		return false;
	}
	return true;
}
