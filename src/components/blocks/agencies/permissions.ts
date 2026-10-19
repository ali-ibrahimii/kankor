import type { Database } from "@/lib/supabase/database.types";

export type AgencyPermission = Database["public"]["Enums"]["agency_permission"];

/**
 * The platform permission catalog. Must mirror the `agency_permission`
 * Postgres enum — adding a capability is a deliberate migration, never
 * ad-hoc (see docs/agencies.md). Kept in sync by a unit test against the
 * generated `Constants` enum values.
 */
export const PERMISSION_CATALOG: AgencyPermission[] = [
	"students.charge",
	"schools.suspend",
	"instructors.suspend",
	"schools.manage",
	"courses.manage_own",
	"decks.manage_own",
	"quizzes.manage_own",
	"courses.manage_any",
	"decks.manage_any",
	"quizzes.manage_any",
];

/** Permissions whose scope can be a province list (vs. explicit entities). */
export const PROVINCE_SCOPABLE: AgencyPermission[] = [
	"students.charge",
	"schools.suspend",
	"instructors.suspend",
	"schools.manage",
];
