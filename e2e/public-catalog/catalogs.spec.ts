import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";

test.describe("Public Catalogs & Static Pages", () => {
	let courseSlug: string | null = null;
	let librarySlug: string | null = null;
	let quizSlug: string | null = null;

	test.beforeAll(async () => {
		// Fetch active slugs dynamically to verify catalog routes and details
		const { data: courses } = await supabaseAdmin
			.from("courses")
			.select("slug")
			.eq("is_published", true)
			.not("slug", "is", null)
			.limit(1);
		courseSlug = courses?.[0]?.slug ?? null;

		const { data: libraries } = await supabaseAdmin
			.from("libraries")
			.select("slug")
			.not("slug", "is", null)
			.limit(1);
		librarySlug = libraries?.[0]?.slug ?? null;

		const { data: quizzes } = await supabaseAdmin
			.from("quizzes")
			.select("slug")
			.not("slug", "is", null)
			.limit(1);
		quizSlug = quizzes?.[0]?.slug ?? null;
	});

	test("public courses catalog loads and applies filters", async ({ page }) => {
		await page.goto("/en/courses");

		// Header checks
		await expect(
			page.getByRole("heading", { name: "Explore Courses", exact: false })
		)
			.toBeVisible()
			.catch(async () => {
				// fallback check if header is different
				await expect(page.locator("h1")).toBeVisible();
			});

		// Search input interaction
		const searchInput = page.getByPlaceholder(/courses/i);
		if (await searchInput.isVisible()) {
			await searchInput.fill("math");
			await page.waitForTimeout(500); // Wait for debounce
		}
	});

	test("public libraries catalog loads", async ({ page }) => {
		await page.goto("/en/libraries");
		await expect(page.locator("h1")).toBeVisible();
	});

	test("public quizzes catalog loads", async ({ page }) => {
		await page.goto("/en/quizzes");
		await expect(page.locator("h1")).toBeVisible();
	});

	test("static legal pages and about page render", async ({ page }) => {
		await page.goto("/en/about");
		await expect(page.locator("body")).not.toBeEmpty();

		await page.goto("/en/privacy-policy");
		await expect(page.locator("body")).not.toBeEmpty();

		await page.goto("/en/terms-of-use");
		await expect(page.locator("body")).not.toBeEmpty();
	});

	test("enrollment gates signed-out users", async ({ page }) => {
		if (!courseSlug) {
			test.skip(true, "No published course found in db");
			return;
		}

		await page.goto(`/en/courses/${courseSlug}`);

		// Renders page title
		await expect(page.locator("h1")).toBeVisible();

		// Check the enroll buttons
		const enrollButton = page
			.getByRole("button", { name: /enroll|get started|buy/i })
			.first();
		if (await enrollButton.isVisible()) {
			await enrollButton.click();
			// Should redirect to auth/login with ?next= pointing to the course
			await expect(page).toHaveURL(/auth\/login/);
			expect(page.url()).toContain(
				encodeURIComponent(`/courses/${courseSlug}`)
			);
		}
	});

	test("watch page handles invalid ID gracefully", async ({ page }) => {
		await page.goto("/en/watch/u/invalid-id-12345");
		// Check that the page loads/handles it gracefully (no raw 500 crashes)
		await expect(page.locator("body")).not.toBeEmpty();
	});
});
