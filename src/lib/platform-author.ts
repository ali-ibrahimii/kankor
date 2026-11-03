import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Platform author
//
// Courses created from the admin panel are published by the platform, not by
// the person who happened to be signed in: `courses.instructor_id` points at
// the shared "Abzar Kankor" profile so every surface (cards, course page,
// dashboards) shows the brand instead of an individual admin.
//
// The profile is resolved once per request:
//   1. PLATFORM_AUTHOR_PROFILE_ID — explicit override, if configured;
//   2. otherwise the admin-role profile whose name matches the brand;
//   3. otherwise null → the caller keeps ownership (feature degrades safely and
//      the UI still hides personal names for admin-authored courses).
// ─────────────────────────────────────────────────────────────────────────────

/** Brand spellings that identify the platform's own profile. */
const PLATFORM_PROFILE_NAMES = [
	"abzar kankor",
	"abzar konkur",
	"ابزار کانکور",
	"ابزارکانکور",
	"ابزار كانكور",
];

function normalizeName(value: string | null | undefined): string {
	return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export const getPlatformAuthorId = cache(async (): Promise<string | null> => {
	const supabase = await createClient();
	const configured = process.env.PLATFORM_AUTHOR_PROFILE_ID?.trim();

	if (configured) {
		const { data } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", configured)
			.maybeSingle();
		if (data?.id) return data.id;
	}

	// Only admin-role profiles are readable for a non-owner caller (see the
	// profiles RLS policies), and those are exactly the ones we care about.
	const { data, error } = await supabase
		.from("profiles")
		.select("id, full_name, role")
		.eq("role", "admin");

	if (error) {
		console.error("[platform-author] profile lookup failed:", error.message);
		return null;
	}

	const match = (data ?? []).find((profile) =>
		PLATFORM_PROFILE_NAMES.includes(normalizeName(profile.full_name))
	);

	return match?.id ?? null;
});
