import { expect, test } from "@playwright/test";

/**
 * E2E guard coverage for the instructor area.
 *
 * The instructor dashboard requires a signed-in, approved instructor. Without
 * credentials the suite asserts the *guard* behaviour (the area is not
 * reachable anonymously); set these in `.env` to run the authenticated part:
 *
 *   E2E_INSTRUCTOR_EMAIL=instructor@example.com
 *   E2E_INSTRUCTOR_PASSWORD=…
 */

const INSTRUCTOR_EMAIL = process.env.E2E_INSTRUCTOR_EMAIL;
const INSTRUCTOR_PASSWORD = process.env.E2E_INSTRUCTOR_PASSWORD;
const hasInstructor = Boolean(INSTRUCTOR_EMAIL && INSTRUCTOR_PASSWORD);

async function signInAsInstructor(page: import("@playwright/test").Page) {
	await page.goto("/en/auth/login");
	await page.fill('input[type="email"]', INSTRUCTOR_EMAIL!);
	await page.fill('input[type="password"]', INSTRUCTOR_PASSWORD!);
	await page.click('button[type="submit"]');
	await page.waitForURL(/\/(fa|en|ps)\/d/, { timeout: 30_000 });
}

test.describe("instructor area", () => {
	test("redirects anonymous visitors to the login page", async ({ page }) => {
		await page.goto("/en/d/instructor");

		await expect(page).toHaveURL(/\/auth\/login/);
		expect(page.url()).toContain("next=%2Fen%2Fd%2Finstructor");
	});

	test("keeps the courses list behind the same guard", async ({ page }) => {
		await page.goto("/en/d/instructor/courses");

		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test("keeps the course detail pages behind the same guard", async ({
		page,
	}) => {
		await page.goto("/en/d/instructor/courses/unknown-course-slug");

		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test("keeps the analytics and settings pages behind the same guard", async ({
		page,
	}) => {
		await page.goto("/en/d/instructor/analytics");
		await expect(page).toHaveURL(/\/auth\/login/);

		await page.goto("/en/d/instructor/settings");
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test("shows the courses list with its status tabs", async ({ page }) => {
		test.skip(!hasInstructor, "E2E_INSTRUCTOR_EMAIL / E2E_INSTRUCTOR_PASSWORD are not set");

		await signInAsInstructor(page);
		await page.goto("/en/d/instructor/courses?status=published");

		// The status tabs from the sidebar must land on the list, not a 404.
		await expect(page).toHaveURL(/\/d\/instructor\/courses\?status=published/);
		await expect(
			page.getByRole("link", { name: /all|published|draft/i }).first()
		).toBeVisible();
	});

	test("opens the analytics page without a 404", async ({ page }) => {
		test.skip(!hasInstructor, "E2E_INSTRUCTOR_EMAIL / E2E_INSTRUCTOR_PASSWORD are not set");

		await signInAsInstructor(page);
		await page.goto("/en/d/instructor/analytics");

		await expect(page).toHaveURL(/\/d\/instructor\/analytics/);
	});
});
