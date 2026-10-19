import { Tables } from "../supabase/database.types";

export type SchoolMembership = Pick<
	Tables<"school_members">,
	"school_id" | "role"
>;

export type AgencyMembership = Pick<
	Tables<"agency_members">,
	"agency_id" | "role" | "status"
>;

export type CurrentUser = Tables<"profiles"> & {
	/** Per-school staff relationships — a user can be a member of several schools. */
	schoolMemberships: SchoolMembership[];
	/** Per-agency staff relationships — a user can be a member of several agencies. */
	agencyMemberships: AgencyMembership[];
};
