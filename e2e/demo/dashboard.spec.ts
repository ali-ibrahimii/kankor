import { expect, type Page, test } from "@playwright/test";

/**
 * The public `/demo` route renders the real dashboard overview views with
 * mock data. It must never require a session and must never touch Supabase.
 */

const roles = [
	{ slug: "student", label: "شاگرد", marker: "کارت‌های امروز" },
	{ slug: "instructor", label: "استاد", marker: "میانگین امتیاز" },
	{ slug: "school", label: "مکتب", marker: "اعضای اخیر" },
	{ slug: "admin", label: "ادمین سایت", marker: "ثبت‌نام‌های اخیر" },
] as const;

async function openRole(page: Page, label: string) {
	await page
		.getByRole("group", { name: "نمایش نقش" })
		.getByRole("link", { name: label, exact: true })
		.click();
}

test.describe("Public dashboard demo", () => {
	test("shows the student overview without a signed-in session", async ({
		page,
	}) => {
		await page.goto("/fa/demo");

		await expect(page).toHaveURL(/\/fa\/demo$/);
		await expect(
			page.getByRole("heading", { name: "داشبورد نمایشی ابزار کانکور" })
		).toBeVisible();
		await expect(page.getByText("حالت نمایشی").first()).toBeVisible();
		await expect(page.getByText("کارت‌های امروز")).toBeVisible();
		await expect(page.getByText("ادامه یادگیری")).toBeVisible();
		await expect(page.getByText("مریم احمدی").first()).toBeVisible();
	});

	test("switches between the four role overviews", async ({ page }) => {
		await page.goto("/fa/demo");

		for (const role of roles) {
			await openRole(page, role.label);

			await expect(page).toHaveURL(new RegExp(`role=${role.slug}`));
			await expect(page.getByText(role.marker).first()).toBeVisible();
			await expect(page.getByRole("main")).toBeVisible();
		}
	});

	test("stays responsive on a phone viewport", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/fa/demo?role=admin");

		await expect(page.getByText("ثبت‌نام‌های اخیر").first()).toBeVisible();
		await expect
			.poll(() => page.evaluate(() => document.documentElement.scrollWidth))
			.toBeLessThanOrEqual(390);
	});

	test("the landing page CTA opens the demo", async ({ page }) => {
		await page.goto("/fa");
		await page
			.getByRole("link", { name: /دیدن داشبورد نمایشی/ })
			.first()
			.click();
		await expect(page).toHaveURL(/\/fa\/demo$/);
		await expect(page.getByText("حالت نمایشی").first()).toBeVisible();
	});

	test("the real dashboard still requires authentication", async ({
		request,
	}) => {
		const response = await request.get("/fa/d", { maxRedirects: 0 });

		expect(response.status()).toBe(307);
		expect(response.headers().location).toContain("/fa/auth/login?next=");
	});
});
