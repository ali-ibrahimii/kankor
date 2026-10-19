import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

const UUID_PATTERN =
	/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

test.describe("Slug Navigation, Routing, and Data Resolution E2E", () => {
	test.describe.configure({ timeout: 90_000 });

	let instructorId: string;
	let testCourseId: string;
	let testCourseSlug: string;
	let testCourseTitle: string;

	let testQuizId: string;
	let testQuizSlug: string;
	let testQuizTitle: string;

	let testDeckId: string;
	let testDeckSlug: string;
	let testDeckTitle: string;

	let testLibraryId: string;
	let testLibrarySlug: string;
	let testLibraryTitle: string;

	test.beforeAll(async () => {
		const createdInst = await createTestUser("instructor", "slug-inst-setup");
		instructorId = createdInst.userId;

		const timeTag = Date.now();

		// 1. Create a published test course with a slug
		testCourseTitle = `E2E Slug Course ${timeTag}`;
		const { data: course, error: cErr } = await supabaseAdmin
			.from("courses")
			.insert({
				title: testCourseTitle,
				instructor_id: instructorId,
				is_published: true,
				is_free: true,
				price_credits: 0,
			})
			.select("id, slug")
			.single();
		expect(cErr).toBeNull();
		testCourseId = course!.id;
		testCourseSlug = course!.slug!;

		// 2. Create a public test quiz with a slug
		testQuizTitle = `E2E Slug Quiz ${timeTag}`;
		const { data: quiz, error: qErr } = await supabaseAdmin
			.from("quizzes")
			.insert({
				title: testQuizTitle,
				user_id: instructorId,
				is_free: true,
				visibility: "public",
			})
			.select("id, slug")
			.single();
		expect(qErr).toBeNull();
		testQuizId = quiz!.id;
		testQuizSlug = quiz!.slug!;

		// 3. Create a public test deck with a slug
		testDeckTitle = `E2E Slug Deck ${timeTag}`;
		const { data: deck, error: dErr } = await supabaseAdmin
			.from("decks")
			.insert({
				name: testDeckTitle,
				user_id: instructorId,
				is_free: true,
				visibility: "public",
				algorithm: "fsrs",
				creation: "custom",
			})
			.select("id, slug")
			.single();
		expect(dErr).toBeNull();
		testDeckId = deck!.id;
		testDeckSlug = deck!.slug!;

		// 4. Create a public library book with a slug
		testLibraryTitle = `E2E Slug Library ${timeTag}`;
		const { data: library, error: lErr } = await supabaseAdmin
			.from("libraries")
			.insert({
				title: testLibraryTitle,
				file_path: `test/${timeTag}.pdf`,
				uri: `test/${timeTag}.pdf`,
			})
			.select("id, slug")
			.single();
		expect(lErr).toBeNull();
		testLibraryId = library!.id;
		testLibrarySlug = library!.slug!;
	});

	test.afterAll(async () => {
		if (testCourseId) {
			await supabaseAdmin.from("courses").delete().eq("id", testCourseId);
		}
		if (testQuizId) {
			await supabaseAdmin.from("quizzes").delete().eq("id", testQuizId);
		}
		if (testDeckId) {
			await supabaseAdmin.from("decks").delete().eq("id", testDeckId);
		}
		if (testLibraryId) {
			await supabaseAdmin.from("libraries").delete().eq("id", testLibraryId);
		}
		if (instructorId) {
			await supabaseAdmin.auth.admin.deleteUser(instructorId);
		}
	});

	// ─── 1. Public catalog links verify slugs instead of raw UUIDs ─────────────

	test("courses catalog renders links containing slugs and no raw UUIDs", async ({
		page,
	}) => {
		await page.goto("/en/courses");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForTimeout(1000);

		const courseLinks = page.locator("a[href*='courses']");
		const count = await courseLinks.count();
		if (count > 0) {
			for (let i = 0; i < Math.min(count, 5); i++) {
				const href = await courseLinks.nth(i).getAttribute("href");
				if (href && href !== "/courses" && href !== "/en/courses") {
					expect(href).not.toMatch(new RegExp(`/${UUID_PATTERN.source}$`, "i"));
				}
			}
		}
	});

	test("quizzes catalog renders links containing slugs and no raw UUIDs", async ({
		page,
	}) => {
		await page.goto("/en/quizzes");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForTimeout(1000);

		const quizLinks = page.locator("a[href*='quizzes']");
		const count = await quizLinks.count();
		if (count > 0) {
			for (let i = 0; i < Math.min(count, 5); i++) {
				const href = await quizLinks.nth(i).getAttribute("href");
				if (href && href !== "/quizzes" && href !== "/en/quizzes") {
					expect(href).not.toMatch(new RegExp(`/${UUID_PATTERN.source}$`, "i"));
				}
			}
		}
	});

	test("libraries catalog renders links containing slugs and no raw UUIDs", async ({
		page,
	}) => {
		await page.goto("/en/libraries");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForTimeout(1000);

		const libLinks = page.locator("a[href*='libraries']");
		const count = await libLinks.count();
		if (count > 0) {
			for (let i = 0; i < Math.min(count, 5); i++) {
				const href = await libLinks.nth(i).getAttribute("href");
				if (href && href !== "/libraries" && href !== "/en/libraries") {
					expect(href).not.toMatch(new RegExp(`/${UUID_PATTERN.source}$`, "i"));
				}
			}
		}
	});

	// ─── 2. Data loading resolves correctly from decoded URL slug ─────────────

	test("loads course detail page by slug and displays title", async ({
		page,
	}) => {
		await page.goto(`/en/courses/${testCourseSlug}`);
		await page.waitForLoadState("domcontentloaded");
		await expect(
			page.getByRole("heading", { name: testCourseTitle, exact: false })
		).toBeVisible({ timeout: 15000 });
	});

	test("loads quiz detail page by slug and displays title", async ({
		page,
	}) => {
		await page.goto(`/en/quizzes/${testQuizSlug}`);
		await page.waitForLoadState("domcontentloaded");
		await expect(
			page.getByRole("heading", { name: testQuizTitle, exact: false })
		).toBeVisible({ timeout: 15000 });
	});

	test("loads deck detail page by slug and displays title", async ({
		page,
	}) => {
		await page.goto(`/en/decks/${testDeckSlug}`);
		await page.waitForLoadState("domcontentloaded");
		await expect(
			page.getByRole("heading", { name: testDeckTitle, exact: false })
		).toBeVisible({ timeout: 15000 });
	});

	test("loads library detail page by slug and displays title", async ({
		page,
	}) => {
		await page.goto(`/en/libraries/${testLibrarySlug}`);
		await page.waitForLoadState("domcontentloaded");
		await expect(
			page.getByRole("heading", { name: testLibraryTitle, exact: false })
		).toBeVisible({ timeout: 15000 });
	});

	// ─── 3. Invalid slug handling (notFound / 404 response) ───────────────────

	test("handles non-existent course slug gracefully with 404 / notFound", async ({
		page,
	}) => {
		const res = await page.goto("/en/courses/non-existent-course-slug-xyz999");
		expect(res?.status()).toBe(404);
		await expect(page.locator("body")).not.toBeEmpty();
		// Verify URL remains the non-existent slug (no redirection to ID or unexpected crash)
		expect(page.url()).toContain("non-existent-course-slug-xyz999");
	});

	test("handles non-existent quiz slug gracefully with 404 / notFound", async ({
		page,
	}) => {
		const res = await page.goto("/en/quizzes/non-existent-quiz-slug-xyz999");
		expect(res?.status()).toBe(404);
		await expect(page.locator("body")).not.toBeEmpty();
		expect(page.url()).toContain("non-existent-quiz-slug-xyz999");
	});

	test("handles non-existent deck slug gracefully with 404 / notFound", async ({
		page,
	}) => {
		const res = await page.goto("/en/decks/non-existent-deck-slug-xyz999");
		expect(res?.status()).toBe(404);
		await expect(page.locator("body")).not.toBeEmpty();
		expect(page.url()).toContain("non-existent-deck-slug-xyz999");
	});

	test("handles non-existent library slug gracefully with 404 / notFound", async ({
		page,
	}) => {
		const res = await page.goto(
			"/en/libraries/non-existent-library-slug-xyz999"
		);
		expect(res?.status()).toBe(404);
		await expect(page.locator("body")).not.toBeEmpty();
		expect(page.url()).toContain("non-existent-library-slug-xyz999");
	});

	// ─── 4. Authenticated role-based protected slug routes ───────────────────

	test("admin deck edit page loads via slug for admin user", async ({
		page,
	}) => {
		test.setTimeout(90000);
		const { email, userId } = await createTestUser("admin", "slug-admin");
		try {
			await loginAs(page, email);
			await page.goto(`/en/d/admin/decks/${testDeckSlug}/edit`);
			await page.waitForLoadState("domcontentloaded");

			expect(page.url()).toContain(`/d/admin/decks/${testDeckSlug}/edit`);
			await expect(page.locator("main")).toBeVisible();
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});

	test("student learning player page handles invalid course slug with 404", async ({
		page,
	}) => {
		test.setTimeout(90000);
		const { email, userId } = await createTestUser("student", "slug-student");
		try {
			await loginAs(page, email);
			const res = await page.goto(
				"/en/d/my-courses/non-existent-student-course-slug"
			);
			expect(res?.status()).toBe(404);
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});
});
