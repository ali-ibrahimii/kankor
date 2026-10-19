import { Locale } from "@/i18n";
import { routes } from "../routes";
import { AgencyMembership, CurrentUser, SchoolMembership } from "./types";

export function isSuperAdmin(user: CurrentUser | null): boolean {
	return user?.role === "admin";
}

export function isInstructor(user: CurrentUser | null): boolean {
	return user?.role === "instructor";
}

export function membershipForSchool(
	user: CurrentUser | null,
	schoolId: string
): SchoolMembership | undefined {
	return user?.schoolMemberships.find((m) => m.school_id === schoolId);
}

export function membershipForAgency(
	user: CurrentUser | null,
	agencyId: string
): AgencyMembership | undefined {
	return user?.agencyMemberships.find(
		(m) => m.agency_id === agencyId && m.status === "active"
	);
}

function activeAgencyMemberships(user: CurrentUser): AgencyMembership[] {
	return user.agencyMemberships.filter((m) => m.status === "active");
}

/**
 * Returns the role-appropriate dashboard path for a user.
 * Super admins → /admin, instructors → /instructor,
 * school members → /school/{id}, agency members → /agency/{id},
 * everyone else → /d (student dashboard).
 */
export function getDashboardPath(
	user: CurrentUser | null,
	locale?: string
): string {
	let next = routes.auth.login.page(undefined, { locale });
	if (!user) return next;

	if (isSuperAdmin(user)) return routes.d.admin.page(undefined, { locale });
	if (isInstructor(user))
		return routes.d.instructor.page(undefined, { locale });
	if (user.schoolMemberships.length > 0) {
		return routes.d.school.page(
			{ school_id: user.schoolMemberships[0].school_id },
			undefined,
			{ locale }
		);
	}
	const agencies = activeAgencyMemberships(user);
	if (agencies.length > 0) {
		return routes.d.agency.page(
			{ agency_id: agencies[0].agency_id },
			undefined,
			{ locale }
		);
	}
	return routes.d.page(undefined, { locale });
}
