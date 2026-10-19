import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";

/**
 * Regression suite for docs/user_flows.md §3.6 / §8.7: public detail pages
 * previously 404'd unpredictably on first load for slugs containing
 * non-ASCII (Persian/Dari/Pashto) text (see the `generate_slug()` trigger +
 * `decodeSlugParam()` fix). Each entity type inserts a Persian-titled row,
 * reads back the DB-generated slug, and confirms the public detail page
 * resolves — not a 404 — using a real Persian title rather than a
 * hand-picked slug string.
 */
test.describe("Non-ASCII slug regression", () => {
	test.describe.configure({ timeout: 90_000 });

	test("a Persian-titled course resolves on its public detail page", async ({
		page,
	}) => {
		const instructor = (
			await supabaseAdmin
				.from("profiles")
				.select("id")
				.eq("role", "instructor")
				.limit(1)
				.single()
		).data;
		expect(instructor).toBeTruthy();

		const title = `دوره ریاضیات پیشرفته ${Date.now()}`;
		const { data: course, error } = await supabaseAdmin
			.from("courses")
			.insert({
				title,
				instructor_id: instructor!.id,
				is_published: true,
				is_free: true,
				price_credits: 0,
			})
			.select("id, slug")
			.single();
		expect(error).toBeNull();

		try {
			expect(course?.slug).toBeTruthy();
			await page.goto(`/en/courses/${encodeURIComponent(course!.slug!)}`);
			await expect(page.getByRole("heading", { name: title })).toBeVisible();
		} finally {
			if (course?.id)
				await supabaseAdmin.from("courses").delete().eq("id", course.id);
		}
	});

	test("a Persian-titled deck resolves on its public detail page", async ({
		page,
	}) => {
		const instructor = (
			await supabaseAdmin
				.from("profiles")
				.select("id")
				.eq("role", "instructor")
				.limit(1)
				.single()
		).data;
		expect(instructor).toBeTruthy();

		const name = `دسته کارت‌های واژگان ${Date.now()}`;
		const { data: deck, error } = await supabaseAdmin
			.from("decks")
			.insert({
				name,
				user_id: instructor!.id,
				is_free: true,
				visibility: "public",
				algorithm: "fsrs",
				creation: "custom",
			})
			.select("id, slug")
			.single();
		expect(error).toBeNull();

		try {
			expect(deck?.slug).toBeTruthy();
			await page.goto(`/en/decks/${encodeURIComponent(deck!.slug!)}`);
			await expect(page.getByRole("heading", { name })).toBeVisible();
		} finally {
			if (deck?.id)
				await supabaseAdmin.from("decks").delete().eq("id", deck.id);
		}
	});

	test("a Persian-titled library book resolves on its public detail page", async ({
		page,
	}) => {
		const title = `کتاب فیزیک دوازدهم ${Date.now()}`;
		const { data: library, error } = await supabaseAdmin
			.from("libraries")
			.insert({
				title,
				file_path: `test/${Date.now()}.pdf`,
				uri: `test/${Date.now()}.pdf`,
			})
			.select("id, slug")
			.single();
		expect(error).toBeNull();

		try {
			expect(library?.slug).toBeTruthy();
			await page.goto(`/en/libraries/${encodeURIComponent(library!.slug!)}`);
			await expect(page.getByRole("heading", { name: title })).toBeVisible();
		} finally {
			if (library?.id)
				await supabaseAdmin.from("libraries").delete().eq("id", library.id);
		}
	});

	test("a Persian-titled quiz resolves on its public detail page", async ({
		page,
	}) => {
		const instructor = (
			await supabaseAdmin
				.from("profiles")
				.select("id")
				.eq("role", "instructor")
				.limit(1)
				.single()
		).data;
		expect(instructor).toBeTruthy();

		const title = `آزمون آزمایشی کانکور ${Date.now()}`;
		const { data: quiz, error } = await supabaseAdmin
			.from("quizzes")
			.insert({
				title,
				user_id: instructor!.id,
				is_free: true,
				visibility: "public",
			})
			.select("id, slug")
			.single();
		expect(error).toBeNull();

		try {
			expect(quiz?.slug).toBeTruthy();
			await page.goto(`/en/quizzes/${encodeURIComponent(quiz!.slug!)}`);
			await expect(page.getByRole("heading", { name: title })).toBeVisible();
		} finally {
			if (quiz?.id)
				await supabaseAdmin.from("quizzes").delete().eq("id", quiz.id);
		}
	});
});
