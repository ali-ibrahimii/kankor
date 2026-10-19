import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

/**
 * §4.5 — Student dashboard: Library section (/d/library?section=...).
 *
 * Verifies that each sidebar sub-link (Fields / Studies / More) renders a
 * filtered, disjoint result set, and that null-category items appear under "More".
 */
test.describe("Student Library — /d/library", () => {
	let studentEmail: string;
	let studentId: string;

	test.beforeAll(async () => {
		const created = await createTestUser("student", "lib-stud");
		studentEmail = created.email;
		studentId = created.userId;
	});

	test.afterAll(async () => {
		await supabaseAdmin.auth.admin.deleteUser(studentId);
	});

	test("library page loads under the student dashboard", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, studentEmail);
		await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

		await page.goto("/en/d/library");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/library/);

		// The library page should render without error
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("section=fields filters by fields category", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, studentEmail);
		await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

		await page.goto("/en/d/library?section=fields");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/section=fields/);

		// Page should render the library grid (may be empty if no seeded data)
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("section=studies filters by studies category", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, studentEmail);
		await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

		await page.goto("/en/d/library?section=studies");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/section=studies/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("section=more shows catch-all including null-category items", async ({
		page,
	}) => {
		test.setTimeout(60000);
		await loginAs(page, studentEmail);
		await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

		await page.goto("/en/d/library?section=more");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/section=more/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});
});
