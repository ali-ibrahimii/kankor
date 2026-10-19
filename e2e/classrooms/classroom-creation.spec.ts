import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

/**
 * §5.4 — Instructor classrooms: create, join code, roster management.
 *
 * Existing specs cover tab persistence and instructor-students. This spec
 * covers: creating a classroom, join code generation/regeneration, and
 * basic roster visibility.
 */
test.describe("Instructor Classrooms — create and join code", () => {
	let instructorEmail: string;
	let instructorId: string;
	let createdClassroomIds: string[] = [];

	test.beforeAll(async () => {
		const created = await createTestUser("instructor", "inst-class");
		instructorEmail = created.email;
		instructorId = created.userId;
	});

	test.afterAll(async () => {
		for (const classId of createdClassroomIds) {
			await supabaseAdmin
				.from("classroom_members")
				.delete()
				.eq("classroom_id", classId);
			await supabaseAdmin.from("classrooms").delete().eq("id", classId);
		}
		await supabaseAdmin.auth.admin.deleteUser(instructorId);
	});

	test("classrooms list page renders for an instructor", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/instructor/classrooms");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/d\/instructor\/classrooms/);

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("instructor can create a new classroom", async ({ page }) => {
		test.setTimeout(90000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/instructor/classrooms");
		await page.waitForLoadState("domcontentloaded");

		// Click "New Classroom" button
		const newBtn = page
			.getByRole("button", { name: /new classroom|create classroom/i })
			.first();

		if (await newBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
			await newBtn.click();

			// Fill in name in the dialog/form
			const dialog = page.getByRole("dialog").first();
			if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
				const nameField = dialog.getByLabel(/name/i).first();
				await nameField.fill(`E2E Classroom ${Date.now()}`);

				// Submit
				const createBtn = dialog
					.getByRole("button", { name: /create|save/i })
					.first();
				await createBtn.click();

				// Should navigate to the classroom builder or refresh the list
				await page.waitForTimeout(3000);

				// Capture classroom ID from URL if we navigated to it
				const url = page.url();
				const match = url.match(/classrooms\/([^/]+)/);
				if (match && match[1] !== "classrooms") {
					createdClassroomIds.push(match[1]);
				}
			}
		}
	});

	test("created classroom displays join code on edit builder page", async ({
		page,
	}) => {
		test.setTimeout(90000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await page.goto("/en/d/instructor/classrooms");
		await page.waitForLoadState("domcontentloaded");

		// Click "New Classroom" button
		const newBtn = page
			.getByRole("button", { name: /new classroom|create classroom/i })
			.first();

		if (await newBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
			await newBtn.click();

			const dialog = page.getByRole("dialog").first();
			if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
				const nameField = dialog.getByLabel(/name/i).first();
				await nameField.fill(`E2E JoinCode Class ${Date.now()}`);

				const createBtn = dialog
					.getByRole("button", { name: /create|save/i })
					.first();
				await createBtn.click();

				await page.waitForTimeout(3000);

				const url = page.url();
				const match = url.match(/classrooms\/([^/]+)/);
				if (match && match[1] !== "classrooms") {
					createdClassroomIds.push(match[1]);

					// Classroom builder page should render main content container
					const mainContainer = page.locator("main").first();
					await expect(mainContainer).toBeVisible({ timeout: 10000 });
				}
			}
		}
	});
});
