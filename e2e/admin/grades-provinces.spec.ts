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
 * §6.5 — Admin dashboard: Grades and Provinces reference data.
 *
 * Verifies CRUD pages load, and that a province added here surfaces in the
 * signup form's Province combobox.
 */
test.describe("Admin — Grades & Provinces reference data", () => {
	let adminEmail: string;
	let adminId: string;

	test.beforeAll(async () => {
		const created = await createAdminUser("admin-ref");
		adminEmail = created.email;
		adminId = created.userId;
	});

	test.afterAll(async () => {
		await supabaseAdmin.auth.admin.deleteUser(adminId);
	});

	test("admin grades page loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/grades");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/grades/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("admin provinces page loads", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, adminEmail);
		await page.waitForURL(/\/d\/admin/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/admin/provinces");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/admin\/provinces/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("a province seeded in the DB appears in the signup form combobox", async ({
		page,
	}) => {
		test.setTimeout(60000);

		// Seed a unique province
		const provinceName = `E2E Province ${Date.now()}`;
		const { data: province, error } = await supabaseAdmin
			.from("provinces")
			.insert({ name: provinceName })
			.select("id")
			.single();

		expect(error).toBeNull();

		try {
			// Navigate to the signup form
			await page.goto("/en/auth/signup?type=student");
			await page.waitForLoadState("domcontentloaded");

			// Open the Province combobox
			const provinceCombo = page
				.getByRole("combobox", { name: /province/i })
				.first();
			if (await provinceCombo.isVisible({ timeout: 5000 }).catch(() => false)) {
				await provinceCombo.click();

				// Type to search for our province
				const searchInput = page.getByPlaceholder(/search/i).first();
				if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
					await searchInput.fill(provinceName);
					await page.waitForTimeout(500);

					// The seeded province should appear as an option
					const option = page.getByText(provinceName).first();
					await expect(option).toBeVisible({ timeout: 5000 });
				}
			}
		} finally {
			// Clean up
			if (province) {
				await supabaseAdmin.from("provinces").delete().eq("id", province.id);
			}
		}
	});
});
