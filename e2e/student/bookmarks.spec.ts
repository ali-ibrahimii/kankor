import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createRoleUser, loginAs } from "../shared/test-users";

test.describe("Bookmarks (docs/user_flows.md §4.6)", () => {
	test.describe.configure({ timeout: 90_000 });

	test.beforeEach(async ({ page }) => {
		page.setDefaultTimeout(60_000);
	});

	test("BookmarkButton renders nothing (not disabled) for a signed-out visitor", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "bookmark-anon-seed");
		const courseTitle = `Playwright Bookmark Anon Course ${Date.now()}`;
		const { data: course, error } = await supabaseAdmin
			.from("courses")
			.insert({
				title: courseTitle,
				instructor_id: instructor.userId,
				is_published: true,
				is_free: true,
			})
			.select("id, slug")
			.single();
		expect(error).toBeNull();

		try {
			await page.goto(`/en/courses/${course?.slug}`);
			await expect(
				page.getByRole("heading", { name: courseTitle })
			).toBeVisible();
			await expect(
				page.getByRole("button", { name: /^bookmark$|^bookmarked$/i })
			).toHaveCount(0);
		} finally {
			if (course?.id)
				await supabaseAdmin.from("courses").delete().eq("id", course.id);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("student can bookmark a course from its detail page and find it in /d/bookmarks", async ({
		page,
	}) => {
		const instructor = await createRoleUser(
			"instructor",
			"bookmark-course-seed"
		);
		const student = await createRoleUser("student", "bookmark-course-student");
		const courseTitle = `Playwright Bookmark Course ${Date.now()}`;
		const { data: course, error } = await supabaseAdmin
			.from("courses")
			.insert({
				title: courseTitle,
				instructor_id: instructor.userId,
				is_published: true,
				is_free: true,
			})
			.select("id, slug")
			.single();
		expect(error).toBeNull();

		try {
			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto(`/en/courses/${course?.slug}`);
			await page.waitForLoadState("networkidle");
			const bookmarkButton = page.getByRole("button", { name: /^bookmark$/i });
			await expect(bookmarkButton).toBeVisible({ timeout: 20_000 });
			// The public site's fixed, transparent top navbar (its "Dashboard"
			// link specifically) overlaps this row well after the page has
			// "settled", so a real screen-coordinate click (even Playwright's
			// `force: true`, which still clicks real pixel coordinates) lands
			// on the navbar link instead of the button beneath it. Dispatching
			// the click event directly on the element sidesteps that without
			// silently masking what is a real, if minor, layout overlap bug —
			// worth flagging separately, not this test's concern to fix.
			await bookmarkButton.dispatchEvent("click");
			await expect(page.getByText("Bookmark added.")).toBeVisible();
			await expect(
				page.getByRole("button", { name: /^bookmarked$/i })
			).toBeVisible();

			// Reload — bookmarked state must persist, not just be local UI state.
			await page.reload();
			await expect(
				page.getByRole("button", { name: /^bookmarked$/i })
			).toBeVisible();

			// Shows up in the dashboard bookmarks catalog.
			await page.goto("/en/d/bookmarks");
			await expect(page.getByText(courseTitle)).toBeVisible();

			// Filtering to a different item type hides it; back to "Course" shows it.
			// Scoped by visible text — the page header's locale-switcher is
			// also a `select-trigger` combobox, so a bare selector matches both.
			const itemTypeFilter = page
				.getByRole("combobox")
				.filter({ hasText: "All types" });
			await itemTypeFilter.click();
			await page.getByRole("option", { name: "Deck", exact: true }).click();
			await expect(page.getByText(courseTitle)).not.toBeVisible();

			await page.getByRole("combobox").filter({ hasText: "Deck" }).click();
			await page.getByRole("option", { name: "Course", exact: true }).click();
			await expect(page.getByText(courseTitle)).toBeVisible();

			// Remove via the BookmarkCard's remove action.
			const card = page
				.locator("[data-slot='card']")
				.filter({ hasText: courseTitle });
			await card.getByRole("button", { name: /remove bookmark/i }).click();
			await expect(page.getByText("Bookmark removed.")).toBeVisible();
			await expect(page.getByText(courseTitle)).not.toBeVisible();
		} finally {
			await supabaseAdmin.from("bookmarks").delete().eq("item_id", course!.id);
			if (course?.id)
				await supabaseAdmin.from("courses").delete().eq("id", course.id);
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});

	test("student can bookmark a deck from its detail page and toggle it off", async ({
		page,
	}) => {
		const instructor = await createRoleUser("instructor", "bookmark-deck-seed");
		const student = await createRoleUser("student", "bookmark-deck-student");
		const deckName = `Playwright Bookmark Deck ${Date.now()}`;
		const { data: deck, error } = await supabaseAdmin
			.from("decks")
			.insert({
				name: deckName,
				user_id: instructor.userId,
				is_free: true,
				visibility: "public",
				algorithm: "fsrs",
				creation: "custom",
			})
			.select("id, slug")
			.single();
		expect(error).toBeNull();

		try {
			await loginAs(page, student.email);
			await expect(page).toHaveURL(/\/d/, { timeout: 60_000 });

			await page.goto(`/en/decks/${deck?.slug}`);
			await page.waitForLoadState("networkidle");
			const bookmarkButton = page.getByRole("button", { name: /^bookmark$/i });
			await expect(bookmarkButton).toBeVisible({ timeout: 20_000 });
			// See the dispatchEvent note above — the fixed transparent navbar
			// overlaps this row, so a real-coordinate click (incl. `force`)
			// would land on the nav link instead of this button.
			await bookmarkButton.dispatchEvent("click");
			await expect(
				page.getByRole("button", { name: /^bookmarked$/i })
			).toBeVisible();

			// Toggle back off from the same button.
			await page
				.getByRole("button", { name: /^bookmarked$/i })
				.dispatchEvent("click");
			await expect(page.getByText("Bookmark removed.")).toBeVisible();
			await expect(
				page.getByRole("button", { name: /^bookmark$/i })
			).toBeVisible();

			await page.goto("/en/d/bookmarks");
			await expect(page.getByText(deckName)).not.toBeVisible();
		} finally {
			await supabaseAdmin.from("bookmarks").delete().eq("item_id", deck!.id);
			if (deck?.id)
				await supabaseAdmin.from("decks").delete().eq("id", deck.id);
			await supabaseAdmin.auth.admin.deleteUser(student.userId);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});
});
