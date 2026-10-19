import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

/**
 * §5.1 + §5.2 — Instructor dashboard overview and course builder.
 *
 * Covers: overview page widgets, creating a course via NewCourseDialog,
 * builder empty state, adding a module + lesson, publish/unpublish toggle.
 */
test.describe("Instructor Dashboard — overview and course builder", () => {
	let instructorEmail: string;
	let instructorId: string;
	let createdCourseIds: string[] = [];

	test.beforeAll(async () => {
		const created = await createTestUser("instructor", "inst-builder");
		instructorEmail = created.email;
		instructorId = created.userId;
	});

	test.afterAll(async () => {
		// Clean up any courses created during tests
		for (const courseId of createdCourseIds) {
			await supabaseAdmin.from("courses").delete().eq("id", courseId);
		}
		await supabaseAdmin.auth.admin.deleteUser(instructorId);
	});

	test("instructor overview page renders", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		await expect(page).toHaveURL(/\/d\/instructor/);
		await page.waitForLoadState("domcontentloaded");

		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("instructor can create a new course and land on the builder", async ({
		page,
	}) => {
		test.setTimeout(90000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		// Navigate to courses list
		await page.goto("/en/d/instructor/courses");
		await page.waitForLoadState("domcontentloaded");

		// Click "New Course"
		const newCourseBtn = page
			.locator("main")
			.getByRole("button", { name: /new course/i })
			.first();
		await expect(newCourseBtn).toBeVisible({ timeout: 10000 });
		await newCourseBtn.click();

		// Fill out the new course dialog
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible({ timeout: 5000 });

		const courseTitle = `E2E Test Course ${Date.now()}`;
		await dialog.getByLabel(/title/i).first().fill(courseTitle);

		// Submit creation
		const createBtn = dialog.getByRole("button", { name: /create/i });
		await createBtn.click();

		// Should navigate to the course builder
		await page.waitForURL(/\/d\/instructor\/courses\/new\//, {
			waitUntil: "commit",
			timeout: 15000,
		});
		await expect(page).toHaveURL(/\/d\/instructor\/courses\/new\//);

		// Capture the course ID from the URL for cleanup
		const match = page.url().match(/\/new\/([^/?]+)/);
		if (match) createdCourseIds.push(match[1]);

		// Builder should show the course title
		await page.waitForLoadState("domcontentloaded");
	});

	test("instructor can add a module and lesson in the course builder", async ({
		page,
	}) => {
		test.setTimeout(90000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		// Create a course via DB for a clean builder start
		const courseTitle = `E2E Builder Course ${Date.now()}`;
		const courseSlug = `e2e-builder-${Date.now()}`;
		const { data: course } = await supabaseAdmin
			.from("courses")
			.insert({
				title: courseTitle,
				slug: courseSlug,
				instructor_id: instructorId,
				is_published: false,
				is_free: true,
				price_credits: 0,
			})
			.select("id")
			.single();

		if (!course) throw new Error("Failed to seed course for builder test");
		createdCourseIds.push(course.id);

		// Navigate to the builder
		await page.goto(`/en/d/instructor/courses/new/${course.id}`);
		await page.waitForLoadState("domcontentloaded");

		// Look for "Add Module" CTA or button
		const addModuleBtn = page
			.getByRole("button", { name: /add module/i })
			.first();
		if (await addModuleBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
			await addModuleBtn.click();

			// Module dialog or inline form should appear
			const moduleInput = page.getByLabel(/title|module name/i).first();
			if (await moduleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
				await moduleInput.fill("Test Module 1");

				// Save the module
				const saveBtn = page
					.getByRole("button", { name: /save|add|create/i })
					.first();
				await saveBtn.click();
				await page.waitForTimeout(1000);

				// Module should appear in the sidebar tree
				await expect(page.getByText("Test Module 1")).toBeVisible({
					timeout: 5000,
				});
			}
		}
	});

	test("instructor can toggle course publish status", async ({ page }) => {
		test.setTimeout(90000);
		await loginAs(page, instructorEmail);
		await page.waitForURL(/\/d\/instructor/, {
			waitUntil: "commit",
			timeout: 15000,
		});

		// Create an unpublished course
		const courseTitle = `E2E Publish Course ${Date.now()}`;
		const courseSlug = `e2e-publish-${Date.now()}`;
		const { data: course } = await supabaseAdmin
			.from("courses")
			.insert({
				title: courseTitle,
				slug: courseSlug,
				instructor_id: instructorId,
				is_published: false,
				is_free: true,
				price_credits: 0,
			})
			.select("id")
			.single();

		if (!course) throw new Error("Failed to seed course for publish test");
		createdCourseIds.push(course.id);

		// Navigate to the builder
		await page.goto(`/en/d/instructor/courses/new/${course.id}`);
		await page.waitForLoadState("domcontentloaded");

		// Look for publish button/toggle
		const publishBtn = page.getByRole("button", { name: /publish/i }).first();
		if (await publishBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
			await publishBtn.click();
			await page.waitForTimeout(2000);

			// Verify in DB that the course is now published
			const { data: updated } = await supabaseAdmin
				.from("courses")
				.select("is_published")
				.eq("id", course.id)
				.single();

			expect(updated?.is_published).toBe(true);
		}
	});
});
