import { expect, test } from "@playwright/test";
import { deleteUserByEmail, supabaseAdmin } from "./auth-helper";

// Auth pages use a locale prefix — default locale is 'fa' but we test with 'en'
// to keep assertions in English.
const LOGIN_URL = "/en/auth/login";

test.describe("Login page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(LOGIN_URL);
	});

	test("renders the login form", async ({ page }) => {
		// CardTitle renders as a <div>, not a semantic heading
		await expect(page.getByText("Login to your account")).toBeVisible();
		await expect(page.getByLabel("Email Address")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();
	});

	test("renders the Google sign-in button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /continue with google/i })
		).toBeVisible();
	});

	test('renders the "Forgot password?" link pointing to the correct page', async ({
		page,
	}) => {
		const link = page.getByRole("link", { name: /forgot password/i });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("/auth/forgot-password")
		);
	});

	test('renders the "Register" link pointing to the signup page', async ({
		page,
	}) => {
		const link = page.getByRole("link", { name: /^register$/i });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("/auth/signup")
		);
	});

	test('clicking "Forgot password?" navigates to the forgot-password page', async ({
		page,
	}) => {
		await page.getByRole("link", { name: /forgot password/i }).click();
		await expect(page).toHaveURL(/\/auth\/forgot-password/);
	});

	test('clicking "Register" navigates to the signup page', async ({ page }) => {
		await page.getByRole("link", { name: /^register$/i }).click();
		await expect(page).toHaveURL(/\/auth\/signup/);
	});

	test("shows a validation error when an invalid email is blurred", async ({
		page,
	}) => {
		const emailInput = page.getByLabel("Email Address");
		await emailInput.fill("not-an-email");
		await page.locator('[data-slot="card-title"]').click(); // Force blur by clicking card title to avoid flakiness
		await expect(page.getByText(/invalid email/i)).toBeVisible();
	});

	test("shows a validation error when password is left empty and blurred", async ({
		page,
	}) => {
		const passwordInput = page.getByLabel("Password");
		await passwordInput.fill("");
		await page.locator('[data-slot="card-title"]').click(); // Force blur
		// The password field has a min(1) validator
		await expect(page.getByText(/required/i)).toBeVisible();
	});

	test("clicking Google sign-in redirects to Supabase OAuth with correct callback URL", async ({
		page,
	}) => {
		await page.route("**/auth/v1/authorize*", async (route) => {
			const url = route.request().url();
			expect(url).toContain("provider=google");
			expect(url).toContain(encodeURIComponent("/api/auth/callback"));
			await route.fulfill({
				status: 200,
				contentType: "text/html",
				body: "<html>Mocked Google OAuth</html>",
			});
		});

		await page.getByRole("button", { name: /continue with google/i }).click();
		await expect(page.getByText("Mocked Google OAuth")).toBeVisible();
	});

	test("clicking Google sign-in with next parameter redirects with next parameter in callback URL", async ({
		page,
	}) => {
		await page.goto(
			`${LOGIN_URL}?next=${encodeURIComponent("/courses/slug-123")}`
		);

		await page.route("**/auth/v1/authorize*", async (route) => {
			const url = route.request().url();
			expect(url).toContain("provider=google");
			expect(url).toContain(encodeURIComponent("/api/auth/callback"));
			expect(url).toContain("next%3D%252Fcourses%252Fslug-123");
			await route.fulfill({
				status: 200,
				contentType: "text/html",
				body: "<html>Mocked Google OAuth with Next</html>",
			});
		});

		await page.getByRole("button", { name: /continue with google/i }).click();
		await expect(page.getByText("Mocked Google OAuth with Next")).toBeVisible();
	});
});

test.describe("Login page logic", () => {
	test("shows an error with wrong credentials", async ({ page }) => {
		await page.goto(LOGIN_URL);
		await page
			.getByLabel("Email Address")
			.fill("test-playwright-nonexistent@example.com");
		await page.getByLabel("Password").fill("WrongPassword123");
		await page.getByLabel("Password").blur();
		await page.waitForTimeout(200);
		await page.getByRole("button", { name: /^login$/i }).click();
		await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
	});

	test("redirects to confirm-email if email is not confirmed", async ({
		page,
	}) => {
		const email = `test-playwright-unconfirmed-${Date.now()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: "ValidPassword123",
			email_confirm: false,
			user_metadata: {
				full_name: "Test Unconfirmed",
				role: "student",
				locale: "en",
			},
		});
		expect(error).toBeNull();
		const userId = data?.user?.id;

		try {
			await page.goto(LOGIN_URL);
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel("Password").fill("ValidPassword123");
			await page.getByLabel("Password").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /^login$/i }).click();

			await expect(page).toHaveURL(new RegExp(`/auth/confirm-email`));
			await expect(page.getByText(/Confirm your email/i)).toBeVisible();
		} finally {
			if (userId) {
				await supabaseAdmin.auth.admin.deleteUser(userId);
			}
		}
	});

	test("successfully logs in as student and redirects to student dashboard", async ({
		page,
	}) => {
		const email = `test-playwright-student-${Date.now()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: "ValidPassword123",
			email_confirm: true,
			user_metadata: {
				full_name: "Test Student",
				role: "student",
				locale: "en",
			},
		});
		expect(error).toBeNull();
		const userId = data?.user?.id;

		// Wait for the profile trigger to fire (up to 3s)
		for (let i = 0; i < 6; i++) {
			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("id")
				.eq("id", userId)
				.single();
			if (profile) break;
			await new Promise((r) => setTimeout(r, 500));
		}

		try {
			await page.goto(LOGIN_URL);
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel("Password").fill("ValidPassword123");
			await page.getByLabel("Password").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /^login$/i }).click();

			await page.waitForURL(/\/d/, { timeout: 15000, waitUntil: "commit" });
			await expect(page).toHaveURL(/\/d/);
		} finally {
			if (userId) {
				await supabaseAdmin.auth.admin.deleteUser(userId);
			}
		}
	});

	test("successfully logs in as instructor and redirects to instructor dashboard", async ({
		page,
	}) => {
		const email = `test-playwright-instructor-${Date.now()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: "ValidPassword123",
			email_confirm: true,
			user_metadata: {
				full_name: "Test Instructor",
				role: "instructor",
				locale: "en",
			},
		});
		expect(error).toBeNull();
		const userId = data?.user?.id;

		// Wait for the profile trigger to fire (up to 3s)
		for (let i = 0; i < 6; i++) {
			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("id, role")
				.eq("id", userId)
				.single();
			if (profile?.role === "instructor") break;
			await new Promise((r) => setTimeout(r, 500));
		}

		try {
			await page.goto(LOGIN_URL);
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel("Password").fill("ValidPassword123");
			await page.getByLabel("Password").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /^login$/i }).click();

			await page.waitForURL(/\/d\/instructor/, {
				timeout: 15000,
				waitUntil: "commit",
			});
			await expect(page).toHaveURL(/\/d\/instructor/);
		} finally {
			if (userId) {
				await supabaseAdmin.auth.admin.deleteUser(userId);
			}
		}
	});
});
