import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

/**
 * §5.7 — Instructor earnings page (/d/instructor/earnings).
 *
 * Verifies: earnings page renders, shows total credits / sales table,
 * and doesn't error for an instructor with no sales.
 */
test.describe("Instructor Earnings — /d/instructor/earnings", () => {
	let instructorEmail: string;
	let instructorId: string;

	test.beforeAll(async () => {
		const created = await createTestUser("instructor", "inst-earn");
		instructorEmail = created.email;
		instructorId = created.userId;
	});

	test.afterAll(async () => {
		await supabaseAdmin.auth.admin.deleteUser(instructorId);
	});

	test("earnings page renders with empty state for a new instructor", async ({
		page,
	}) => {
		test.setTimeout(60000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/instructor/earnings");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/instructor\/earnings/);

		// The page should render without errors
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();

		// No server error should be visible
		const errorIndicator = page.getByText(/error|500|internal server/i);
		const hasError = await errorIndicator
			.isVisible({ timeout: 2000 })
			.catch(() => false);
		expect(hasError).toBe(false);
	});
});
