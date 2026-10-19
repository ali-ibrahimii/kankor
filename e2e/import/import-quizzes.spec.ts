import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";

// Auth pages use a locale prefix — default locale is 'fa' but we test with 'en'
// to keep assertions in English.
const LOGIN_URL = "/en/auth/login";
const INSTRUCTOR_QUIZZES_URL = "/en/d/instructor/quizzes";

test.describe("Generic import engine — instructor quizzes", () => {
	test("imports quizzes from a CSV file via the Import dialog", async ({
		page,
	}) => {
		const email = `test-playwright-import-instructor-${Date.now()}@example.com`;
		const quizTitle = `Imported Quiz ${Date.now()}`;

		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: "ValidPassword123",
			email_confirm: true,
			user_metadata: {
				full_name: "Test Import Instructor",
				role: "instructor",
				locale: "en",
			},
		});
		expect(error).toBeNull();
		const userId = data?.user?.id;
		if (!userId) throw new Error("createUser did not return user id");

		// Correct the profile's role, locale, and instructor_status
		const { error: patchErr } = await supabaseAdmin
			.from("profiles")
			.update({ role: "instructor", locale: "en", instructor_status: "active" })
			.eq("id", userId);
		expect(patchErr).toBeNull();

		const csvPath = path.join(os.tmpdir(), `import-quizzes-${Date.now()}.csv`);
		fs.writeFileSync(csvPath, `title\n${quizTitle}\n`);

		// Ensure profile trigger has completed
		for (let i = 0; i < 10; i++) {
			const { data: p } = await supabaseAdmin
				.from("profiles")
				.select("id")
				.eq("id", userId)
				.maybeSingle();
			if (p) break;
			await new Promise((r) => setTimeout(r, 200));
		}

		try {
			// Log in as the seeded instructor.
			await page.goto(LOGIN_URL);
			await page.waitForLoadState("networkidle");
			await page.getByLabel("Email Address").fill(email);
			await page.getByLabel("Password").fill("ValidPassword123");
			await page.getByLabel("Password").blur();
			await page.waitForTimeout(200);
			await page.getByRole("button", { name: /^login$/i }).click();
			await page.waitForURL(/\/d\/instructor/, {
				waitUntil: "commit",
				timeout: 15000,
			});

			await page.goto(INSTRUCTOR_QUIZZES_URL);

			// Open the generic Import dialog from the quiz list.
			await page.getByRole("button", { name: /^import$/i }).click();
			await expect(page.getByText("Import data")).toBeVisible();

			// Upload step: pick the CSV file via the (hidden) Dropzone input.
			await page.locator('input[type="file"]').setInputFiles(csvPath);

			// Mapping step: "title" auto-maps to itself, so Continue should be enabled.
			const continueButton = page.getByRole("button", { name: /continue/i });
			await expect(continueButton).toBeEnabled({ timeout: 10_000 });
			await continueButton.click();

			// Preview step: the uploaded row should be visible.
			await expect(page.getByText(quizTitle)).toBeVisible();

			// Import and wait for the result summary (success or failure — either
			// way the dialog should reach a final "row(s) imported" state, not hang).
			await page.getByRole("button", { name: /^import \d+ rows?$/i }).click();
			await expect(page.getByText(/rows? imported/i)).toBeVisible({
				timeout: 15_000,
			});

			await page.getByRole("button", { name: /^done$/i }).click();
		} finally {
			fs.rmSync(csvPath, { force: true });
			// Clean up any quiz the import created before deleting the user.
			await supabaseAdmin.from("quizzes").delete().eq("title", quizTitle);
			if (userId) {
				await supabaseAdmin.auth.admin.deleteUser(userId);
			}
		}
	});
});
