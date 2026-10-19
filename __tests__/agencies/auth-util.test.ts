import { describe, expect, it } from "vitest";
import { getDashboardPath, membershipForAgency } from "@/lib/auth/auth.util";
import type { CurrentUser } from "@/lib/auth/types";

const AGENCY_ID = "00000000-0000-0000-0000-0000000000aa";
const SCHOOL_ID = "00000000-0000-0000-0000-0000000000bb";

function makeUser(overrides: Partial<CurrentUser>): CurrentUser {
	return {
		role: "student",
		schoolMemberships: [],
		agencyMemberships: [],
		...overrides,
	} as CurrentUser;
}

describe("getDashboardPath (agency members)", () => {
	it("routes an active agency member to their agency dashboard", () => {
		const user = makeUser({
			agencyMemberships: [
				{ agency_id: AGENCY_ID, role: "staff", status: "active" },
			],
		});
		expect(getDashboardPath(user, "en")).toBe(`/en/d/agency/${AGENCY_ID}`);
	});

	it("ignores disabled agency memberships", () => {
		const user = makeUser({
			agencyMemberships: [
				{ agency_id: AGENCY_ID, role: "staff", status: "disabled" },
			],
		});
		expect(getDashboardPath(user, "en")).toBe("/en/d");
	});

	it("prefers school membership over agency membership", () => {
		const user = makeUser({
			schoolMemberships: [{ school_id: SCHOOL_ID, role: "staff" }],
			agencyMemberships: [
				{ agency_id: AGENCY_ID, role: "owner", status: "active" },
			],
		});
		expect(getDashboardPath(user, "en")).toBe(`/en/d/school/${SCHOOL_ID}`);
	});

	it("prefers the super-admin dashboard over agency membership", () => {
		const user = makeUser({
			role: "admin",
			agencyMemberships: [
				{ agency_id: AGENCY_ID, role: "owner", status: "active" },
			],
		});
		expect(getDashboardPath(user, "en")).toBe("/en/d/admin");
	});
});

describe("membershipForAgency", () => {
	it("returns the active membership for the given agency", () => {
		const user = makeUser({
			agencyMemberships: [
				{ agency_id: AGENCY_ID, role: "admin", status: "active" },
			],
		});
		expect(membershipForAgency(user, AGENCY_ID)?.role).toBe("admin");
	});

	it("returns undefined for disabled memberships and other agencies", () => {
		const user = makeUser({
			agencyMemberships: [
				{ agency_id: AGENCY_ID, role: "admin", status: "disabled" },
			],
		});
		expect(membershipForAgency(user, AGENCY_ID)).toBeUndefined();
		expect(membershipForAgency(user, SCHOOL_ID)).toBeUndefined();
		expect(membershipForAgency(null, AGENCY_ID)).toBeUndefined();
	});
});
