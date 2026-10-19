import { expect, test } from "@playwright/test";

// Seed data always has published "ریاضی" (math) courses and library books,
// so it works as a stable, locale-independent search term across environments.
const QUERY = "ریاضی";
const HOME_URL = "/en";

test.describe("Global search", () => {
	// Next.js dev mode compiles routes on first visit, which can take several
	// seconds — warm up the dynamic pages this suite navigates to so the actual
	// assertions aren't racing a cold compile.
	test.beforeAll(async ({ request }) => {
		await request.get(`/en/search?q=${encodeURIComponent(QUERY)}`);
		// Compiling the dynamic route template once (any id) is enough for Next.js
		// dev mode to serve every other id under it instantly.
		await request.get("/en/courses/warmup");
		await request.get("/en/libraries/warmup");
	});

	test("shows grouped suggestions while typing", async ({ page }) => {
		await page.goto(HOME_URL);

		const searchInput = page.getByPlaceholder("Search...");
		await searchInput.fill(QUERY);

		await expect(page.getByRole("option").first()).toBeVisible();
		await expect(
			page.getByRole("listbox").getByText("Courses", { exact: true })
		).toBeVisible();
	});

	test("clicking a suggestion navigates to its detail page", async ({
		page,
	}) => {
		await page.goto(HOME_URL);

		const searchInput = page.getByPlaceholder("Search...");
		await searchInput.fill(QUERY);

		const firstOption = page.getByRole("option").first();
		await expect(firstOption).toBeVisible();
		await firstOption.click();

		await expect(page).toHaveURL(/\/en\/(courses|libraries|decks)\//);
	});

	test("pressing Enter navigates to the full search results page", async ({
		page,
	}) => {
		await page.goto(HOME_URL);

		const searchInput = page.getByPlaceholder("Search...");
		await searchInput.fill(QUERY);
		await expect(page.getByRole("option").first()).toBeVisible();

		await searchInput.press("Enter");

		await expect(page).toHaveURL(
			new RegExp(`/en/search\\?q=${encodeURIComponent(QUERY)}`)
		);
		await expect(page.getByRole("tab", { name: "All" })).toBeVisible();
	});
});
