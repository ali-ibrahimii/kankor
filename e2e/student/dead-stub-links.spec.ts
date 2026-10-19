import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createRoleUser, loginAs } from "../shared/test-users";

/**
 * docs/user_flows.md §4.4 / §8.4: `/d/tests/kankor`, `/d/tests/subject`, and
 * `/d/tests/quiz` are known dead-link stubs (no route implemented yet). The
 * doc explicitly asks for a regression test that asserts the 404/stub state
 * on purpose, so that a future real implementation is what breaks this test
 * — not silent drift where the sidebar link quietly starts pointing at
 * nothing forever.
 */
test.describe("Known dead-link stubs", () => {
	test.describe.configure({ timeout: 60_000 });

	for (const path of ["kankor", "subject", "quiz"]) {
		test(`/d/tests/${path} is still a 404 stub`, async ({ page }) => {
			const student = await createRoleUser("student", `stub-${path}`);
			page.setDefaultTimeout(30_000);

			try {
				await loginAs(page, student.email);
				await expect(page).toHaveURL(/\/d/, { timeout: 30_000 });

				const response = await page.goto(`/en/d/tests/${path}`);
				expect(response?.status()).toBe(404);
			} finally {
				await supabaseAdmin.auth.admin.deleteUser(student.userId);
			}
		});
	}
});
