import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "./deck-test-helpers";

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test.describe("Deck management", () => {
	test("student can create a deck, add a card, rename it, and delete it", async ({
		page,
	}) => {
		const { email, userId } = await createTestUser("student", "deck-student");
		const deckName = `Playwright Deck ${Date.now()}`;
		const renamedDeckName = `${deckName} (edited)`;

		// Poll for profile creation
		for (let i = 0; i < 10; i++) {
			const { data: p } = await supabaseAdmin
				.from("profiles")
				.select("id")
				.eq("id", userId)
				.maybeSingle();
			if (p) break;
			await new Promise((r) => setTimeout(r, 200));
		}

		try {
			await loginAs(page, email);
			await page.waitForURL(/\/d/, { waitUntil: "commit", timeout: 15000 });

			// ── Create ──────────────────────────────────────────────────────────
			await page.goto("/en/d/decks");
			await page.waitForLoadState("domcontentloaded");
			await page.getByRole("button", { name: /^new deck$/i }).click();
			const createDialog = page.getByRole("dialog");
			await createDialog.getByLabel("Deck Name").fill(deckName);
			await createDialog
				.getByRole("button", { name: /^create deck$/i })
				.click();

			// Regression check for the slug/id routing bug: the builder must load
			// (not 404) at a slug-shaped URL, never a raw uuid.
			await page.waitForURL(/\/d\/decks\/[^/]+\/edit/, {
				waitUntil: "commit",
				timeout: 15000,
			});
			const slug = page.url().split("/decks/")[1].split("/edit")[0];
			expect(UUID_RE.test(slug)).toBe(false);
			await expect(page.getByRole("heading", { name: deckName })).toBeVisible();

			// ── Add a flashcard ────────────────────────────────────────────────
			await page
				.getByRole("button", { name: /^add card$/i })
				.first()
				.click();
			const cardDialog = page.getByRole("dialog");
			const questionInput = cardDialog.getByLabel("Question");
			await questionInput.fill("What is 2 + 2?");
			await questionInput.blur();

			const ans1 = cardDialog.getByLabel("Answer 1");
			await ans1.fill("4");
			await ans1.blur();

			const ans2 = cardDialog.getByLabel("Answer 2");
			await ans2.fill("5");
			await ans2.blur();

			await cardDialog
				.locator("form")
				.evaluate((f) => (f as HTMLFormElement).requestSubmit());
			await expect(cardDialog).not.toBeVisible({ timeout: 10000 });
			await expect(page.getByText("What is 2 + 2?")).toBeVisible();

			// ── Rename via the settings sheet ──────────────────────────────────
			await page
				.getByRole("button", { name: /^settings$/i })
				.first()
				.click();
			const settingsSheet = page.getByRole("dialog");
			await settingsSheet.getByLabel("Deck Name").fill(renamedDeckName);
			await settingsSheet
				.getByRole("button", { name: /^save changes$/i })
				.click();
			await expect(
				page.getByRole("heading", { name: renamedDeckName })
			).toBeVisible();

			// ── Delete from the list ───────────────────────────────────────────
			await page.goto("/en/d/decks");
			await page.waitForLoadState("domcontentloaded");
			await expect(page).toHaveURL(/\/d\/decks$/);
			const card = page
				.locator("[data-slot='card']")
				.filter({ hasText: renamedDeckName });
			await card.getByRole("button", { name: /^actions$/i }).click();
			page.once("dialog", (dialog) => dialog.accept());
			await page.getByRole("menuitem", { name: /^delete$/i }).click();
			await expect(page.getByText("Deck deleted.")).toBeVisible();
			await expect(page.getByText(renamedDeckName)).not.toBeVisible();
		} finally {
			await supabaseAdmin.from("decks").delete().eq("name", deckName);
			await supabaseAdmin.from("decks").delete().eq("name", renamedDeckName);
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});

	test("instructor can create their own deck and it loads at a slug-based URL", async ({
		page,
	}) => {
		const { email, userId } = await createTestUser(
			"instructor",
			"deck-instructor"
		);
		const deckName = `Playwright Instructor Deck ${Date.now()}`;

		// Poll for profile creation
		for (let i = 0; i < 10; i++) {
			const { data: p } = await supabaseAdmin
				.from("profiles")
				.select("id")
				.eq("id", userId)
				.maybeSingle();
			if (p) break;
			await new Promise((r) => setTimeout(r, 200));
		}

		try {
			await loginAs(page, email);
			await page.waitForURL(/\/d\/instructor/, {
				waitUntil: "commit",
				timeout: 15000,
			});

			await page.goto("/en/d/instructor/decks");
			await page.waitForLoadState("domcontentloaded");
			await page.getByRole("button", { name: /^new deck$/i }).click();
			const createDialog = page.getByRole("dialog");
			await createDialog.getByLabel("Deck Name").fill(deckName);
			await createDialog
				.getByRole("button", { name: /^create deck$/i })
				.click();

			// Same regression check on the instructor route (both edit pages had
			// the identical params:{deck_id} bug that always 404'd).
			await page.waitForURL(/\/d\/instructor\/decks\/[^/]+\/edit/, {
				waitUntil: "commit",
				timeout: 15000,
			});
			const slug = page.url().split("/decks/")[1].split("/edit")[0];
			expect(UUID_RE.test(slug)).toBe(false);
			await expect(page.getByRole("heading", { name: deckName })).toBeVisible();

			await page.getByRole("button", { name: /back to decks/i }).click();
			await expect(page).toHaveURL(/\/d\/instructor\/decks$/);
			const card = page
				.locator("[data-slot='card']")
				.filter({ hasText: deckName });
			await card.getByRole("button", { name: /^actions$/i }).click();
			page.once("dialog", (dialog) => dialog.accept());
			await page.getByRole("menuitem", { name: /^delete$/i }).click();
			await expect(page.getByText("Deck deleted.")).toBeVisible();
		} finally {
			await supabaseAdmin.from("decks").delete().eq("name", deckName);
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});
});
