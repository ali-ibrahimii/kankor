import type { Database, Json } from "@/lib/supabase/database.types";
import type {
	DeckSchedulingConfig,
	FlashcardAnswer,
	SchedulingResult,
	SchedulingSnapshot,
	SessionFlashcard,
} from "../types";
import { DEFAULT_LEITNER_BOX_INTERVALS } from "../types";

type DeckRow = Pick<
	Database["public"]["Tables"]["decks"]["Row"],
	| "algorithm"
	| "config"
	| "fsrs_maximum_interval"
	| "fsrs_request_retention"
	| "sm2_easy_bonus"
	| "sm2_interval_modifier"
	| "sm2_starting_ease"
>;

type DeckCardRow = Pick<
	Database["public"]["Tables"]["deck_cards"]["Row"],
	| "status"
	| "ease_factor"
	| "interval"
	| "repetitions"
	| "stability"
	| "difficulty"
	| "elapsed_days"
	| "scheduled_days"
	| "next_review_date"
	| "last_reviewed_at"
	| "first_reviewed_at"
>;

type FlashcardRow = Pick<
	Database["public"]["Tables"]["flashcards"]["Row"],
	"id" | "question" | "answers" | "fact" | "hint"
>;

function parseLeitnerIntervals(config: Json | null): readonly number[] {
	if (!config || typeof config !== "object" || Array.isArray(config)) {
		return DEFAULT_LEITNER_BOX_INTERVALS;
	}
	const raw = (config as Record<string, Json | undefined>)
		.leitner_box_intervals;
	if (
		Array.isArray(raw) &&
		raw.length > 0 &&
		raw.every((n) => typeof n === "number" && n > 0)
	) {
		return raw as number[];
	}
	return DEFAULT_LEITNER_BOX_INTERVALS;
}

export function toSchedulingConfig(deck: DeckRow): DeckSchedulingConfig {
	return {
		algorithm: deck.algorithm,
		fsrsMaximumInterval: deck.fsrs_maximum_interval,
		fsrsRequestRetention: deck.fsrs_request_retention,
		sm2StartingEase: deck.sm2_starting_ease,
		sm2EasyBonus: deck.sm2_easy_bonus,
		sm2IntervalModifier: deck.sm2_interval_modifier,
		leitnerBoxIntervals: parseLeitnerIntervals(deck.config),
	};
}

export function toSchedulingSnapshot(row: DeckCardRow): SchedulingSnapshot {
	return {
		status: row.status,
		easeFactor: row.ease_factor,
		interval: row.interval,
		repetitions: row.repetitions,
		stability: row.stability,
		difficulty: row.difficulty,
		elapsedDays: row.elapsed_days,
		scheduledDays: row.scheduled_days,
		nextReviewDate: row.next_review_date,
		lastReviewedAt: row.last_reviewed_at,
		firstReviewedAt: row.first_reviewed_at,
	};
}

/** Column updates persisting an algorithm result to `deck_cards`. */
export function toDeckCardUpdate(
	result: SchedulingResult,
	now: Date,
	firstReviewedAt: string | null
): Database["public"]["Tables"]["deck_cards"]["Update"] {
	return {
		status: result.status,
		ease_factor: result.easeFactor,
		interval: result.interval,
		repetitions: result.repetitions,
		stability: result.stability,
		difficulty: result.difficulty,
		elapsed_days: result.elapsedDays,
		scheduled_days: result.scheduledDays,
		next_review_date: result.nextReviewDate,
		last_reviewed_at: now.toISOString(),
		first_reviewed_at: firstReviewedAt ?? now.toISOString(),
		updated_at: now.toISOString(),
	};
}

export function toSessionFlashcard(row: FlashcardRow): SessionFlashcard {
	return {
		id: row.id,
		question: row.question,
		answers: (row.answers ?? []) as unknown as FlashcardAnswer[],
		fact: row.fact,
		hint: row.hint,
	};
}
