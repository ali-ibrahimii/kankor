import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

/**
 * Course and deck detail pages: rating & reviews.
 *
 * Reviews are lazy-loaded (IntersectionObserver) once the section scrolls
 * into view, and writing one is gated behind an active enrollment — both
 * enforced again server-side by `submit_review()`.
 */
test.describe("Reviews", () => {
	test("enrolled student can rate and review a course", async ({ page }) => {
		test.setTimeout(60000);

		const { email, userId } = await createTestUser("student", "course-review");
		const instructor = await createTestUser("instructor", "course-review-inst");
		const courseSlug = `e2e-review-course-${Date.now()}`;
		let courseId: string | undefined;

		try {
			const { data: course, error: courseError } = await supabaseAdmin
				.from("courses")
				.insert({
					title: `E2E Review Course ${Date.now()}`,
					slug: courseSlug,
					instructor_id: instructor.userId,
					is_published: true,
					is_free: true,
					price_credits: 0,
				})
				.select("id")
				.single();
			expect(courseError).toBeNull();
			courseId = course?.id;

			await supabaseAdmin
				.from("enrollments")
				.insert({ user_id: userId, course_id: courseId });

			await loginAs(page, email);
			await expect(page).toHaveURL(/\/d/);

			await page.goto(`/en/courses/${courseSlug}`);
			await page.waitForLoadState("domcontentloaded");

			const writeReviewBtn = page.getByRole("button", {
				name: /write a review/i,
			});
			await writeReviewBtn.scrollIntoViewIfNeeded();
			await expect(writeReviewBtn).toBeVisible({ timeout: 10000 });
			await writeReviewBtn.click();

			await page.getByRole("radio", { name: "5" }).click();
			await page
				.getByPlaceholder(/share your experience/i)
				.fill("Fantastic course, learned a lot!");
			await page.getByRole("button", { name: /^submit review$/i }).click();

			await expect(page.getByText(/review submitted/i)).toBeVisible({
				timeout: 10000,
			});
			await expect(
				page.getByText("Fantastic course, learned a lot!")
			).toBeVisible({ timeout: 10000 });
			await expect(page.getByText(/you reviewed this/i)).toBeVisible();
		} finally {
			if (courseId) {
				await supabaseAdmin.from("reviews").delete().eq("course_id", courseId);
				await supabaseAdmin
					.from("enrollments")
					.delete()
					.eq("course_id", courseId);
				await supabaseAdmin.from("courses").delete().eq("id", courseId);
			}
			await supabaseAdmin.auth.admin.deleteUser(userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("enrolled student can rate and review a public deck", async ({
		page,
	}) => {
		test.setTimeout(60000);

		const { email, userId } = await createTestUser("student", "deck-review");
		const deckName = `E2E Review Deck ${Date.now()}`;
		let deckId: string | undefined;

		try {
			const { data: deck, error: deckError } = await supabaseAdmin
				.from("decks")
				.insert({
					name: deckName,
					user_id: userId,
					algorithm: "fsrs",
					visibility: "public",
					creation: "custom",
					is_free: true,
				})
				.select("id, slug")
				.single();
			expect(deckError).toBeNull();
			deckId = deck?.id;

			await supabaseAdmin
				.from("enrollments")
				.insert({ user_id: userId, deck_id: deckId });

			await loginAs(page, email);
			await expect(page).toHaveURL(/\/d/);

			await page.goto(`/en/decks/${deck!.slug ?? deckId}`);
			await page.waitForLoadState("domcontentloaded");

			const writeReviewBtn = page.getByRole("button", {
				name: /write a review/i,
			});
			await writeReviewBtn.scrollIntoViewIfNeeded();
			await expect(writeReviewBtn).toBeVisible({ timeout: 10000 });
			await writeReviewBtn.click();

			await page.getByRole("radio", { name: "4" }).click();
			await page.getByRole("button", { name: /^submit review$/i }).click();

			await expect(page.getByText(/review submitted/i)).toBeVisible({
				timeout: 10000,
			});
			await expect(page.getByText(/you reviewed this/i)).toBeVisible();
		} finally {
			if (deckId) {
				await supabaseAdmin.from("reviews").delete().eq("deck_id", deckId);
				await supabaseAdmin.from("enrollments").delete().eq("deck_id", deckId);
				await supabaseAdmin.from("decks").delete().eq("id", deckId);
			}
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});
});
