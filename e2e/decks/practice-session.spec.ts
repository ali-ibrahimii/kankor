import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "./deck-test-helpers";

test.describe("Practice session", () => {
	test("student can enroll in a deck and grade a card through to session complete", async ({
		page,
	}) => {
		const { email, userId } = await createTestUser(
			"student",
			"deck-practice"
		);
		const deckName = `Playwright Practice Deck ${Date.now()}`;
		let deckId: string | undefined;

		try {
			// Seed a deck with a single flashcard directly — this test exercises
			// the practice/review UI, not deck authoring (covered separately in
			// deck-management.spec.ts).
			const { data: deck, error: deckError } = await supabaseAdmin
				.from("decks")
				.insert({
					name: deckName,
					user_id: userId,
					algorithm: "fsrs",
					visibility: "private",
					creation: "custom",
				})
				.select("id")
				.single();
			expect(deckError).toBeNull();
			deckId = deck?.id;

			const { error: cardError } = await supabaseAdmin.from("flashcards").insert({
				deck_id: deckId,
				question: "What is the capital of France?",
				answers: [
					{ answer: "Paris", isCorrect: true },
					{ answer: "Lyon", isCorrect: false },
				],
				creation: "custom",
				user_id: userId,
			});
			expect(cardError).toBeNull();

			await loginAs(page, email);
			await expect(page).toHaveURL(/\/d/);

			// ── Enroll via the "Study" CTA on the deck list ────────────────────
			await page.goto("/en/d/decks");
			const card = page
				.locator("[data-slot='card']")
				.filter({ hasText: deckName });
			await card.getByRole("button", { name: /^study$/i }).click();

			const enrollDialog = page.getByRole("dialog");
			await enrollDialog
				.getByRole("button", { name: /^start learning$/i })
				.click();
			await expect(page).toHaveURL(/\/d\/decks\/practice\?deck=/);

			// ── Flip the card and grade it ─────────────────────────────────────
			await expect(
				page.getByText("What is the capital of France?")
			).toBeVisible();
			await page.getByRole("button", { name: /flip card/i }).click();
			await expect(page.getByText("Paris")).toBeVisible();
			await page.getByRole("button", { name: /^good/i }).click();

			// Single-card deck: grading the only due card ends the session.
			await expect(page.getByText("Session complete!")).toBeVisible({
				timeout: 10_000,
			});
		} finally {
			if (deckId) {
				await supabaseAdmin.from("deck_cards").delete().eq("deck_id", deckId);
				await supabaseAdmin.from("enrollments").delete().eq("deck_id", deckId);
				await supabaseAdmin.from("flashcards").delete().eq("deck_id", deckId);
				await supabaseAdmin.from("decks").delete().eq("id", deckId);
			}
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});
});
