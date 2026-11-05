import { expect, test } from "@playwright/test";

/**
 * E2E coverage for the admin student pages.
 *
 * The admin area requires a signed-in super-admin, so the tests need a real
 * session. Set these in `.env` (or the environment) to run the authenticated
 * part:
 *
 *   E2E_ADMIN_EMAIL=admin@example.com
 *   E2E_ADMIN_PASSWORD=…
 *
 * Without them the suite still runs — it asserts the *guard* behaviour (the
 * dashboard is not reachable anonymously) and skips the authenticated
 * assertions, so a missing credential never turns into a red build.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const hasAdmin = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

async function signInAsAdmin(page: import("@playwright/test").Page) {
	await page.goto("/en/auth/login");
	await page.fill('input[type="email"]', ADMIN_EMAIL!);
	await page.fill('input[type="password"]', ADMIN_PASSWORD!);
	await page.click('button[type="submit"]');
	// The login form redirects to the dashboard root on success.
	await page.waitForURL(/\/(fa|en|ps)\/d/, { timeout: 30_000 });
}

test.describe("admin student pages", () => {
	test("redirects anonymous visitors to the login page", async ({ page }) => {
		await page.goto("/en/d/admin/users/students");

		await expect(page).toHaveURL(/\/auth\/login/);
		expect(page.url()).toContain("next=%2Fen%2Fd%2Fadmin%2Fusers%2Fstudents");
	});

	test("keeps the student detail page behind the same guard", async ({
		page,
	}) => {
		await page.goto(
			"/en/d/admin/users/students/00000000-0000-0000-0000-000000000000"
		);

		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test("lists students with their enrollment and score columns", async ({
		page,
	}) => {
		test.skip(!hasAdmin, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are not set");

		await signInAsAdmin(page);
		await page.goto("/en/d/admin/users/students");

		// The list header.
		await expect(
			page.getByRole("heading", { name: /students/i })
		).toBeVisible();

		// The per-student columns the feature adds.
		await expect(
			page.getByRole("columnheader", { name: /enrollments/i })
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /grades \/ subjects/i })
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /score/i })
		).toBeVisible();

		// The search box still filters.
		const search = page.getByPlaceholder(/search/i);
		await expect(search).toBeVisible();
	});

	test("shows the full student detail page", async ({ page }) => {
		test.skip(!hasAdmin, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are not set");

		await signInAsAdmin(page);
		await page.goto("/en/d/admin/users/students");

		// Open the first student.
		const firstStudent = page
			.getByRole("link")
			.filter({ hasText: /\S/ })
			.first();
		await firstStudent.click();

		await expect(page).toHaveURL(/\/d\/admin\/users\/students\/[0-9a-f-]{36}/);

		// The tab set of the detail page.
		for (const tab of [
			/overview/i,
			/courses/i,
			/quiz results/i,
			/decks/i,
			/classrooms/i,
			/activity/i,
			/credits/i,
		]) {
			await expect(page.getByRole("tab", { name: tab })).toBeVisible();
		}
	});
});
