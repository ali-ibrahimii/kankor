"use server";
import { isSupabaseServerConfigured } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";
import { CurrentUser } from "./types";

/**
 * Single source of truth for "who is logged in and what can they do" —
 * call this from route group layouts (super-admin / instructor / school)
 * rather than re-querying profiles ad hoc.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
	// Without a reachable Supabase project there is no session to read, and
	// `auth.getClaims()` against the inert placeholder host blocks on DNS.
	if (!isSupabaseServerConfigured) return null;

	const supabase = await createClient();
	const { data: claims } = await supabase.auth.getClaims();

	if (!claims?.claims) return null;

	const { data } = await supabase
		.from("profiles")
		.select(
			"*, schoolMemberships:school_members(school_id, role), agencyMemberships:agency_members(agency_id, role, status)"
		)
		.eq("id", claims?.claims.sub)
		.single();

	if (!data) return null;

	return data;
}
