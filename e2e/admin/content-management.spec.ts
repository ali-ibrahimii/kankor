import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";

const TEST_PASSWORD = "ValidPassword123";
const LOGIN_URL = "/en/auth/login";

async function createAdminUser(tag: string) {
	const email = `test-playwright-${tag}-${Date.now()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: TEST_PASSWORD,
		email_confirm: true,
		user_metadata: { full_name: `Test Admin ${tag}`, locale: "en" },
	});
	if (error) throw error;
	const userId = data.user?.id;
	if (!userId) throw new Error("createUser did not return a user id");

	const { error: patchError } = await supabaseAdmin
		.from("profiles")
		.update({ role: "admin", locale: "en" })
		.eq("id", userId);
	if (patchError) throw patchError;

	return { email, userId };
}

async function loginAs(page: import("@playwright/test").Page, email: string) {
	await page.goto(LOGIN_URL);
	await page.waitForLoadState("networkidle");
	await page.getByLabel("Email Address").fill(email);
	await page.getByLabel("Password").fill(TEST_PASSWORD);
	await page.getByLabel("Password").blur();
	await page.waitForTimeout(200);
	await page.getByRole("button", { name: /^login$/i }).click();
}

/**
 * §6.1 + §6.2 — Admin dashboard overview and content management pages.
 *
 * Verifies: overview loads, all four content management routes
 * (/d/admin/courses, /d/admin/decks, /d/admin/libraries, /d/admin/quizzes)
 * render without error, and that admin users list pages load.
 */
test.describe("Admin Dashboard — overview and content management", () => {
	let adminEmail: string;
	let adminId: string;

	test.beforeAll(async () => {
		const created = await createAdminUser("admin-content");
		adminEmail = created.email;
		adminId = created.userId;
	});

	test.afterAll(async () => {
		await supabaseAdmin.auth.admin.deleteUser(adminId);
	});

	test("admin overview page renders", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await expect(page).toHaveURL(/\/d\/admin/);
		await page.waitForLoadState("domcontentloaded");

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("admin courses page loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/courses");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/courses/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("admin decks page loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/decks");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/decks/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("admin libraries page loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/libraries");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/libraries/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("admin quizzes page loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/quizzes");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/quizzes/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("admin instructors user list loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/users/instructors");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/users\/instructors/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("admin students user list loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/users/students");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/users\/students/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("admin schools page loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/schools");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/schools/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});
});
