import { expect, test } from "@playwright/test";
import { createRoleUser, loginAs, TEST_PASSWORD } from "../shared/test-users";
import { supabaseAdmin } from "./auth-helper";

/**
 * Role isolation & auth redirect-back regression suite (docs/user_flows.md
 * §2.6, §7 intro, §8.2, §8.6).
 *
 * The doc explicitly flags these as "verify, don't assume": a signed-in user
 * of one role must be redirected away from another role's dashboard by the
 * proxy guard (src/lib/supabase/middleware.ts), never shown a 403 or,
 * worse, the other role's chrome/data. Auth redirect-back (`next`) is also
 * flagged as inconsistently wired across entry points — this suite covers
 * the real email/password login path (existing coverage only exercises the
 * Google OAuth redirect construction, not an actual completed login).
 */
test.describe("Role isolation & auth redirect-back", () => {
	test.describe.configure({ timeout: 90_000 });

	test.beforeEach(async ({ page }) => {
		page.setDefaultTimeout(60_000);
	});

	test("signed-out deep link to a dashboard route redirects to login with next, and lands back after a real login", async ({
		page,
	}) => {
		const student = await createRoleUser("student", "redirect-back");

		try {
			await page.goto("/en/d/my-courses");

			await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
			expect(page.url()).toContain(encodeURIComponent("/d/my-courses"));

			await page.getByLabel("Email Address").fill(student.email);
			await page.getByLabel("Password").fill(TEST_PASSWORD);
			await page.getByLabel("Password").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /^login$/i }).click();

			// Should land back on the originally requested page, not the
			// student's default dashboard root.
			await expect(page).toHaveURL(/\/d\/my-courses/, { timeout: 30_000 });
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
		}
	});

	test("a student cannot reach the instructor dashboard", async ({ page }) => {
		const student = await createRoleUser("student", "guard-student-instr");

		try {
			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto("/en/d/instructor");
			await page.waitForLoadState("networkidle");

			// Must not be left on (or shown the chrome of) the instructor
			// dashboard — the proxy guard should have redirected elsewhere.
			expect(page.url()).not.toContain("/d/instructor");
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
		}
	});

	test("a student cannot reach the admin dashboard", async ({ page }) => {
		const student = await createRoleUser("student", "guard-student-admin");

		try {
			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto("/en/d/admin");
			await page.waitForLoadState("networkidle");

			expect(page.url()).not.toContain("/d/admin");
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
		}
	});

	test("an instructor cannot reach the admin dashboard", async ({ page }) => {
		const instructor = await createRoleUser("instructor", "guard-instr-admin");

		try {
			await loginAs(page, instructor.email);
			await expect(page).toHaveURL(/\/d\/instructor/, { timeout: 60_000 });

			await page.goto("/en/d/admin");
			await page.waitForLoadState("networkidle");

			expect(page.url()).not.toContain("/d/admin");
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("a student with no school membership cannot reach another school's dashboard", async ({
		page,
	}) => {
		const owner = await createRoleUser("instructor", "guard-school-owner");
		const student = await createRoleUser("student", "guard-school-outsider");

		// `create_school_members_on_schools_created()` auto-inserts the owner's
		// school_members row on insert — no need to add it manually.
		const { data: school, error } = await supabaseAdmin
			.from("schools")
			.insert({
				name: `Guard Test School ${Date.now()}`,
				status: "active",
				user_id: owner.userId,
			})
			.select("id")
			.single();
		if (error) throw error;
		const schoolId = school.id;

		try {
			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto(`/en/d/school/${schoolId}`);
			await page.waitForLoadState("networkidle");

			expect(page.url()).not.toContain(`/d/school/${schoolId}`);
		} finally {
			await supabaseAdmin
				.from("school_members")
				.delete()
				.eq("school_id", schoolId);
			await supabaseAdmin.from("schools").delete().eq("id", schoolId);
			await supabaseAdmin.auth.admin.deleteUser(owner.userId);
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
		}
	});
});
