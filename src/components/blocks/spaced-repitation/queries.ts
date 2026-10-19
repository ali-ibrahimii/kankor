import { createClient } from "@/lib/supabase/server";
import { endOfToday, startOfToday } from "./lib/dates";
import {
	toSchedulingConfig,
	toSchedulingSnapshot,
	toSessionFlashcard,
} from "./lib/mappers";
import { buildSessionQueue, countByBucket } from "./lib/queue";
import type { ActiveDeck, SessionCard, StudySession } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const DECK_CONFIG_COLUMNS =
	"algorithm, config, fsrs_maximum_interval, fsrs_request_retention, sm2_easy_bonus, sm2_interval_modifier, sm2_starting_ease";

const DECK_CARD_COLUMNS =
	"id, flashcard_id, status, ease_factor, interval, repetitions, stability, difficulty, elapsed_days, scheduled_days, next_review_date, last_reviewed_at, first_reviewed_at";

/** Cap on cards loaded into one session so a huge backlog stays responsive. */
const MAX_SESSION_CARDS = 200;

// ─── Active learning decks ────────────────────────────────────────────────────

export async function getActiveLearningDecks(
	userId: string
): Promise<ActiveDeck[]> {
	const supabase = await createClient();
	const now = new Date();

	const { data: enrollments, error } = await supabase
		.from("enrollments")
		.select(
			"deck_id, flashcard_daily_limit, decks(id, name, description, algorithm)"
		)
		.eq("user_id", userId)
		.not("deck_id", "is", null)
		.order("created_at", { ascending: false });

	if (error || !enrollments) return [];

	const decks = await Promise.all(
		enrollments.map(async (enrollment) => {
			const deck = enrollment.decks;
			if (!deck) return null;

			const [due, fresh] = await Promise.all([
				supabase
					.from("deck_cards")
					.select("id", { count: "exact", head: true })
					.eq("user_id", userId)
					.eq("deck_id", deck.id)
					.neq("status", "new")
					.lte("next_review_date", endOfToday(now).toISOString()),
				supabase
					.from("deck_cards")
					.select("id", { count: "exact", head: true })
					.eq("user_id", userId)
					.eq("deck_id", deck.id)
					.eq("status", "new"),
			]);

			const active: ActiveDeck = {
				deckId: deck.id,
				name: deck.name,
				description: deck.description,
				algorithm: deck.algorithm,
				dailyLimit: enrollment.flashcard_daily_limit ?? 0,
				dueCount: due.count ?? 0,
				newCount: fresh.count ?? 0,
			};
			return active;
		})
	);

	return decks.filter((deck): deck is ActiveDeck => deck !== null);
}

// ─── New-card import (daily limit) ────────────────────────────────────────────

/**
 * Pull up to `dailyLimit` unseen flashcards from the deck into the student's
 * `deck_cards`. Idempotent per day: cards already imported today count
 * against the limit, so reloading the page never over-imports.
 *
 * Runs as a single Postgres function (import_new_deck_cards) that locks the
 * enrollment row for its duration, rather than separate check-then-insert
 * queries from here — two near-simultaneous calls (e.g. a client
 * `router.push` immediately followed by `router.refresh()`) would otherwise
 * both read "0 imported today" before either committed and each import a
 * full batch, silently doubling the daily limit.
 */
async function importNewCards(
	supabase: SupabaseServerClient,
	userId: string,
	deckId: string,
	dailyLimit: number,
	now: Date
): Promise<void> {
	if (dailyLimit <= 0) return;

	await supabase.rpc("import_new_deck_cards", {
		p_user_id: userId,
		p_deck_id: deckId,
		p_now: now.toISOString(),
		p_start_of_today: startOfToday(now).toISOString(),
	});
}

// ─── Study session ────────────────────────────────────────────────────────────

export async function getStudySession(
	userId: string,
	deckId: string
): Promise<StudySession | null> {
	const supabase = await createClient();
	const now = new Date();

	const [{ data: deck }, { data: enrollment }] = await Promise.all([
		supabase
			.from("decks")
			.select(DECK_CONFIG_COLUMNS)
			.eq("id", deckId)
			.single(),
		supabase
			.from("enrollments")
			.select("id, flashcard_daily_limit")
			.eq("user_id", userId)
			.eq("deck_id", deckId)
			.maybeSingle(),
	]);

	if (!deck || !enrollment) return null;

	await importNewCards(
		supabase,
		userId,
		deckId,
		enrollment.flashcard_daily_limit ?? 0,
		now
	);

	const { data: rows, error } = await supabase
		.from("deck_cards")
		.select(
			`${DECK_CARD_COLUMNS}, flashcards(id, question, answers, fact, hint)`
		)
		.eq("user_id", userId)
		.eq("deck_id", deckId)
		.or(`status.eq.new,next_review_date.lte.${endOfToday(now).toISOString()}`)
		.order("next_review_date")
		.limit(MAX_SESSION_CARDS);

	if (error) return null;

	const cards: SessionCard[] = (rows ?? []).flatMap((row) => {
		if (!row.flashcards) return [];
		return [
			{
				deckCardId: row.id,
				flashcard: toSessionFlashcard(row.flashcards),
				scheduling: toSchedulingSnapshot(row),
			},
		];
	});

	const queue = buildSessionQueue(cards);

	return {
		deckId,
		config: toSchedulingConfig(deck),
		cards: queue,
		counts: countByBucket(queue),
	};
}
