import { expect, test } from "@playwright/test";
import {
	clearMailpit,
	deleteUserByEmail,
	getLatestEmailLink,
	supabaseAdmin,
} from "./auth-helper";

const FORGOT_PASSWORD_URL = "/en/auth/forgot-password";

test.describe("Forgot Password page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(FORGOT_PASSWORD_URL);
	});

	test("renders the page title and email field", async ({ page }) => {
		await expect(page.locator('[data-slot="card-title"]')).toContainText(
			"Reset Password"
		);
		await expect(page.getByLabel("Email Address")).toBeVisible();
	});

	test("renders the submit button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /reset password/i })
		).toBeVisible();
	});

	test('renders the "Go back" link to the login page', async ({ page }) => {
		const link = page.getByRole("link", { name: /go back/i });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("/auth/login")
		);
	});

	test('clicking "Go back" navigates to the login page', async ({ page }) => {
		await page.getByRole("link", { name: /go back/i }).click();
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test("shows an email validation error for an invalid email on blur", async ({
		page,
	}) => {
		const emailInput = page.getByLabel("Email Address");
		await emailInput.fill("bad-email");
		await page.locator('[data-slot="card-title"]').click();
		await expect(page.getByText(/invalid email/i)).toBeVisible();
	});
});

test.describe("Forgot Password page logic", () => {
	test.beforeEach(async () => {
		await clearMailpit();
	});

	test("submitting nonexistent email still shows success screen (no email sent)", async ({
		page,
	}) => {
		await page.goto(FORGOT_PASSWORD_URL);
		await page
			.getByLabel("Email Address")
			.fill("test-playwright-nonexistent@example.com");
		await page.getByLabel("Email Address").blur();
		await page.waitForTimeout(200);
		await page.getByRole("button", { name: /reset password/i }).click();

		await expect(page.getByText("Check your email")).toBeVisible();
		await expect(
			page.getByText(/We've sent a password reset link/i)
		).toBeVisible();

		// Assert no email arrived in Mailpit for this recipient
		await expect(
			getLatestEmailLink("test-playwright-nonexistent@example.com")
		).rejects.toThrow();
	});

	test("submitting registered email sends password reset link to Mailpit", async ({
		page,
	}) => {
		const email = `test-playwright-forgot-${Date.now()}@example.com`;
		// Create user in DB
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: "Password123",
			email_confirm: true,
			user_metadata: {
				full_name: "Forgot Pass User",
				role: "student",
				locale: "en",
			},
		});
		expect(error).toBeNull();
		const userId = data?.user?.id;

		try {
			await page.goto(FORGOT_PASSWORD_URL);
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel("Email Address").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /reset password/i }).click();

			await expect(page.getByText("Check your email")).toBeVisible();
			await expect(
				page.getByText(/We've sent a password reset link/i)
			).toBeVisible();

			// Expect reset email in Mailpit
			const resetLink = await getLatestEmailLink(email);
			expect(resetLink).toContain("token=");
			expect(resetLink).toContain("type=recovery");
		} finally {
			if (userId) {
				await supabaseAdmin.auth.admin.deleteUser(userId);
			}
		}
	});
});
