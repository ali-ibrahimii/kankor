import type { Page } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";

export const TEST_PASSWORD = "ValidPassword123";
export const LOGIN_URL = "/en/auth/login";

export async function createTestUser(
	role: "student" | "instructor" | "admin",
	tag: string
) {
	const email = `test-playwright-${tag}-${Date.now()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: TEST_PASSWORD,
		email_confirm: true,
		user_metadata: { full_name: `Test ${tag}`, role, locale: "en" },
	});
	if (error) throw error;
	const userId = data.user?.id;
	if (!userId) throw new Error("createUser did not return a user id");

	// `handle_new_user_profile_creation()` (the auth.users -> profiles trigger)
	// ignores user_metadata entirely and always inserts `role = 'student'` /
	// `locale = 'fa'` (the column default). The role gap was harmless here
	// (decks have no role-gated RLS) but the locale gap isn't: `src/proxy.ts`
	// forces every authenticated request to the user's stored profile locale,
	// so a fresh user's default 'fa' silently redirects every `/en/...`
	// navigation in this suite back to `/fa/...`. `instructor_status` also
	// defaults to null, and `d/instructor/layout.tsx` redirects any
	// instructor whose status isn't exactly 'active' to
	// `/verification-pending?type=instructor` instead of the dashboard.
	const patch: { role: string; locale: string; instructor_status?: string } = {
		role,
		locale: "en",
	};
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
	await page.waitForLoadState("networkidle");
	await page.getByLabel("Email Address").fill(email);
	await page.getByLabel("Password").fill(TEST_PASSWORD);
	await page.getByLabel("Password").blur();
	await page.waitForTimeout(200);
	await page.getByRole("button", { name: /^login$/i }).click();
}
