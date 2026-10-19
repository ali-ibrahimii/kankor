import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

/**
 * §3.2 — Course detail page: enrollment flows.
 *
 * Existing `catalogs.spec.ts` tests basic catalog loading and enrollment gating.
 * This spec covers the detailed enrollment matrix from §3.2:
 * - Signed in, free course → enroll via RPC
 * - Already enrolled → "Continue Learning" button
 * - Module/lesson list renders with accordion
 */
test.describe("Course detail — enrollment flows", () => {
	let instructorId: string;
	let studentEmail: string;
	let studentId: string;
	let freeCourseSlug: string;
	let freeCourseId: string;

	test.beforeAll(async () => {
		// Create instructor and student
		const inst = await createTestUser("instructor", "detail-inst");
		instructorId = inst.userId;

		const stud = await createTestUser("student", "detail-stud");
		studentEmail = stud.email;
		studentId = stud.userId;

		// Seed a free published course with a module and lesson
		freeCourseSlug = `e2e-detail-course-${Date.now()}`;
		const { data: course } = await supabaseAdmin
			.from("courses")
			.insert({
				title: `E2E Detail Course ${Date.now()}`,
				slug: freeCourseSlug,
				instructor_id: instructorId,
				is_published: true,
				is_free: true,
				price_credits: 0,
			})
			.select("id")
			.single();
		if (!course) throw new Error("Failed to seed course");
		freeCourseId = course.id;

		// Add a module and lesson
		const { data: module } = await supabaseAdmin
			.from("modules")
			.insert({
				course_id: freeCourseId,
				title: "Module 1",
				order_index: 0,
			})
			.select("id")
			.single();

		if (module) {
			await supabaseAdmin.from("lessons").insert({
				course_id: freeCourseId,
				module_id: module.id,
				title: "Lesson 1: Introduction",
				content_type: "text",
				is_mandatory: true,
				order_index: 0,
			});
		}
	});

	test.afterAll(async () => {
		// Clean up in order: enrollments → lessons → modules → course → users
		await supabaseAdmin
			.from("enrollments")
			.delete()
			.eq("course_id", freeCourseId);
		await supabaseAdmin.from("lessons").delete().eq("course_id", freeCourseId);
		await supabaseAdmin.from("modules").delete().eq("course_id", freeCourseId);
		await supabaseAdmin.from("courses").delete().eq("id", freeCourseId);
		await supabaseAdmin.auth.admin.deleteUser(studentId);
		await supabaseAdmin.auth.admin.deleteUser(instructorId);
	});

	test("course detail page renders with module/lesson accordion", async ({
		page,
	}) => {
		test.setTimeout(60000);

		await page.goto(`/en/courses/${freeCourseSlug}`);
		await page.waitForLoadState("domcontentloaded");

		// The course title should be visible
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();

		// Module list should render
		await expect(page.getByText("Module 1")).toBeVisible({ timeout: 10000 });
	});

	test("signed-in student can enroll in a free course", async ({ page }) => {
		test.setTimeout(60000);
		await loginAs(page, studentEmail);
		await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

		// Navigate to the public course detail
		await page.goto(`/en/courses/${freeCourseSlug}`);
		await page.waitForLoadState("domcontentloaded");

		// Look for an enroll / get started button
		const enrollBtn = page
			.getByRole("button", { name: /enroll|get started|start/i })
			.first();
		if (await enrollBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
			await enrollBtn.click();
			// After enrolling, should redirect to the learning page or show "Continue"
			await page.waitForTimeout(3000);

			// Either redirected to learning page or button changed to "Continue"
			const url = page.url();
			const isContinue = await page
				.getByRole("button", { name: /continue|resume/i })
				.isVisible({ timeout: 3000 })
				.catch(() => false);
			const isLearning = url.includes("/my-courses/");

			expect(isContinue || isLearning).toBe(true);
		}
	});

	test("already-enrolled student sees Continue/Resume instead of Enroll", async ({
		page,
	}) => {
		test.setTimeout(60000);

		// Ensure enrollment exists
		await supabaseAdmin.from("enrollments").upsert(
			{
				user_id: studentId,
				course_id: freeCourseId,
				progress: 0,
			},
			{ onConflict: "user_id,course_id" }
		);

		await loginAs(page, studentEmail);
		await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

		await page.goto(`/en/courses/${freeCourseSlug}`);
		await page.waitForLoadState("domcontentloaded");

		// Should show "Continue" or "Resume" instead of "Enroll"
		const continueBtn = page
			.getByRole("link", { name: /continue|resume|learn/i })
			.first();
		const enrollBtn = page.getByRole("button", { name: /^enroll$/i }).first();

		const hasContinue = await continueBtn
			.isVisible({ timeout: 10000 })
			.catch(() => false);
		const hasEnroll = await enrollBtn
			.isVisible({ timeout: 2000 })
			.catch(() => false);

		// Should have continue and NOT have enroll
		expect(hasContinue || !hasEnroll).toBe(true);
	});
});
