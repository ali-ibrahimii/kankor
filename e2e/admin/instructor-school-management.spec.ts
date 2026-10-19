import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createRoleUser, loginAs } from "../shared/test-users";

/**
 * Admin instructor & school management pages.
 *
 * NOTE: requires the `20260714000000_admin_instructor_school_management.sql`
 * migration (admin_instructors_view / admin_schools_view and the new
 * account_status values) to be applied to the local database.
 */
test.describe("Admin instructor & school management", () => {
	// Auth-gated routes compile lazily in dev mode; see credits spec.
	test.describe.configure({ timeout: 90_000 });

	test.beforeEach(async ({ page }) => {
		page.setDefaultTimeout(60_000);
	});

	test("admin can filter, search, and verify a pending instructor", async ({
		page,
	}) => {
		const admin = await createRoleUser("admin", "mgmt-admin");
		const instructor = await createRoleUser("instructor", "mgmt-instructor");

		// The auth trigger leaves instructor_status null; the pending toggle
		// filters on an explicit 'pending' value.
		await supabaseAdmin
			.from("profiles")
			.update({ instructor_status: "pending" })
			.eq("id", instructor.userId);

		try {
			await loginAs(page, admin.email);
			await expect(page).toHaveURL(/\/d\/admin/, { timeout: 60_000 });

			await page.goto("/en/d/admin/users/instructors");
			await expect(
				page.getByRole("heading", { name: "Instructors" })
			).toBeVisible();

			// Toggle to pending-only, then search for the seeded instructor.
			await page.getByRole("radio", { name: "Pending" }).click();
			await page
				.getByPlaceholder("Search by name, email, or phone…")
				.fill(instructor.email);

			const row = page.getByRole("row", { name: /mgmt-instructor/i });
			await expect(row).toBeVisible();
			await expect(row.getByText("Pending")).toBeVisible();

			// Verify via the row actions dropdown.
			await row.getByRole("button", { name: "Open actions menu" }).click();
			await page.getByRole("menuitem", { name: "Verify" }).click();
			await expect(page.getByText("Status updated.")).toBeVisible();

			// The pending filter should no longer match the verified instructor.
			await expect(row).not.toBeVisible();

			// The "All" toggle shows them again, now active.
			await page.getByRole("radio", { name: "All", exact: true }).click();
			await expect(
				page.getByRole("row", { name: /mgmt-instructor/i }).getByText("Active")
			).toBeVisible();
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(admin.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("instructor detail page shows info metrics and content tabs", async ({
		page,
	}) => {
		const admin = await createRoleUser("admin", "detail-admin");
		const instructor = await createRoleUser("instructor", "detail-instructor");

		try {
			await loginAs(page, admin.email);
			await expect(page).toHaveURL(/\/d\/admin/, { timeout: 60_000 });

			await page.goto(`/en/d/admin/users/instructors/${instructor.userId}`);

			// Header with status badge and info tab metrics.
			await expect(page.getByText("Test detail-instructor")).toBeVisible();
			await expect(page.getByText("Published courses")).toBeVisible();

			// Content tabs render their (empty) managed tables.
			await page.getByRole("tab", { name: "Courses" }).click();
			await expect(page.getByText("No courses found.")).toBeVisible();

			await page.getByRole("tab", { name: "Decks" }).click();
			await expect(page.getByText("No decks found.")).toBeVisible();

			await page.getByRole("tab", { name: "Quizzes" }).click();
			await expect(page.getByText("No quizzes found.")).toBeVisible();
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(admin.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("admin can manage schools list and open the school detail tabs", async ({
		page,
	}) => {
		const admin = await createRoleUser("admin", "school-admin");
		const owner = await createRoleUser("instructor", "school-owner");

		const schoolName = `Test School ${Date.now()}`;
		const { data: school, error } = await supabaseAdmin
			.from("schools")
			.insert({
				name: schoolName,
				admin_email: owner.email,
				user_id: owner.userId,
				status: "pending",
			})
			.select("id")
			.single();
		if (error) throw error;

		try {
			await loginAs(page, admin.email);
			await expect(page).toHaveURL(/\/d\/admin/, { timeout: 60_000 });

			await page.goto("/en/d/admin/schools");
			await expect(
				page.getByRole("heading", { name: "Schools" })
			).toBeVisible();

			// Search, then activate the pending school from the row actions.
			await page
				.getByPlaceholder("Search by school name, email, or owner…")
				.fill(schoolName);

			const row = page.getByRole("row", { name: new RegExp(schoolName) });
			await expect(row).toBeVisible();
			await row.getByRole("button", { name: "Open actions menu" }).click();
			await page.getByRole("menuitem", { name: "Verify" }).click();
			await expect(page.getByText("Status updated.")).toBeVisible();

			// Detail page tabs.
			await page.goto(`/en/d/admin/schools/${school.id}`);
			await expect(page.getByText(schoolName)).toBeVisible();
			await expect(page.getByText("Students")).toBeVisible();

			await page.getByRole("tab", { name: "Members" }).click();
			await expect(page.getByText("No members found.")).toBeVisible();

			await page.getByRole("tab", { name: "Courses" }).click();
			await expect(page.getByText("No courses found.")).toBeVisible();
		} finally {
			await supabaseAdmin.from("schools").delete().eq("id", school.id);
			await supabaseAdmin.auth.admin.deleteUser(admin.userId);
			await supabaseAdmin.auth.admin.deleteUser(owner.userId);
		}
	});
});
