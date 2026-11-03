import { describe, expect, it } from "vitest";
import {
	demoAdminOverview,
	demoInstructorOverview,
	demoProfiles,
	demoRoleMessageKey,
	demoRoles,
	demoSchoolOverview,
	demoStudentOverview,
	getDemoUser,
	normalizeDemoRole,
} from "@/lib/demo/mock-dashboard";

describe("normalizeDemoRole", () => {
	it("accepts every supported role", () => {
		for (const role of demoRoles) {
			expect(normalizeDemoRole(role)).toBe(role);
		}
	});

	it("falls back to the student overview for unknown or missing values", () => {
		expect(normalizeDemoRole(undefined)).toBe("student");
		expect(normalizeDemoRole("")).toBe("student");
		expect(normalizeDemoRole("owner")).toBe("student");
	});

	it("reads the first value when the query param repeats", () => {
		expect(normalizeDemoRole(["admin", "student"])).toBe("admin");
	});
});

describe("demo profiles", () => {
	it("has a profile and a matching translation key for each role", () => {
		for (const role of demoRoles) {
			expect(demoProfiles[role].full_name.length).toBeGreaterThan(0);
			expect(demoProfiles[role].email).toContain("@");
			expect(demoRoleMessageKey[role]).toBeTruthy();
		}
	});

	it("builds a CurrentUser-shaped profile without touching Supabase", () => {
		const student = getDemoUser("student");
		expect(student.role).toBe("student");
		expect(student.schoolMemberships).toHaveLength(1);
		expect(student.agencyMemberships).toEqual([]);

		const admin = getDemoUser("admin");
		expect(admin.schoolMemberships).toEqual([]);
	});
});

describe("mock overviews", () => {
	it("keeps student counters internally consistent", () => {
		expect(demoStudentOverview.tests_passed_count).toBeLessThanOrEqual(
			demoStudentOverview.tests_completed_count
		);
		expect(
			demoStudentOverview.continue_learning?.progress_percentage
		).toBeLessThanOrEqual(100);
	});

	it("ships 14 days of trend data for every chart, oldest first", () => {
		const series = [
			demoStudentOverview.study_activity,
			demoInstructorOverview.earnings_trend,
			demoSchoolOverview.earnings_trend,
			demoAdminOverview.revenue_trend,
			demoAdminOverview.signup_trend,
		];

		for (const trend of series) {
			expect(trend).toHaveLength(14);
			const dates = trend.map((point) => new Date(point.date).getTime());
			expect(dates).toEqual([...dates].sort((a, b) => a - b));
		}
	});

	it("has non-empty recent-activity rows for every role", () => {
		expect(demoStudentOverview.recent_quiz_attempts.length).toBeGreaterThan(0);
		expect(demoStudentOverview.recent_notes.length).toBeGreaterThan(0);
		expect(demoInstructorOverview.recent_enrollments.length).toBeGreaterThan(0);
		expect(demoSchoolOverview.recent_members.length).toBeGreaterThan(0);
		expect(demoAdminOverview.recent_signups.length).toBeGreaterThan(0);
	});
});
