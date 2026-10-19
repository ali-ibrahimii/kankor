import type { Page } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";

export const TEST_PASSWORD = "ValidPassword123";
export const LOGIN_URL = "/en/auth/login";

export type TestRole = "student" | "instructor" | "admin";

/**
 * Creates a throwaway auth user AND fixes up its real `profiles` row.
 *
 * `handle_new_user_profile_creation()` (the `auth.users` -> `profiles`
 * trigger) always inserts the new profile with `role = 'student'` and
 * `locale = 'fa'` (the column default), ignoring `user_metadata` entirely.
 * The role gap is harmless for tests that never touch role-gated RLS, but
 * credits/discounts RPCs (`is_admin()`, `can_manage_course()`, ...) check
 * the real column. The locale gap is worse and easy to miss: `src/proxy.ts`
 * deliberately forces every authenticated request to the user's stored
 * `profiles.locale` (a real feature — respect a signed-in user's saved
 * language). With every fresh test user defaulting to `'fa'`, *any*
 * `page.goto("/en/...")` after login gets silently redirected back to the
 * `/fa/...` equivalent — so both columns must be corrected right after
 * creation, not just the role.
 *
 * A third gap: `instructor_status` also defaults to `null`, and
 * `d/instructor/layout.tsx` redirects any instructor whose status isn't
 * exactly `'active'` to `/verification-pending?type=instructor` instead of
 * rendering the dashboard — so an instructor fixture must also be
 * explicitly verified, or every test that logs in as one and expects
 * `/d/instructor` silently redirects somewhere else instead.
 */
export async function createRoleUser(role: TestRole, tag: string) {
	const email = `test-playwright-${tag}-${Date.now()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: TEST_PASSWORD,
		email_confirm: true,
		user_metadata: { full_name: `Test ${tag}`, locale: "en" },
	});
	if (error) throw error;
	const userId = data.user?.id;
	if (!userId) throw new Error("createUser did not return a user id");

	const patch: { role?: TestRole; locale: string; instructor_status?: string } =
		{ locale: "en" };
	if (role !== "student") patch.role = role;
	if (role === "instructor") patch.instructor_status = "active";

	const { error: patchError } = await supabaseAdmin
		.from("profiles")
		.update(patch)
		.eq("id", userId);
	if (patchError) throw patchError;

	return { email, userId };
}

export async function loginAs(page: Page, email: string) {
	await page.goto(LOGIN_URL);
	// Without this, the submit button is clickable in the DOM before React
	// hydrates and attaches the form's onSubmit handler — a click in that
	// window falls through to the browser's native GET form submission,
	// which just reloads /auth/login with ?email=...&password=... in the
	// URL instead of calling the real login action.
	await page.waitForLoadState("networkidle");
	await page.getByLabel("Email Address").fill(email);
	await page.getByLabel("Password").fill(TEST_PASSWORD);
	await page.getByLabel("Password").blur();
	await page.waitForTimeout(200);
	await page.getByRole("button", { name: /^login$/i }).click();
}

/**
 * Directly sets a test user's credit balance for setup purposes (bypassing
 * `admin_topup_credits`, which needs an admin JWT context the service-role
 * client doesn't have). The tests that actually exercise the top-up RPC do
 * so through the real Charge Credits dialog instead.
 */
export async function seedCreditBalance(userId: string, balance: number) {
	const { error } = await supabaseAdmin
		.from("profiles")
		.update({ credit_balance: balance })
		.eq("id", userId);
	if (error) throw error;
}
