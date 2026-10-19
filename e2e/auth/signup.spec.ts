import { expect, test } from "@playwright/test";
import {
	clearMailpit,
	deleteUserByEmail,
	getLatestEmailLink,
	supabaseAdmin,
} from "./auth-helper";

const SIGNUP_URL = "/en/auth/signup";

test.describe("Signup page", () => {
	test.describe("student type (default)", () => {
		test.beforeEach(async ({ page }) => {
			await page.goto(SIGNUP_URL);
		});

		test("renders the student signup form", async ({ page }) => {
			await expect(page.getByText("Create your Account")).toBeVisible();
			await expect(page.getByLabel("Full Name")).toBeVisible();
			await expect(page.getByLabel("Email Address")).toBeVisible();
			await expect(page.getByLabel(/^password$/i)).toBeVisible();
			await expect(page.getByLabel("Confirm Password")).toBeVisible();
		});

		test("does not show school-specific fields", async ({ page }) => {
			await expect(page.getByLabel("School Name")).not.toBeVisible();
			await expect(page.getByLabel("School Address")).not.toBeVisible();
		});

		test("renders a link back to login", async ({ page }) => {
			const link = page.getByRole("link", { name: /sign in/i });
			await expect(link).toBeVisible();
			await expect(link).toHaveAttribute(
				"href",
				expect.stringContaining("/auth/login")
			);
		});

		test("shows a validation error for a weak password on blur", async ({
			page,
		}) => {
			const passwordInput = page.getByLabel(/^password$/i);
			await passwordInput.fill("weak");
			await page.locator('[data-slot="card-title"]').click(); // Force blur
			await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
		});
	});

	test.describe("instructor type (?type=instructor)", () => {
		test.beforeEach(async ({ page }) => {
			await page.goto(`${SIGNUP_URL}?type=instructor`);
		});

		test("renders the instructor signup title", async ({ page }) => {
			await expect(page.getByText("Register as Instructor")).toBeVisible();
		});

		test("does not show school-specific fields", async ({ page }) => {
			await expect(page.getByLabel("School Name")).not.toBeVisible();
		});
	});

	test.describe("school type (?type=school)", () => {
		test.beforeEach(async ({ page }) => {
			await page.goto(`${SIGNUP_URL}?type=school`);
		});

		test("renders the school registration title", async ({ page }) => {
			await expect(page.getByText("Register your School")).toBeVisible();
		});

		test("renders school name and address fields", async ({ page }) => {
			await expect(page.getByLabel("School Name")).toBeVisible();
			await expect(page.getByLabel("School Address")).toBeVisible();
		});
	});
});

test.describe("Signup page logic", () => {
	test.beforeEach(async () => {
		await clearMailpit();
	});

	test("successfully registers a student, confirms email, and logs in", async ({
		page,
	}) => {
		const email = `test-playwright-signup-student-${Date.now()}@example.com`;
		await page.goto(SIGNUP_URL);

		try {
			await page.getByLabel("Full Name").fill("Playwright Student");
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel(/^password$/i).fill("Password123");
			await page.getByLabel("Confirm Password").fill("Password123");
			await page.getByLabel("Confirm Password").blur();
			await page.waitForTimeout(200);

			await page.getByRole("button", { name: /create account/i }).click();

			await expect(page.getByText("Check your email")).toBeVisible();
			await expect(
				page.getByText(/We've sent a confirmation link/i)
			).toBeVisible();

			const verificationLink = await getLatestEmailLink(email);
			await page.goto(verificationLink);

			await expect(page).toHaveURL(/\/d/);
		} finally {
			await deleteUserByEmail(email);
		}
	});

	test("successfully registers an instructor, confirms email, and logs in", async ({
		page,
	}) => {
		const email = `test-playwright-signup-instructor-${Date.now()}@example.com`;
		await page.goto(`${SIGNUP_URL}?type=instructor`);

		try {
			await page.getByLabel("Full Name").fill("Playwright Instructor");
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel(/^password$/i).fill("Password123");
			await page.getByLabel("Confirm Password").fill("Password123");
			await page.getByLabel("Confirm Password").blur();
			await page.waitForTimeout(200);

			await page.getByRole("button", { name: /register/i }).click();

			await expect(page.getByText("Check your email")).toBeVisible();

			const verificationLink = await getLatestEmailLink(email);
			await page.goto(verificationLink);

			await expect(page).toHaveURL(/\/d\/instructor/);
		} finally {
			await deleteUserByEmail(email);
		}
	});

	test("successfully registers a school owner, confirms email, and logs in", async ({
		page,
	}) => {
		const email = `test-playwright-signup-school-${Date.now()}@example.com`;
		await page.goto(`${SIGNUP_URL}?type=school`);

		try {
			await page.getByLabel("Full Name").fill("Playwright School Manager");
			await page.getByLabel("School Name").fill("Playwright School");
			await page.getByLabel("School Address").fill("123 Testing Street");
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel(/^password$/i).fill("Password123");
			await page.getByLabel("Confirm Password").fill("Password123");
			await page.getByLabel("Confirm Password").blur();
			await page.waitForTimeout(200);

			await page.getByRole("button", { name: /register/i }).click();

			await expect(page.getByText("Check your email")).toBeVisible();

			const verificationLink = await getLatestEmailLink(email);
			await page.goto(verificationLink);

			await expect(page).toHaveURL(/\/d\/school\//);
		} finally {
			await deleteUserByEmail(email);
		}
	});

	test("shows an error when registering with an existing email", async ({
		page,
	}) => {
		const email = `test-playwright-existing-${Date.now()}@example.com`;
		const { error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: "Password123",
			email_confirm: true,
			user_metadata: {
				full_name: "Existing User",
				role: "student",
				locale: "en",
			},
		});
		expect(error).toBeNull();

		try {
			await page.goto(SIGNUP_URL);
			await page.getByLabel("Full Name").fill("Duplicate Name");
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel(/^password$/i).fill("Password123");
			await page.getByLabel("Confirm Password").fill("Password123");
			await page.getByLabel("Confirm Password").blur();
			await page.waitForTimeout(200);

			await page.getByRole("button", { name: /create account/i }).click();

			await expect(page.locator('[data-slot="alert"]')).toContainText(
				/already/i
			);
		} finally {
			await deleteUserByEmail(email);
		}
	});
});
