import { expect, test } from "@playwright/test";

// The verify page is fully public (anon-callable RPC), so the invalid-code
// path needs no seeded data and is stable across environments. The valid-code
// path requires a completed enrollment, which seed data doesn't guarantee —
// covered by unit tests on the RPC/template instead.

test.describe("Certificate verification page", () => {
	test.beforeAll(async ({ request }) => {
		// Warm up the dynamic route so assertions don't race a dev-mode compile.
		await request.get("/en/verify/WARMUP0000000000");
	});

	test("shows a not-found state for an unknown code (en)", async ({ page }) => {
		await page.goto("/en/verify/NOTAREALCODE1234");

		await expect(
			page.getByRole("heading", { name: "Certificate verification" })
		).toBeVisible();
		await expect(page.getByText("Certificate not found")).toBeVisible();
		// The looked-up code is echoed back so the visitor can double-check it.
		await expect(page.getByText("NOTAREALCODE1234")).toBeVisible();
	});

	test("shows the localized not-found state (fa)", async ({ page }) => {
		await page.goto("/fa/verify/NOTAREALCODE1234");

		await expect(page.getByText("گواهینامه یافت نشد")).toBeVisible();
	});

	test("submitting the verify form redirects to code page", async ({
		page,
	}) => {
		await page.goto("/en/verify");

		await page.getByLabel("Verification code").fill("NOTAREALCODE1234");
		await page.getByRole("button", { name: "Verify" }).click();

		await expect(page).toHaveURL(/\/en\/verify\/NOTAREALCODE1234/);
		await expect(page.getByText("Certificate not found")).toBeVisible();
	});
});
