import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import {
	createRoleUser,
	loginAs,
	seedCreditBalance,
} from "../shared/test-users";

/**
 * The UI's "Discount created" toast only fires after `create_discount`'s RPC
 * call resolves, so the row is already committed by then — but querying it
 * back immediately via a separate service-role request has occasionally
 * raced ahead of that commit becoming visible through PostgREST. A short
 * poll is cheap insurance against that gap.
 */
async function waitForDiscountByCode(code: string) {
	for (let attempt = 0; attempt < 10; attempt++) {
		const { data } = await supabaseAdmin
			.from("discounts")
			.select("id, scope, value, owner_type")
			.eq("code", code)
			.maybeSingle();
		if (data) return data;
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	throw new Error(`Discount with code ${code} was never found`);
}

test.describe("Discount codes", () => {
	// See e2e/credits/credit-purchase.spec.ts for why this suite needs a much
	// longer timeout than the Playwright default — these are all auth-gated
	// dashboard routes, which only get compiled (slowly, in Next.js dev mode)
	// on their first real, authenticated visit.
	test.describe.configure({ timeout: 90_000 });

	test.beforeAll(async ({ request, browser }) => {
		test.setTimeout(60_000);
		await request.get("/en/auth/login");
		await request.get("/en/courses/warmup");
		await request.get("/en/decks/warmup");

		// See e2e/credits/credit-purchase.spec.ts's beforeAll for why this real
		// throwaway login exists — it forces Next.js to compile the login
		// server action once, outside a timed test.
		const warmupUser = await createRoleUser("student", "login-warmup");
		try {
			const context = await browser.newContext();
			const page = await context.newPage();
			await loginAs(page, warmupUser.email);
			await page
				.waitForURL(/\/d/, { timeout: 30_000 })
				.catch(() => undefined);
			await context.close();
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(warmupUser.userId);
		}
	});

	test.beforeEach(async ({ page }) => {
		page.setDefaultTimeout(60_000);
	});

	test("owner creates an item-scoped discount through the dashboard UI", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "disc-owner");
		let courseId: string | undefined;
		let discountId: string | undefined;

		try {
			const courseTitle = `Playwright Discount Course ${Date.now()}`;
			const { data: course, error } = await supabaseAdmin
				.from("courses")
				.insert({
					title: courseTitle,
					instructor_id: instructor.userId,
					is_free: false,
					price_credits: 50,
					is_published: true,
				})
				.select("id")
				.single();
			expect(error).toBeNull();
			courseId = course?.id;

			await loginAs(page, instructor.email);
			await expect(page).toHaveURL(/\/d\/instructor/, { timeout: 60_000 });

			await page.goto("/en/d/instructor/discounts");
			await page.getByRole("button", { name: /^new discount$/i }).click();

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			// Platform-wide scope must never be offered to a non-admin owner.
			await dialog.locator("#discount-scope").click();
			await expect(
				page.getByRole("option", { name: /everything on the platform/i })
			).toHaveCount(0);
			await page.keyboard.press("Escape");

			const code = `SAVE10-${Date.now()}`;
			await dialog.locator("#discount-code").fill(code);
			await dialog.locator("#discount-value").fill("10");

			await dialog
				.locator("label", { hasText: courseTitle })
				.getByRole("checkbox")
				.click();
			await dialog.getByRole("button", { name: /^create discount$/i }).click();

			await expect(page.getByText(/discount created/i)).toBeVisible({
				timeout: 30_000,
			});
			await expect(
				page.getByRole("cell", { name: code, exact: true })
			).toBeVisible();

			const discount = await waitForDiscountByCode(code);
			expect(discount.scope).toBe("item");
			expect(Number(discount.value)).toBe(10);
			discountId = discount.id;
		} finally {
			if (discountId) {
				await supabaseAdmin
					.from("discount_targets")
					.delete()
					.eq("discount_id", discountId);
				await supabaseAdmin.from("discounts").delete().eq("id", discountId);
			}
			if (courseId) {
				await supabaseAdmin.from("courses").delete().eq("id", courseId);
			}
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("student redeems a valid item-scoped code at checkout", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "disc-redeem");
		const student = await createRoleUser("student", "disc-redeemer");
		let courseId: string | undefined;
		let discountId: string | undefined;

		try {
			const courseTitle = `Playwright Redeem Course ${Date.now()}`;
			const { data: course } = await supabaseAdmin
				.from("courses")
				.insert({
					title: courseTitle,
					instructor_id: instructor.userId,
					is_free: false,
					price_credits: 50,
					is_published: true,
				})
				.select("id, slug")
				.single();
			courseId = course?.id;

			const code = `REDEEM20-${Date.now()}`;
			const { data: discount } = await supabaseAdmin
				.from("discounts")
				.insert({
					code,
					type: "percentage",
					value: 20,
					scope: "item",
					owner_type: "instructor",
					owner_profile_id: instructor.userId,
				})
				.select("id")
				.single();
			discountId = discount?.id;
			await supabaseAdmin.from("discount_targets").insert({
				discount_id: discountId,
				item_type: "course",
				item_id: courseId,
			});

			await seedCreditBalance(student.userId, 100);

			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto(`/en/courses/${course?.slug}`);
			await page.getByRole("button", { name: /have a discount code/i }).click();
			await page.getByPlaceholder(/enter code/i).fill(code);
			await page.getByRole("button", { name: /^apply$/i }).click();

			// 20% off 50 = 40.
			await expect(page.getByText(/new price: 40 credits/i)).toBeVisible({ timeout: 20_000 });

			// The main CTA keeps showing the original price — only the actual
			// charge (via purchase_item) uses the discounted amount.
			await page.getByRole("button", { name: /^buy for 50 credits$/i }).click();
			await expect(page.getByText(/enrolled successfully/i)).toBeVisible({
				timeout: 20_000,
			});

			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("credit_balance")
				.eq("id", student.userId)
				.single();
			expect(profile?.credit_balance).toBe(60);

			const { data: purchase } = await supabaseAdmin
				.from("purchases")
				.select("price_credits, original_price_credits, discount_id")
				.eq("item_id", courseId!)
				.single();
			expect(purchase?.price_credits).toBe(40);
			expect(purchase?.original_price_credits).toBe(50);
			expect(purchase?.discount_id).toBe(discountId);
		} finally {
			if (courseId) {
				await supabaseAdmin.from("enrollments").delete().eq("course_id", courseId);
				await supabaseAdmin.from("purchases").delete().eq("item_id", courseId);
			}
			if (discountId) {
				await supabaseAdmin
					.from("discount_targets")
					.delete()
					.eq("discount_id", discountId);
				await supabaseAdmin.from("discounts").delete().eq("id", discountId);
			}
			if (courseId) {
				await supabaseAdmin.from("courses").delete().eq("id", courseId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("an invalid or nonexistent code is rejected", async ({ page }) => {
		const instructor = await createRoleUser("instructor", "disc-invalid");
		const student = await createRoleUser("student", "disc-invalid-buyer");
		let courseId: string | undefined;

		try {
			const courseTitle = `Playwright Invalid-Code Course ${Date.now()}`;
			const { data: course } = await supabaseAdmin
				.from("courses")
				.insert({
					title: courseTitle,
					instructor_id: instructor.userId,
					is_free: false,
					price_credits: 30,
					is_published: true,
				})
				.select("id, slug")
				.single();
			courseId = course?.id;

			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto(`/en/courses/${course?.slug}`);
			await page.getByRole("button", { name: /have a discount code/i }).click();
			await page.getByPlaceholder(/enter code/i).fill("TOTALLY-BOGUS-CODE");
			await page.getByRole("button", { name: /^apply$/i }).click();

			await expect(
				page.getByText(/isn.t valid or has expired/i)
			).toBeVisible({ timeout: 20_000 });
			await expect(
				page.getByRole("button", { name: /^buy for 30 credits$/i })
			).toBeVisible();
		} finally {
			if (courseId) {
				await supabaseAdmin.from("courses").delete().eq("id", courseId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("a code valid for a different item is rejected as not applicable", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "disc-mismatch");
		const student = await createRoleUser("student", "disc-mismatch-buyer");
		let courseAId: string | undefined;
		let courseBId: string | undefined;
		let discountId: string | undefined;

		try {
			const { data: courseA } = await supabaseAdmin
				.from("courses")
				.insert({
					title: `Playwright Course A ${Date.now()}`,
					instructor_id: instructor.userId,
					is_free: false,
					price_credits: 40,
					is_published: true,
				})
				.select("id")
				.single();
			courseAId = courseA?.id;

			const { data: courseB } = await supabaseAdmin
				.from("courses")
				.insert({
					title: `Playwright Course B ${Date.now()}`,
					instructor_id: instructor.userId,
					is_free: false,
					price_credits: 60,
					is_published: true,
				})
				.select("id, slug")
				.single();
			courseBId = courseB?.id;

			const code = `ONLYA-${Date.now()}`;
			const { data: discount } = await supabaseAdmin
				.from("discounts")
				.insert({
					code,
					type: "fixed",
					value: 5,
					scope: "item",
					owner_type: "instructor",
					owner_profile_id: instructor.userId,
				})
				.select("id")
				.single();
			discountId = discount?.id;
			await supabaseAdmin.from("discount_targets").insert({
				discount_id: discountId,
				item_type: "course",
				item_id: courseAId,
			});

			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			// Try the courseA-only code on courseB.
			await page.goto(`/en/courses/${courseB?.slug}`);
			await page.getByRole("button", { name: /have a discount code/i }).click();
			await page.getByPlaceholder(/enter code/i).fill(code);
			await page.getByRole("button", { name: /^apply$/i }).click();

			await expect(
				page.getByText(/doesn.t apply to this item/i)
			).toBeVisible({ timeout: 20_000 });
		} finally {
			if (discountId) {
				await supabaseAdmin
					.from("discount_targets")
					.delete()
					.eq("discount_id", discountId);
				await supabaseAdmin.from("discounts").delete().eq("id", discountId);
			}
			if (courseAId) {
				await supabaseAdmin.from("courses").delete().eq("id", courseAId);
			}
			if (courseBId) {
				await supabaseAdmin.from("courses").delete().eq("id", courseBId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("a group-scope discount covers multiple item types", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "disc-group");
		const student = await createRoleUser("student", "disc-group-buyer");
		let courseId: string | undefined;
		let deckId: string | undefined;
		let discountId: string | undefined;

		try {
			const courseTitle = `Playwright Group Course ${Date.now()}`;
			const deckName = `Playwright Group Deck ${Date.now()}`;

			const { data: course } = await supabaseAdmin
				.from("courses")
				.insert({
					title: courseTitle,
					instructor_id: instructor.userId,
					is_free: false,
					price_credits: 40,
					is_published: true,
				})
				.select("id, slug")
				.single();
			courseId = course?.id;

			const { data: deck } = await supabaseAdmin
				.from("decks")
				.insert({
					name: deckName,
					user_id: instructor.userId,
					is_free: false,
					price_credits: 20,
					visibility: "public",
					algorithm: "fsrs",
					creation: "custom",
				})
				.select("id, slug")
				.single();
			deckId = deck?.id;

			await loginAs(page, instructor.email);
			await expect(page).toHaveURL(/\/d\/instructor/, { timeout: 60_000 });

			await page.goto("/en/d/instructor/discounts");
			await page.getByRole("button", { name: /^new discount$/i }).click();
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			const code = `GROUP15-${Date.now()}`;
			await dialog.locator("#discount-code").fill(code);
			await dialog.locator("#discount-value").fill("15");

			await dialog.locator("#discount-scope").click();
			await page.getByRole("option", { name: /^a group of items$/i }).click();

			await dialog
				.locator("label", { hasText: courseTitle })
				.getByRole("checkbox")
				.click();
			await dialog
				.locator("label", { hasText: deckName })
				.getByRole("checkbox")
				.click();
			await dialog.getByRole("button", { name: /^create discount$/i }).click();
			await expect(page.getByText(/discount created/i)).toBeVisible({
				timeout: 30_000,
			});

			const discount = await waitForDiscountByCode(code);
			discountId = discount.id;
			const { data: targets } = await supabaseAdmin
				.from("discount_targets")
				.select("item_type")
				.eq("discount_id", discountId!);
			expect(targets).toHaveLength(2);

			// Full session reset before switching to the buyer account.
			await page.context().clearCookies();
			await page.evaluate(() => {
				localStorage.clear();
				sessionStorage.clear();
			});
			await seedCreditBalance(student.userId, 100);
			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			// 15% off 40 = 34 (this discount is percentage-type).
			await page.goto(`/en/courses/${course?.slug}`);
			await page.getByRole("button", { name: /have a discount code/i }).click();
			await page.getByPlaceholder(/enter code/i).fill(code);
			await page.getByRole("button", { name: /^apply$/i }).click();
			await expect(page.getByText(/new price: 34 credits/i)).toBeVisible({ timeout: 20_000 });
			await page.getByRole("button", { name: /^buy for 40 credits$/i }).click();
			await expect(page.getByText(/enrolled successfully/i)).toBeVisible({
				timeout: 20_000,
			});

			// Redeem the same code on the deck: 15% off 20 = 17.
			await page.goto(`/en/decks/${deck?.slug}`);
			await page.getByRole("button", { name: /^buy for 20 credits$/i }).click();
			const deckDialog = page.getByRole("dialog");
			await expect(deckDialog).toBeVisible();
			await deckDialog
				.getByRole("button", { name: /have a discount code/i })
				.click();
			await deckDialog.getByPlaceholder(/enter code/i).fill(code);
			await deckDialog.getByRole("button", { name: /^apply$/i }).click();
			await expect(
				deckDialog.getByText(/new price: 17 credits/i)
			).toBeVisible({ timeout: 20_000 });
			await deckDialog
				.getByRole("button", { name: /^buy for 20 credits$/i })
				.click();
			await expect(page.getByText(/deck added/i)).toBeVisible({
				timeout: 20_000,
			});

			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("credit_balance")
				.eq("id", student.userId)
				.single();
			// 100 - 34 - 17 = 49.
			expect(profile?.credit_balance).toBe(49);
		} finally {
			if (courseId) {
				await supabaseAdmin.from("enrollments").delete().eq("course_id", courseId);
				await supabaseAdmin.from("purchases").delete().eq("item_id", courseId);
			}
			if (deckId) {
				await supabaseAdmin.from("enrollments").delete().eq("deck_id", deckId);
				await supabaseAdmin.from("purchases").delete().eq("item_id", deckId);
			}
			if (discountId) {
				await supabaseAdmin
					.from("discount_targets")
					.delete()
					.eq("discount_id", discountId);
				await supabaseAdmin.from("discounts").delete().eq("id", discountId);
			}
			if (courseId) {
				await supabaseAdmin.from("courses").delete().eq("id", courseId);
			}
			if (deckId) {
				await supabaseAdmin.from("decks").delete().eq("id", deckId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("admin can create a platform-wide discount redeemable on any item", async ({
		page,
	}) => {
		const admin = await createRoleUser("admin", "disc-admin");
		const instructor = await createRoleUser("instructor", "disc-admin-owner");
		const student = await createRoleUser("student", "disc-admin-buyer");
		let deckId: string | undefined;
		let discountId: string | undefined;

		try {
			const deckName = `Playwright All-Scope Deck ${Date.now()}`;
			const { data: deck } = await supabaseAdmin
				.from("decks")
				.insert({
					name: deckName,
					user_id: instructor.userId,
					is_free: false,
					price_credits: 50,
					visibility: "public",
					algorithm: "fsrs",
					creation: "custom",
				})
				.select("id, slug")
				.single();
			deckId = deck?.id;

			await loginAs(page, admin.email);
			await expect(page).toHaveURL(/\/d\/admin/, { timeout: 60_000 });

			await page.goto("/en/d/admin/discounts");
			await page.getByRole("button", { name: /^new discount$/i }).click();
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			const code = `PLATFORM25-${Date.now()}`;
			await dialog.locator("#discount-code").fill(code);
			await dialog.locator("#discount-value").fill("25");

			await dialog.locator("#discount-scope").click();
			await page
				.getByRole("option", { name: /^everything on the platform$/i })
				.click();
			// "all" scope hides the target picker entirely.
			await expect(dialog.getByText(/search your items/i)).toHaveCount(0);

			await dialog.getByRole("button", { name: /^create discount$/i }).click();
			await expect(page.getByText(/discount created/i)).toBeVisible({
				timeout: 30_000,
			});

			const discount = await waitForDiscountByCode(code);
			discountId = discount.id;
			expect(discount.scope).toBe("all");
			expect(discount.owner_type).toBe("platform");

			await page.context().clearCookies();
			await page.evaluate(() => {
				localStorage.clear();
				sessionStorage.clear();
			});
			await seedCreditBalance(student.userId, 100);
			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			// This deck was never explicitly targeted by the discount — only
			// its "all" scope should make the code work here.
			await page.goto(`/en/decks/${deck?.slug}`);
			await page.getByRole("button", { name: /^buy for 50 credits$/i }).click();
			const deckDialog = page.getByRole("dialog");
			await expect(deckDialog).toBeVisible();
			await deckDialog
				.getByRole("button", { name: /have a discount code/i })
				.click();
			await deckDialog.getByPlaceholder(/enter code/i).fill(code);
			await deckDialog.getByRole("button", { name: /^apply$/i }).click();
			// 25% off 50 = 37.5 -> rounds to 38 (compute_discounted_price uses round()).
			await expect(
				deckDialog.getByText(/new price: 38 credits/i)
			).toBeVisible({ timeout: 20_000 });
			await deckDialog
				.getByRole("button", { name: /^buy for 50 credits$/i })
				.click();
			await expect(page.getByText(/deck added/i)).toBeVisible({
				timeout: 20_000,
			});

			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("credit_balance")
				.eq("id", student.userId)
				.single();
			expect(profile?.credit_balance).toBe(62);
		} finally {
			if (deckId) {
				await supabaseAdmin.from("enrollments").delete().eq("deck_id", deckId);
				await supabaseAdmin.from("purchases").delete().eq("item_id", deckId);
			}
			if (discountId) {
				await supabaseAdmin.from("discounts").delete().eq("id", discountId);
			}
			if (deckId) {
				await supabaseAdmin.from("decks").delete().eq("id", deckId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
			await supabaseAdmin.auth.admin.deleteUser(admin.userId);
		}
	});
});
