import type { Database } from "@/lib/supabase/database.types";

export type FlashcardAlgorithm =
	Database["public"]["Enums"]["flashcard_algorithm"];
export type CardStatus = Database["public"]["Enums"]["card_status"];

// ─── Review grades ────────────────────────────────────────────────────────────

/** Anki-style quality buttons shown on the back of a card. */
export type ReviewGrade = "again" | "hard" | "good" | "easy";

export const REVIEW_GRADES: readonly ReviewGrade[] = [
	"again",
	"hard",
	"good",
	"easy",
];

// ─── Scheduling ───────────────────────────────────────────────────────────────

/** Per-user scheduling state of a single card (mirrors `deck_cards`). */
export interface SchedulingSnapshot {
	status: CardStatus;
	easeFactor: number;
	/** Current inter-repetition interval in days (0 while in learning). */
	interval: number;
	/** SM-2 repetition count / Leitner box number / FSRS review count. */
	repetitions: number;
	stability: number;
	difficulty: number;
	elapsedDays: number;
	scheduledDays: number;
	nextReviewDate: string;
	lastReviewedAt: string | null;
	firstReviewedAt: string | null;
}

/** What an algorithm returns after grading a card. */
export interface SchedulingResult {
	status: CardStatus;
	easeFactor: number;
	interval: number;
	repetitions: number;
	stability: number;
	difficulty: number;
	elapsedDays: number;
	scheduledDays: number;
	/** ISO timestamp of the next review. */
	nextReviewDate: string;
	/** True when the card comes back within the current study session. */
	isDueInSession: boolean;
}

/** Deck-level algorithm parameters (mirrors `decks` columns + `config`). */
export interface DeckSchedulingConfig {
	algorithm: FlashcardAlgorithm;
	fsrsRequestRetention: number;
	fsrsMaximumInterval: number;
	sm2StartingEase: number;
	sm2EasyBonus: number;
	sm2IntervalModifier: number;
	/** Review interval (days) for each Leitner box, box 1 first. */
	leitnerBoxIntervals: readonly number[];
}

/** Human-friendly preview of when a card would come back for a grade. */
export type IntervalPreview =
	| { unit: "minutes"; value: number }
	| { unit: "days"; value: number }
	| { unit: "months"; value: number };

export type GradePreviews = Record<ReviewGrade, IntervalPreview>;

// ─── Session data ─────────────────────────────────────────────────────────────

export interface FlashcardAnswer {
	answer: string;
	isCorrect: boolean;
}

/** Content of a flashcard as shown during practice. */
export interface SessionFlashcard {
	id: string;
	question: string;
	answers: FlashcardAnswer[];
	fact: string | null;
	hint: string | null;
}

/** One reviewable card in a study session. */
export interface SessionCard {
	deckCardId: string;
	flashcard: SessionFlashcard;
	scheduling: SchedulingSnapshot;
}

export interface SessionCounts {
	newCount: number;
	learningCount: number;
	reviewCount: number;
}

export interface StudySession {
	deckId: string;
	config: DeckSchedulingConfig;
	cards: SessionCard[];
	counts: SessionCounts;
}

// ─── Decks ────────────────────────────────────────────────────────────────────

/** A deck the student is enrolled in ("active learning deck"). */
export interface ActiveDeck {
	deckId: string;
	name: string;
	description: string | null;
	algorithm: FlashcardAlgorithm;
	dailyLimit: number;
	dueCount: number;
	newCount: number;
}

/** A deck the student can enroll in. */
export interface EnrollableDeck {
	id: string;
	name: string;
	description: string | null;
	algorithm: FlashcardAlgorithm;
	cardCount: number;
	isFree: boolean;
	priceCredits: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_DAILY_LIMIT = 20;
export const MIN_DAILY_LIMIT = 1;
export const MAX_DAILY_LIMIT = 100;

/** Classic Leitner box intervals in days (box 1 → box 5). */
export const DEFAULT_LEITNER_BOX_INTERVALS: readonly number[] = [
	1, 2, 4, 8, 16,
];
