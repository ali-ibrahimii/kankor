import { expect, test } from "@playwright/test";
import {
	clearMailpit,
	deleteUserByEmail,
	getLatestEmailLink,
	supabaseAdmin,
} from "./auth-helper";

const RESET_PASSWORD_URL = "/en/auth/reset-password";

test.describe("Reset Password page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(RESET_PASSWORD_URL);
	});

	test("renders the page title and both password fields", async ({ page }) => {
		await expect(page.getByText("Set New Password")).toBeVisible();
		await expect(page.getByLabel(/^password$/i)).toBeVisible();
		await expect(page.getByLabel("Confirm Password")).toBeVisible();
	});

	test("renders the submit button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /update password/i })
		).toBeVisible();
	});

	test("shows a strength error for a weak password on blur", async ({
		page,
	}) => {
		const passwordInput = page.getByLabel(/^password$/i);
		await passwordInput.fill("weak");
		await page.locator('[data-slot="card-title"]').click(); // Force blur
		await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
	});

	// NOTE: there is no reachable "submit mismatched passwords and see an
	// error" scenario to test here — the submit button is disabled whenever
	// the two fields differ (see the tests below), so a real user (and
	// Playwright, correctly refusing to click a disabled button) can never
	// trigger the onSubmit-level duplicate mismatch check. That check is
	// effectively dead code given the current disabled-gating; the tests
	// below assert the actual reachable invariant instead.

	// The submit button is gated by a `form.Subscribe`-driven `disabled` prop,
	// not just a validator — assert the attribute directly rather than only
	// click-and-check-for-error (see docs/user_flows.md §2.4).
	test("submit button is disabled while the password field is empty", async ({
		page,
	}) => {
		await expect(
			page.getByRole("button", { name: /update password/i })
		).toBeDisabled();

		await page.getByLabel(/^password$/i).fill("Password1");
		await page.getByLabel("Confirm Password").fill("Password1");
		await expect(
			page.getByRole("button", { name: /update password/i })
		).toBeEnabled();
	});

	test("submit button is disabled while password and confirm password differ", async ({
		page,
	}) => {
		await page.getByLabel(/^password$/i).fill("Password1");
		await page.getByLabel("Confirm Password").fill("Different1");
		await expect(
			page.getByRole("button", { name: /update password/i })
		).toBeDisabled();

		await page.getByLabel("Confirm Password").fill("Password1");
		await expect(
			page.getByRole("button", { name: /update password/i })
		).toBeEnabled();
	});
});

test.describe("Reset Password logic", () => {
	test.beforeEach(async () => {
		await clearMailpit();
	});

	test("successfully resets the password and logs in with the new password", async ({
		page,
	}) => {
		const email = `test-playwright-reset-${Date.now()}@example.com`;
		const oldPassword = "OldPassword123";
		const newPassword = "NewPassword123";

		// Create user in DB
		const { data, error: createError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password: oldPassword,
				email_confirm: true,
				user_metadata: {
					full_name: "Reset Test User",
					role: "student",
					locale: "en",
				},
			});
		expect(createError).toBeNull();
		const userId = data?.user?.id;

		try {
			// Request reset link
			await page.goto("/en/auth/forgot-password");
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel("Email Address").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /reset password/i }).click();

			await expect(page.getByText("Check your email")).toBeVisible();

			// Get recovery link from Mailpit
			const resetLink = await getLatestEmailLink(email);

			// Navigate to recovery link (which handles token verification)
			await page.goto(resetLink);

			// We should be redirected to the Set New Password page
			await expect(page.getByText("Set New Password")).toBeVisible();

			// Enter new password and submit
			await page.getByLabel(/^password$/i).fill(newPassword);
			await page.getByLabel("Confirm Password").fill(newPassword);
			await page.getByLabel("Confirm Password").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /update password/i }).click();

			// Verify success message
			await expect(page.getByText("Password updated")).toBeVisible();
			await expect(
				page.getByText(/Your password has been updated/i)
			).toBeVisible();

			// Clear cookies to log out before testing new password
			await page.context().clearCookies();

			// Log in with new password
			await page.goto("/en/auth/login");
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel("Password").fill(newPassword);
			await page.getByLabel("Password").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /^login$/i }).click();

			// Verify redirected to dashboard (allow extra time for next.js dev compilation/rendering)
			await expect(page).toHaveURL(/\/d/, { timeout: 15000 });
		} finally {
			if (userId) {
				await supabaseAdmin.auth.admin.deleteUser(userId);
			}
		}
	});
});
