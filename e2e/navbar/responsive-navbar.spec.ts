import { expect, test } from "@playwright/test";

test.describe("Responsive Navbar", () => {
	test("mobile viewport renders search as a button, opens search modal, and shows clean School sheet without standalone Library tab", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/en");

		const header = page.locator("header");
		await expect(header.getByRole("link", { name: "School" })).toBeHidden();

		const searchButton = page.getByTestId("mobile-search-trigger");
		await expect(searchButton).toBeVisible();
		await searchButton.click();

		const searchDialog = page.getByTestId("mobile-search-dialog");
		await expect(searchDialog).toBeVisible();
		await expect(searchDialog.getByPlaceholder("Search...")).toBeVisible();
		await page.keyboard.press("Escape");

		const menuButton = page.getByRole("button", { name: "Open menu" });
		await expect(menuButton).toBeVisible();
		await menuButton.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(
			dialog.getByRole("link", { name: "School Textbooks" })
		).toBeVisible();
		await expect(
			dialog.getByRole("link", { name: "Library & General Books" })
		).toBeVisible();
		await expect(
			dialog.getByRole("link", { name: "General Kankor Forms" })
		).toBeVisible();
	});

	test("desktop viewport hides standalone Library tab, shows 'مکتب', and reveals hover mega-menu", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");

		await expect(
			page.getByRole("button", { name: "باز کردن منو" })
		).toBeHidden();
		await expect(page.getByTestId("mobile-search-trigger")).toBeHidden();

		const schoolTab = page
			.getByTestId("school-mega-menu")
			.getByRole("link", { name: "مکتب" });
		await expect(schoolTab).toBeVisible();

		await schoolTab.hover();
		const panel = page.getByTestId("school-mega-menu-panel");
		await expect(panel).toBeVisible();
		await expect(
			panel.getByRole("link", { name: /کتاب‌های درسی مکتب/ })
		).toBeVisible();
		await expect(
			panel.getByRole("link", { name: /کتابخانه و کتاب‌های عمومی/ })
		).toBeVisible();
		await expect(
			panel.getByRole("link", { name: /فورم‌های عمومی کانکور/ })
		).toBeVisible();
	});
});
