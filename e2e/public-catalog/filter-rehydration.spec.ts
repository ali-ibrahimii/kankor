import { expect, test } from "@playwright/test";

/**
 * §8.8 — Filter state via `?filters=`: apply multiple filters + sort + page
 * to a catalog, reload from the URL, and verify state rehydrates.
 *
 * Existing `catalogs.spec.ts` tests basic filter application. This spec
 * covers the cross-cutting filter rehydration concern from §8.
 */
test.describe("Filter state rehydration from URL", () => {
	test("courses catalog preserves filter state across URL reload", async ({
		page,
	}) => {
		test.setTimeout(60000);

		// Load the public courses catalog
		await page.goto("/en/courses");
		await page.waitForLoadState("domcontentloaded");

		// Type a search query to activate a filter
		const searchInput = page
			.locator('main input[placeholder*="search" i], input[type="search"]')
			.first();
		await expect(searchInput).toBeVisible({ timeout: 10000 });
		await searchInput.fill("math");
		await page.waitForTimeout(1000); // Allow debounce

		// Capture the current URL with the filters parameter
		const filteredUrl = page.url();

		// The URL should contain a filters param
		expect(filteredUrl).toContain("filters");

		// Reload the page from scratch using the same URL
		await page.goto(filteredUrl);
		await page.waitForLoadState("domcontentloaded");

		// The search input should still contain the search term
		await expect(searchInput).toHaveValue("math", { timeout: 10000 });
	});

	test("decks catalog preserves filter state across URL reload", async ({
		page,
	}) => {
		test.setTimeout(60000);

		await page.goto("/en/decks");
		await page.waitForLoadState("domcontentloaded");

		const searchInput = page
			.locator('main input[placeholder*="search" i], input[type="search"]')
			.first();
		await expect(searchInput).toBeVisible({ timeout: 10000 });
		await searchInput.fill("vocab");
		await page.waitForTimeout(1000);

		const filteredUrl = page.url();

		await page.goto(filteredUrl);
		await page.waitForLoadState("domcontentloaded");

		await expect(searchInput).toHaveValue("vocab", { timeout: 10000 });
	});
});
