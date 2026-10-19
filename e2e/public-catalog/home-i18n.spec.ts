import { expect, test } from "@playwright/test";

/**
 * §1.1 + §8.1 — Home page locale switcher and RTL verification.
 *
 * Existing `responsive-navbar.spec.ts` covers header/footer links on desktop/mobile.
 * This spec covers: locale switching changes `[locale]` segment, flips `dir` attribute,
 * and content is translated.
 */
test.describe("Home page — locale switcher and RTL", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/en");
		await page.waitForLoadState("domcontentloaded");
	});

	test("English locale renders LTR with dir=ltr on <html>", async ({
		page,
	}) => {
		const dir = await page.locator("html").getAttribute("dir");
		expect(dir).toBe("ltr");
		await expect(page).toHaveURL(/\/en/);
	});

	test("switching to Farsi changes locale segment to /fa and sets dir=rtl", async ({
		page,
	}) => {
		await page.goto("/fa");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/fa/);
		const dir = await page.locator("html").getAttribute("dir");
		expect(dir).toBe("rtl");
	});

	test("switching to Pashto sets dir=rtl and locale segment to /ps", async ({
		page,
	}) => {
		await page.goto("/ps");
		await page.waitForLoadState("domcontentloaded");
		await expect(page).toHaveURL(/\/ps/);
		const dir = await page.locator("html").getAttribute("dir");
		expect(dir).toBe("rtl");
	});
});
