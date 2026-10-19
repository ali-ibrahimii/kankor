import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import {
	createRoleUser,
	loginAs,
	seedCreditBalance,
} from "../shared/test-users";

test.describe("Credit purchases", () => {
	// Next.js dev mode compiles routes on first visit, which can take well
	// over the default 30s test timeout — unlike the public routes warmed up
	// in e2e/search/global-search.spec.ts, these are all auth-gated, so an
	// unauthenticated request.get() just hits the login redirect without ever
	// compiling the real page/client bundle. Raise the timeout instead.
	test.describe.configure({ timeout: 90_000 });

	test.beforeAll(async ({ request, browser }) => {
		test.setTimeout(45_000);
		await request.get("/en/auth/login");

		// The warmup requests above only compile the *page* bundle — the login
		// form's onSubmit calls a separate server action (loginAction), which
		// Next.js compiles lazily on its own first invocation. Without this,
		// that one-time compile cost silently eats into whichever test happens
		// to log in first, intermittently blowing its 60s toHaveURL timeout.
		// A real outcome doesn't matter here, only that loginAction gets
		// invoked once outside a timed test.
		const warmupUser = await createRoleUser("student", "login-warmup");
		try {
			const context = await browser.newContext();
			const page = await context.newPage();
			await loginAs(page, warmupUser.email);
			await page.waitForURL(/\/d/, { timeout: 30_000 }).catch(() => undefined);
			await context.close();
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(warmupUser.userId);
		}
	});

	test.beforeEach(async ({ page }) => {
		// A cold-compiled protected route can take longer than Playwright's
		// default 30s action timeout on its first ever visit.
		page.setDefaultTimeout(60_000);
	});

	test("admin can top up a student's balance via the Charge Credits dialog", async ({
		page,
	}) => {
		const admin = await createRoleUser("admin", "credit-admin");
		const student = await createRoleUser("student", "credit-student");

		try {
			await loginAs(page, admin.email);
			await expect(page).toHaveURL(/\/d\/admin/, { timeout: 60_000 });

			await page.goto("/en/d/admin/users/students");
			await page.getByPlaceholder(/search by name, email/i).fill(student.email);
			const row = page.getByRole("row", { name: new RegExp(student.email) });
			await expect(row).toBeVisible({ timeout: 10_000 });

			await row.getByRole("button", { name: /^charge$/i }).click();
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			await dialog.getByLabel(/amount/i).fill("150");
			await dialog.getByLabel(/note/i).fill("Cash top-up at office");
			await dialog.getByRole("button", { name: /^charge$/i }).click();

			await expect(dialog).not.toBeVisible({ timeout: 10_000 });
			await expect(row.getByText(/150 credits/i)).toBeVisible({
				timeout: 10_000,
			});

			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("credit_balance")
				.eq("id", student.userId)
				.single();
			expect(profile?.credit_balance).toBe(150);

			const { data: ledger } = await supabaseAdmin
				.from("credit_transactions")
				.select("amount, type")
				.eq("profile_id", student.userId);
			expect(ledger).toHaveLength(1);
			expect(ledger?.[0].amount).toBe(150);
			expect(ledger?.[0].type).toBe("topup");
		} finally {
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(admin.userId);
		}
	});

	test("student can buy a paid course with sufficient balance", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "course-seller");
		const student = await createRoleUser("student", "course-buyer");
		let courseId: string | undefined;

		try {
			const courseTitle = `Playwright Paid Course ${Date.now()}`;
			const { data: course, error } = await supabaseAdmin
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
			expect(error).toBeNull();
			courseId = course?.id;

			await seedCreditBalance(student.userId, 100);

			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto(`/en/courses/${course?.slug}`);
			await page.getByRole("button", { name: /^buy for 40 credits$/i }).click();

			await expect(page.getByText(/enrolled successfully/i)).toBeVisible();
			await expect(
				page.getByRole("link", { name: /^start learning$/i })
			).toBeVisible({ timeout: 20_000 });

			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("credit_balance")
				.eq("id", student.userId)
				.single();
			expect(profile?.credit_balance).toBe(60);

			await page.goto("/en/d/wallet");
			await page.getByRole("tab", { name: /^purchases$/i }).click();
			await expect(page.getByText(courseTitle)).toBeVisible();
			await expect(
				page.getByRole("cell", { name: "40", exact: true })
			).toBeVisible();
		} finally {
			if (courseId) {
				await supabaseAdmin
					.from("enrollments")
					.delete()
					.eq("course_id", courseId);
				await supabaseAdmin.from("purchases").delete().eq("item_id", courseId);
				await supabaseAdmin.from("courses").delete().eq("id", courseId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("student can buy a paid deck with sufficient balance", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "deck-seller");
		const student = await createRoleUser("student", "deck-buyer");
		let deckId: string | undefined;

		try {
			const deckName = `Playwright Paid Deck ${Date.now()}`;
			const { data: deck, error } = await supabaseAdmin
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
			expect(error).toBeNull();
			deckId = deck?.id;

			await seedCreditBalance(student.userId, 100);

			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto(`/en/decks/${deck?.slug}`);
			await page.getByRole("button", { name: /^buy for 20 credits$/i }).click();

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();
			await expect(
				dialog.getByText("20 credits", { exact: true })
			).toBeVisible();
			await dialog
				.getByRole("button", { name: /^buy for 20 credits$/i })
				.click();

			await expect(page.getByText(/deck added/i)).toBeVisible();
			await expect(page).toHaveURL(/\/d\/decks\/practice\?deck=/, {
				timeout: 60_000,
			});

			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("credit_balance")
				.eq("id", student.userId)
				.single();
			expect(profile?.credit_balance).toBe(80);
		} finally {
			if (deckId) {
				await supabaseAdmin.from("enrollments").delete().eq("deck_id", deckId);
				await supabaseAdmin.from("purchases").delete().eq("item_id", deckId);
				await supabaseAdmin.from("decks").delete().eq("id", deckId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("purchase is rejected when the student has insufficient balance", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "poor-seller");
		const student = await createRoleUser("student", "poor-buyer");
		let courseId: string | undefined;

		try {
			const courseTitle = `Playwright Expensive Course ${Date.now()}`;
			const { data: course, error } = await supabaseAdmin
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
			expect(error).toBeNull();
			courseId = course?.id;
			// Deliberately no top-up — student starts at the default balance of 0.

			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto(`/en/courses/${course?.slug}`);
			await page.getByRole("button", { name: /^buy for 50 credits$/i }).click();

			await expect(page.getByText(/don.t have enough credits/i)).toBeVisible();
			await expect(
				page.getByRole("button", { name: /^buy for 50 credits$/i })
			).toBeVisible();

			const { data: purchases } = await supabaseAdmin
				.from("purchases")
				.select("id")
				.eq("item_id", courseId!);
			expect(purchases).toHaveLength(0);

			const { data: profile } = await supabaseAdmin
				.from("profiles")
				.select("credit_balance")
				.eq("id", student.userId)
				.single();
			expect(profile?.credit_balance).toBe(0);
		} finally {
			if (courseId) {
				await supabaseAdmin.from("purchases").delete().eq("item_id", courseId);
				await supabaseAdmin.from("courses").delete().eq("id", courseId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("seller sees a completed sale on their Earnings page", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "earnings-seller");
		const student = await createRoleUser("student", "earnings-buyer");
		let courseId: string | undefined;

		try {
			const courseTitle = `Playwright Earnings Course ${Date.now()}`;
			const { data: course, error } = await supabaseAdmin
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
			expect(error).toBeNull();
			courseId = course?.id;
			await seedCreditBalance(student.userId, 100);

			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });
			await page.goto(`/en/courses/${course?.slug}`);
			await page.getByRole("button", { name: /^buy for 30 credits$/i }).click();
			await expect(page.getByText(/enrolled successfully/i)).toBeVisible();

			// Full session reset before switching accounts within the same test —
			// Supabase's browser client also caches session state client-side, so
			// clearing cookies alone can leave a stale session behind.
			await page.context().clearCookies();
			await page.evaluate(() => {
				localStorage.clear();
				sessionStorage.clear();
			});
			await loginAs(page, instructor.email);
			await expect(page).toHaveURL(/\/d\/instructor/, { timeout: 60_000 });

			await page.goto("/en/d/instructor/earnings");
			await expect(page.getByText(courseTitle)).toBeVisible();
			await expect(
				page.getByRole("cell", { name: "30", exact: true })
			).toBeVisible();
		} finally {
			if (courseId) {
				await supabaseAdmin
					.from("enrollments")
					.delete()
					.eq("course_id", courseId);
				await supabaseAdmin.from("purchases").delete().eq("item_id", courseId);
				await supabaseAdmin.from("courses").delete().eq("id", courseId);
			}
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});
});
