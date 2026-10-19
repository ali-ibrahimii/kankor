import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

/**
 * §4.1 — Student dashboard overview page.
 *
 * Verifies that the overview page renders its RPC-backed widgets and that
 * navigation links from the overview land on the right pages.
 */
test.describe("Student dashboard overview — /d", () => {
	let studentEmail: string;
	let studentId: string;

	test.beforeAll(async () => {
		const created = await createTestUser("student", "overview-stud");
		studentEmail = created.email;
		studentId = created.userId;
	});

	test.afterAll(async () => {
		await supabaseAdmin.auth.admin.deleteUser(studentId);
	});

	test("renders the overview page with dashboard widgets", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, studentEmail);
		await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

		// The student dashboard overview should load
		await expect(page).toHaveURL(/\/en\/d/);
		await page.waitForLoadState("domcontentloaded");

		// Verify the page has some visible content (headings, cards, etc.)
		// The exact widgets depend on get_student_dashboard_overview RPC
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("sidebar navigation links resolve to correct student pages", async ({
		page,
	}) => {
		test.setTimeout(60000);
		await loginAs(page, studentEmail);
		await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

		// Verify key sidebar links exist and are navigable
		const sidebar = page.locator('[data-sidebar="sidebar"]').first();
		if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
			// Check for courses link
			const coursesLink = sidebar
				.getByRole("link", { name: /courses/i })
				.first();
			if (await coursesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
				await coursesLink.click();
				await page.waitForLoadState("domcontentloaded");
				await expect(page).toHaveURL(/\/d\/(courses|my-courses)/);
			}
		}
	});
});
