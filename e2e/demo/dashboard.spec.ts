import { expect, type Page, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

// Wait for client hydration before interacting with the role selector; a
// server-rendered native <select> can otherwise change before React attaches
// its onChange handler, leaving the demo on the initial admin account.
async function openDemo(page: Page, path = "/fa/demo") {
	await page.goto(path);
	await expect(page.locator("#demo-role")).toBeEnabled();
}

/** The public demo has its own browser storage and never authenticates to /d. */
test.describe("Role-based dashboard demo", () => {
	test("the mobile landing CTA opens a responsive dashboard with four switchable roles", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/fa");
		await expect(
			page.getByRole("link", { name: /دیدن داشبورد نمایشی/ }).first()
		).toBeVisible();
		await expect
			.poll(() => page.evaluate(() => document.documentElement.scrollWidth))
			.toBeLessThanOrEqual(390);
		await page
			.getByRole("link", { name: /دیدن داشبورد نمایشی/ })
			.first()
			.click();
		await expect(page).toHaveURL(/\/fa\/demo$/);
		await expect(page.locator("#demo-role")).toBeEnabled();
		await expect(
			page.getByRole("main").getByText("حالت نمایشی").first()
		).toBeVisible();
		for (const role of ["admin", "teacher", "student", "school"]) {
			await page.locator("#demo-role").selectOption(role);
			await expect(page.locator("#demo-role")).toHaveValue(role);
			await expect(page.getByRole("main")).toBeVisible();
		}
		await expect
			.poll(() => page.evaluate(() => document.documentElement.scrollWidth))
			.toBeLessThanOrEqual(390);
	});

	test("an invite code opens a request that becomes membership only after teacher approval", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await openDemo(page);
		await page.locator("#demo-role").selectOption("teacher");
		await page
			.getByRole("navigation")
			.getByRole("button", { name: "کلاس‌ها" })
			.click();
		await page.getByRole("button", { name: "مدیریت کلاس" }).first().click();
		await expect(page.getByText("AK-MATH26").first()).toBeVisible();
		await expect(
			page.getByRole("button", { name: "کپی لینک دعوت" })
		).toBeVisible();

		// Student 1 is not yet in the seeded Physics class. An invite must not
		// add them directly, even when opened as a URL.
		await openDemo(page, "/fa/demo?invite=AK-PHYS26");
		await expect(page.locator("#demo-role")).toHaveValue("student");
		await expect(
			page.getByRole("textbox", { name: "کد یا لینک دعوت" })
		).toHaveValue("AK-PHYS26");
		await page.getByRole("button", { name: "ارسال درخواست" }).click();
		await expect(page.getByText("در انتظار تأیید")).toBeVisible();
		await page.locator("#demo-role").selectOption("teacher");
		await page.getByLabel("حساب نمایشی").selectOption("teacher-2");
		await page
			.getByRole("navigation")
			.getByRole("button", { name: "کلاس‌ها" })
			.click();
		await page.getByRole("button", { name: "مدیریت کلاس" }).first().click();
		await page.getByRole("button", { name: "قبول" }).click();
		await page.locator("#demo-role").selectOption("student");
		await page
			.getByRole("navigation")
			.getByRole("button", { name: "کلاس‌ها" })
			.click();
		await expect(page.getByText("آزمایشگاه فیزیک")).toBeVisible();
		await expect(page.getByText("عضو کلاس").first()).toBeVisible();
	});

	test("student certificates can be checked and site admins can revoke them", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/fa/demo/verify/AK-CERT-2026-001");
		await expect(
			page.getByText("گواهینامه یافت نشد یا باطل شده است")
		).toBeVisible();
		await openDemo(page);
		await page.locator("#demo-role").selectOption("student");
		await page.getByLabel("حساب نمایشی").selectOption("student-2");
		await page
			.getByRole("navigation")
			.getByRole("button", { name: "گواهینامه‌ها" })
			.click();
		await expect(page.getByText("AK-CERT-2026-001")).toBeVisible();
		await page.getByRole("link", { name: "مشاهده و تأیید" }).click();
		await expect(page).toHaveURL(/\/fa\/demo\/verify\/AK-CERT-2026-001$/);
		await expect(page.getByText("AK-CERT-2026-001")).toBeVisible();

		await openDemo(page);
		await page.locator("#demo-role").selectOption("admin");
		await page
			.getByRole("navigation")
			.getByRole("button", { name: "گواهینامه‌ها" })
			.click();
		await page.getByRole("button", { name: "ابطال" }).first().click();
		await expect(page.getByText("باطل شده")).toBeVisible();
		await page.goto("/fa/demo/verify/AK-CERT-2026-001");
		await expect(
			page.getByText("گواهینامه یافت نشد یا باطل شده است")
		).toBeVisible();
	});

	test("the sample certificate prints on one landscape page", async ({
		page,
		browserName,
	}) => {
		test.skip(browserName !== "chromium", "PDF printing requires Chromium");
		await openDemo(page);
		await page.goto("/fa/demo/verify/AK-CERT-2026-001");
		await expect(
			page.getByText("نمونهٔ آموزشی · فاقد اعتبار رسمی")
		).toBeVisible();
		await expect(page.locator(".demo-print-certificate img")).toBeVisible();
		await page.evaluate(() => document.fonts.ready.then(() => true));

		const bytes = await page.pdf({
			printBackground: true,
			preferCSSPageSize: true,
		});
		const pdfDocument = await PDFDocument.load(bytes);
		expect(pdfDocument.getPageCount()).toBe(1);
		const { width, height } = pdfDocument.getPage(0).getSize();
		expect(width).toBeGreaterThan(height);
		expect(width).toBeGreaterThan(800);
	});

	test("only the admin sees site settings, and its demo edits persist locally", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await openDemo(page);
		await page
			.getByRole("navigation")
			.getByRole("button", { name: "تنظیمات" })
			.click();
		await page.locator("#demo-site-name").fill("مرکز آموزشی آزمایشی");
		await page.getByRole("button", { name: "ذخیرهٔ اطلاعات سایت" }).click();
		await page.reload();
		await expect(page.locator("#demo-role")).toBeEnabled();
		await expect(page.getByText("مرکز آموزشی آزمایشی").first()).toBeVisible();
		await page.locator("#demo-role").selectOption("school");
		await page
			.getByRole("navigation")
			.getByRole("button", { name: "اعضای مکتب" })
			.click();
		await expect(page.getByRole("main")).toContainText("مریم احمدی");
		await page
			.getByRole("navigation")
			.getByRole("button", { name: "تنظیمات" })
			.click();
		await expect(page.locator("#demo-site-name")).toHaveCount(0);
	});
});

test("the real classroom invite preserves its code through the sign-in redirect", async ({
	request,
}) => {
	const response = await request.get("/fa/d/classrooms?join=123456", {
		maxRedirects: 0,
	});
	expect(response.status()).toBe(307);
	expect(response.headers().location).toContain("/fa/auth/login?next=");
	expect(decodeURIComponent(response.headers().location)).toContain(
		"/fa/d/classrooms?join=123456"
	);
});
