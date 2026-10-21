import { expect, test } from "@playwright/test";

test.describe("Home page, horizontal category shelves & i18n", () => {
	test("default Dari locale serves horizontal category shelves, 'دیدن بیشتر' links, card images, and partners", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
		await expect(page.locator("html")).toHaveAttribute("lang", "fa");
		await expect(page.locator("h1")).toContainText(
			"هر جا بخوانید. کانکور را قبول شوید."
		);

		for (const sectionId of [
			"school-courses",
			"school-books",
			"general-books",
			"flashcards",
			"kankor-forms",
			"partners",
		]) {
			const section = page.getByTestId(`home-section-${sectionId}`);
			await expect(section).toBeVisible();
		}

		const viewMoreLinks = page.getByRole("link", { name: "دیدن بیشتر" });
		await expect(viewMoreLinks).toHaveCount(5);
	});

	test("English locale serves LTR with localized shelves and Sign in button", async ({
		page,
	}) => {
		await page.goto("/en");

		await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		await expect(page.locator("h1")).toContainText(
			"Study anywhere. Pass the Kankor."
		);
		await expect(
			page.locator("header").getByRole("link", { name: "Sign in" })
		).toBeVisible();
		await expect(page.getByRole("link", { name: "View more" })).toHaveCount(5);
	});

	test("header Sign in navigates to /auth/login", async ({ page }) => {
		await page.goto("/en");
		await page.locator("header").getByRole("link", { name: "Sign in" }).click();
		await expect(page).toHaveURL(/\/en\/auth\/login$/);
	});
});
