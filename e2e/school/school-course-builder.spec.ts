import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createRoleUser, loginAs } from "../shared/test-users";

/**
 * docs/user_flows.md §7.2 flags a specific historical bug class to verify
 * rather than assume either way: the course builder's "New Course" flow is
 * wired per-`basePath`, and a prior inspection found at least one spot where
 * the school dashboard's basePath was hardcoded instead of threaded through
 * from the route's real `school_id` — which would send a school user's "New
 * Course" flow to the wrong (e.g. instructor-shaped) builder URL. This test
 * creates a course as a school-dashboard user and asserts the resulting
 * builder URL is scoped to the correct `school_id`.
 */
test.describe("School dashboard — New Course basePath regression", () => {
	test.describe.configure({ timeout: 90_000 });

	test.beforeEach(async ({ page }) => {
		page.setDefaultTimeout(60_000);
	});

	test("creating a course as school staff lands on the school-scoped builder URL", async ({
		page,
	}) => {
		// Base profile role must be "student" here — getDashboardPath() checks
		// isInstructor() before schoolMemberships, so an "instructor"-role owner
		// would be routed to /d/instructor instead of /d/school/[id] regardless
		// of school membership. Real school signups deliberately set role to
		// "student" for exactly this reason (see auth/signup/action.ts).
		const owner = await createRoleUser("student", "school-builder-owner");

		// `create_school_members_on_schools_created()` auto-adds owner.userId
		// to school_members with role 'owner' — no manual insert needed.
		const { data: school, error } = await supabaseAdmin
			.from("schools")
			.insert({
				name: `Builder Regression School ${Date.now()}`,
				status: "active",
				user_id: owner.userId,
			})
			.select("id")
			.single();
		expect(error).toBeNull();
		const schoolId = school!.id;

		const courseTitle = `Playwright School Course ${Date.now()}`;

		try {
			await loginAs(page, owner.email);
			await expect(page).toHaveURL(new RegExp(`/d/school/${schoolId}`), {
				timeout: 60_000,
			});

			await page.goto(`/en/d/school/${schoolId}/courses`);
			// Two "New Course" buttons render on an empty list (the header
			// action and the empty-state CTA) — both open the same dialog.
			await page
				.getByRole("button", { name: /^new course$/i })
				.first()
				.click();

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();
			await dialog.getByLabel("Course Title").fill(courseTitle);
			await dialog.getByRole("button", { name: /create & build/i }).click();

			// The regression check: must land under this school's own basePath,
			// never an instructor-shaped (or any other) builder path.
			await expect(page).toHaveURL(
				new RegExp(`/d/school/${schoolId}/courses/new/[^/]+`),
				{ timeout: 30_000 }
			);
			expect(page.url()).not.toContain("/d/instructor/");
			await expect(
				page.getByRole("heading", { name: courseTitle })
			).toBeVisible();
		} finally {
			await supabaseAdmin.from("courses").delete().eq("title", courseTitle);
			await supabaseAdmin
				.from("school_members")
				.delete()
				.eq("school_id", schoolId);
			await supabaseAdmin.from("schools").delete().eq("id", schoolId);
			await supabaseAdmin.auth.admin.deleteUser(owner.userId);
		}
	});
});
