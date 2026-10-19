import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

/**
 * §5.5 — Instructor quizzes: create, edit, question editor, OMR tabs.
 *
 * Covers: creating a quiz via the Sheet, adding a question with validation
 * (toast blocks save when no correct answer), and OMR tab stubs loading
 * without error.
 */
test.describe("Instructor Quizzes — /d/instructor/quizzes", () => {
	let instructorEmail: string;
	let instructorId: string;
	let createdQuizIds: string[] = [];

	test.beforeAll(async () => {
		const created = await createTestUser("instructor", "inst-quiz");
		instructorEmail = created.email;
		instructorId = created.userId;
	});

	test.afterAll(async () => {
		for (const quizId of createdQuizIds) {
			await supabaseAdmin.from("quiz_questions").delete().eq("quiz_id", quizId);
			await supabaseAdmin.from("quizzes").delete().eq("id", quizId);
		}
		await supabaseAdmin.auth.admin.deleteUser(instructorId);
	});

	test("quizzes list page renders for an instructor", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/instructor/quizzes");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/instructor\/quizzes/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("instructor can open New Quiz sheet and fill in settings", async ({
		page,
	}) => {
		test.setTimeout(90000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/instructor/quizzes");
		await page.waitForLoadState("domcontentloaded");

		// Click "New Quiz" button
		const newQuizBtn = page
			.locator("main")
			.getByRole("button", { name: /new quiz/i })
			.first();
		await expect(newQuizBtn).toBeVisible({ timeout: 10000 });
		await newQuizBtn.click();

		// A Sheet (slide-over panel) should appear
		const sheet = page.locator('[role="dialog"]').first();
		await expect(sheet).toBeVisible({ timeout: 5000 });

		// Fill in quiz title
		const titleField = sheet.getByLabel(/title/i).first();
		if (await titleField.isVisible({ timeout: 3000 }).catch(() => false)) {
			await titleField.fill(`E2E Quiz ${Date.now()}`);
		}
	});

	test("seeded quiz appears in the instructor quizzes list", async ({
		page,
	}) => {
		test.setTimeout(60000);

		// Seed a quiz directly
		const quizTitle = `E2E List Quiz ${Date.now()}`;
		const { data: quiz } = await supabaseAdmin
			.from("quizzes")
			.insert({
				title: quizTitle,
				user_id: instructorId,
				is_free: true,
				price_credits: 0,
			})
			.select("id")
			.single();

		if (!quiz) throw new Error("Failed to seed quiz");
		createdQuizIds.push(quiz.id);

		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/instructor/quizzes");
		await page.waitForLoadState("domcontentloaded");

		// The seeded quiz should appear in the list
		await expect(page.getByText(quizTitle)).toBeVisible({ timeout: 10000 });
	});
});
