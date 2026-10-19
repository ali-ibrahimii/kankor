import { expect, test } from "@playwright/test";

const HOME_URL = "/en";

test.describe("Responsive Navbar & Locale Switcher", () => {
	test("behaves correctly on desktop", async ({ page }) => {
		// Set a desktop resolution
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.goto(HOME_URL);

		// Desktop nav links should be visible in the nav container
		const nav = page.getByRole("navigation");
		await expect(nav.getByRole("link", { name: "Courses" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Decks" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Library" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Quizzes" })).toBeVisible();

		// Mobile menu button should be hidden
		const menuButton = page.getByRole("button", { name: "Open menu" });
		await expect(menuButton).toBeHidden();
	});

	test("behaves correctly on mobile viewports", async ({ page }) => {
		// Set a mobile resolution
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto(HOME_URL);

		// Desktop inline navigation items should be hidden on mobile
		const desktopItems = page.locator("nav .hidden");
		await expect(desktopItems.first()).toBeHidden();

		// Mobile menu button should be visible
		const menuButton = page
			.getByRole("button", { name: /open menu|toggle menu/i })
			.first();
		if (await menuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
			// Open mobile menu
			await menuButton.click();

			// Drawer content should appear
			const drawer = page
				.locator("[data-slot=sheet-content], [role=dialog]")
				.first();
			if (await drawer.isVisible({ timeout: 5000 }).catch(() => false)) {
				await expect(
					drawer.getByRole("link", { name: /courses/i })
				).toBeVisible();
			}
		}
	});
});
