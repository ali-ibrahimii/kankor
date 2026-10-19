import { expect, test } from "@playwright/test";
import { clearMailpit, getLatestEmailLink, supabaseAdmin } from "./auth-helper";

const CONFIRM_EMAIL_URL = "/en/auth/confirm-email";

test.describe("Confirm email page", () => {
	test("renders with the email prefilled from the query param", async ({
		page,
	}) => {
		await page.goto(`${CONFIRM_EMAIL_URL}?email=someone%40example.com`);

		await expect(page.getByText("Confirm your email")).toBeVisible();
		await expect(page.getByLabel("Email Address")).toHaveValue(
			"someone@example.com"
		);
		await expect(
			page.getByRole("button", { name: /resend confirmation email/i })
		).toBeVisible();
	});

	test("renders a link back to login", async ({ page }) => {
		await page.goto(CONFIRM_EMAIL_URL);
		const link = page.getByRole("link", { name: /^go back$/i });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("/auth/login")
		);
	});

	test("logging in with an unconfirmed account redirects here with the email prefilled", async ({
		page,
	}) => {
		const email = `test-playwright-confirm-redirect-${Date.now()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: "ValidPassword123",
			email_confirm: false,
			user_metadata: { full_name: "Test Unconfirmed Redirect", locale: "en" },
		});
		expect(error).toBeNull();
		const userId = data?.user?.id;

		try {
			await page.goto("/en/auth/login");
			await page.waitForLoadState("networkidle");
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel("Password").fill("ValidPassword123");
			await page.getByLabel("Password").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /^login$/i }).click();

			await expect(page).toHaveURL(/\/auth\/confirm-email/);
			await expect(page.getByLabel("Email Address")).toHaveValue(email);
		} finally {
			if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});
});

test.describe("Confirm email page logic", () => {
	test.beforeEach(async () => {
		await clearMailpit();
	});

	test("resending the confirmation email sends a fresh link via Mailpit", async ({
		page,
	}) => {
		const email = `test-playwright-resend-confirm-${Date.now()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: "ValidPassword123",
			email_confirm: false,
			user_metadata: { full_name: "Test Resend Confirm", locale: "en" },
		});
		expect(error).toBeNull();
		const userId = data?.user?.id;

		try {
			await page.goto(
				`${CONFIRM_EMAIL_URL}?email=${encodeURIComponent(email)}`
			);
			await page
				.getByRole("button", { name: /resend confirmation email/i })
				.click();

			await expect(
				page.getByText(/sent a new confirmation link/i)
			).toBeVisible();

			const link = await getLatestEmailLink(
				email,
				(l) => l.includes("token_hash") || l.includes("confirm")
			);
			expect(link).toBeTruthy();
		} finally {
			if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});
});
