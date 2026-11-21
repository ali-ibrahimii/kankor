import { expect, test } from "@playwright/test";

// Public shell only. No credentials, mutations, or dashboard fixtures required.
for (const locale of ["fa", "ps", "en"]) {
	test(`${locale}: public design is responsive and preserves catalog navigation`, async ({
		page,
	}) => {
		await page.goto(`/${locale}`);
		await page.waitForLoadState("networkidle");
		await expect(page.locator(".landing-hero h1")).toBeVisible();
		await expect(page.locator(".hero-portrait")).toBeVisible();
		await expect(page.locator(".learning-step")).toHaveCount(3);
		await expect(page.locator(".public-site")).toHaveCSS(
			"--brand-teal",
			"#02656b"
		);
		await expect(page.locator(".course-grid")).toHaveCSS(
			"grid-template-columns",
			/\S+ \S+ \S+/
		);
		const courseLink = page.locator(".hero-actions a").first();
		await expect(courseLink).toHaveAttribute(
			"href",
			new RegExp(`/${locale}/courses`)
		);
		for (const width of [390, 768, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			await expect(page.locator(".landing-hero h1")).toBeVisible();
			const overflows = await page.evaluate(
				() => document.documentElement.scrollWidth > window.innerWidth
			);
			expect(overflows).toBe(false);
		}
		await page.evaluate(() => document.documentElement.classList.add("dark"));
		await expect(page.locator(".public-site")).toHaveCSS(
			"--background",
			"#251c19"
		);
		await page.evaluate(() =>
			document.documentElement.classList.remove("dark")
		);
		await courseLink.click();
		await expect(page).toHaveURL(new RegExp(`/${locale}/courses`), {
			timeout: 30000,
		});
		await expect(page.locator("main h1")).toBeVisible();
	});
}

test("public palette does not leak into the isolated dashboard demo", async ({
	page,
}) => {
	await page.goto("/fa");
	await expect(page.locator(".public-site")).toBeVisible();
	await page.goto("/fa/demo");
	await expect(page.locator(".public-site")).toHaveCount(0);
	const background = await page
		.locator("body")
		.evaluate((element) =>
			getComputedStyle(element).getPropertyValue("--background").trim()
		);
	expect(background).not.toBe("#fffcf7");
});
