"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { clamp } from "./lib/dates";
import {
	toDeckCardUpdate,
	toSchedulingConfig,
	toSchedulingSnapshot,
} from "./lib/mappers";
import { scheduleReview } from "./lib/scheduler";
import type { EnrollableDeck, ReviewGrade, SchedulingResult } from "./types";
import { MAX_DAILY_LIMIT, MIN_DAILY_LIMIT } from "./types";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

// ─── Enroll ───────────────────────────────────────────────────────────────────

export async function enrollInDeck(
	deckId: string,
	dailyLimit: number,
	discountCode?: string
): Promise<Result<{ alreadyEnrolled: boolean }>> {
	const supabase = await createClient();
	const { data } = await supabase.auth.getClaims();
	const userId = data?.claims.sub;
	if (!userId) return { success: false, error: "Unauthenticated" };

	const limit = clamp(Math.round(dailyLimit), MIN_DAILY_LIMIT, MAX_DAILY_LIMIT);

	const { data: existing } = await supabase
		.from("enrollments")
		.select("id")
		.eq("user_id", userId)
		.eq("deck_id", deckId)
		.maybeSingle();

	if (existing) {
		const { error } = await supabase
			.from("enrollments")
			.update({ flashcard_daily_limit: limit })
			.eq("id", existing.id);
		if (error) return { success: false, error: error.message };
		revalidatePath(routes.d.decks.practice.page());
		revalidatePath(routes.d.myDecks.page());
		return { success: true, data: { alreadyEnrolled: true } };
	}

	const { data: deck, error: deckError } = await supabase
		.from("decks")
		.select("is_free")
		.eq("id", deckId)
		.single();
	if (deckError || !deck) {
		return { success: false, error: deckError?.message ?? "Deck not found" };
	}

	if (deck.is_free) {
		const { error } = await supabase.from("enrollments").insert({
			user_id: userId,
			deck_id: deckId,
			flashcard_daily_limit: limit,
			enrolled_at: new Date().toISOString(),
		});
		if (error) return { success: false, error: error.message };
	} else {
		const { error } = await supabase.rpc("purchase_item", {
			p_item_type: "deck",
			p_item_id: deckId,
			p_daily_limit: limit,
			p_discount_code: discountCode,
		});
		if (error) return { success: false, error: error.message };
	}

	revalidatePath(routes.d.decks.practice.page());
	revalidatePath(routes.d.myDecks.page());
	return { success: true, data: { alreadyEnrolled: false } };
}

// ─── Daily limit ──────────────────────────────────────────────────────────────

export async function updateDailyLimit(
	deckId: string,
	dailyLimit: number
): Promise<Result> {
	const supabase = await createClient();
	const { data } = await supabase.auth.getClaims();
	const userId = data?.claims.sub;
	if (!userId) return { success: false, error: "Unauthenticated" };

	const limit = clamp(Math.round(dailyLimit), MIN_DAILY_LIMIT, MAX_DAILY_LIMIT);
	const { error } = await supabase
		.from("enrollments")
		.update({ flashcard_daily_limit: limit })
		.eq("user_id", userId)
		.eq("deck_id", deckId);

	if (error) return { success: false, error: error.message };

	revalidatePath(routes.d.decks.practice.page());
	revalidatePath(routes.d.myDecks.page());
	return { success: true, data: undefined };
}

// ─── Review a card ────────────────────────────────────────────────────────────

/**
 * Authoritative review: the scheduling state is recomputed on the server from
 * the stored card + deck config, so a stale client can't corrupt intervals.
 */
export async function reviewCard(
	deckCardId: string,
	grade: ReviewGrade
): Promise<Result<SchedulingResult>> {
	const supabase = await createClient();
	const { data } = await supabase.auth.getClaims();
	const userId = data?.claims.sub;
	if (!userId) return { success: false, error: "Unauthenticated" };

	const { data: row, error: cardError } = await supabase
		.from("deck_cards")
		.select("*, decks(*)")
		.eq("id", deckCardId)
		.eq("user_id", userId)
		.single();

	if (cardError || !row || !row.decks) {
		return { success: false, error: cardError?.message ?? "Card not found" };
	}

	const now = new Date();
	const result = scheduleReview(
		toSchedulingSnapshot(row),
		grade,
		toSchedulingConfig(row.decks),
		now
	);

	const { error: updateError } = await supabase
		.from("deck_cards")
		.update(toDeckCardUpdate(result, now, row.first_reviewed_at))
		.eq("id", deckCardId)
		.eq("user_id", userId);

	if (updateError) return { success: false, error: updateError.message };

	return { success: true, data: result };
}

// ─── Enrollable decks (for the "add deck" dialog) ─────────────────────────────

export async function listEnrollableDecks(): Promise<Result<EnrollableDeck[]>> {
	const supabase = await createClient();
	const { data } = await supabase.auth.getClaims();
	const userId = data?.claims.sub;
	if (!userId) return { success: false, error: "Unauthenticated" };

	const [{ data: enrollments }, { data: decks, error }] = await Promise.all([
		supabase
			.from("enrollments")
			.select("deck_id")
			.eq("user_id", userId)
			.not("deck_id", "is", null),
		supabase
			.from("decks")
			.select(
				"id, name, description, algorithm, is_free, price_credits, flashcards(count)"
			)
			.or(`user_id.eq.${userId},visibility.eq.public`)
			.order("updated_at", { ascending: false }),
	]);

	if (error) return { success: false, error: error.message };

	const enrolledIds = new Set(
		(enrollments ?? []).map((enrollment) => enrollment.deck_id)
	);

	const enrollable: EnrollableDeck[] = (decks ?? [])
		.filter((deck) => !enrolledIds.has(deck.id))
		.map((deck) => ({
			id: deck.id,
			name: deck.name,
			description: deck.description,
			algorithm: deck.algorithm,
			cardCount: deck.flashcards?.[0]?.count ?? 0,
			isFree: deck.is_free,
			priceCredits: deck.price_credits,
		}));

	return { success: true, data: enrollable };
}
