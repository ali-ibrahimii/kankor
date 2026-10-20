"use server";

import { guardServerAction } from "@/lib/security/action-guard";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function loginAction(values: { email: string; password: string }) {
	// Credential-stuffing / brute-force guard: 10 attempts per 15 minutes
	// per (IP, email) pair.
	const denied = await guardServerAction("login", values.email);
	if (!denied.ok) {
		return { error: "common.rateLimited", code: "common.rateLimited" };
	}

	const supabase = await createClient();
	const { error, data } = await supabase.auth.signInWithPassword({
		email: values.email.toLowerCase().trim(),
		password: values.password,
	});
	if (error) return { error: error.message, code: error.code };

	const adminClient = createServiceRoleClient();

	// The profile row is created by a Supabase trigger on auth.users insert.
	// For freshly-created users, the trigger may not have fired yet,
	// so retry up to 5 times with 300ms gaps.
	let profile = null;
	for (let attempt = 0; attempt < 5; attempt++) {
		const { data: row } = await adminClient
			.from("profiles")
			.select(
				"*, schoolMemberships:school_members(school_id, role), agencyMemberships:agency_members(agency_id, role, status)"
			)
			.eq("id", data.user.id)
			.single();
		if (row) {
			profile = row;
			break;
		}
		await new Promise((res) => setTimeout(res, 300));
	}

	return { error: null, user: profile };
}
