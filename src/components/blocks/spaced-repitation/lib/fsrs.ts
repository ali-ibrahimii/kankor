import type {
	DeckSchedulingConfig,
	ReviewGrade,
	SchedulingResult,
	SchedulingSnapshot,
} from "../types";
import {
	LEARNING_STEP_AGAIN_MINUTES,
	LEARNING_STEP_HARD_MINUTES,
	MAX_STORED_INTERVAL_DAYS,
	RELEARNING_STEP_MINUTES,
} from "./constants";
import { addDays, addMinutes, clamp, daysBetween } from "./dates";

/**
 * FSRS-4.5 (Free Spaced Repetition Scheduler).
 *
 * Memory is modelled per card with two variables:
 * - stability (S): days until retrievability drops to 90%
 * - difficulty (D): 1–10, how hard the card is to stabilise
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

/** Default FSRS-4.5 weights (w0…w16). */
const W = [
	0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
	0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
] as const;

const DECAY = -0.5;
const FACTOR = 19 / 81;
const MIN_STABILITY = 0.1;

type FsrsRating = 1 | 2 | 3 | 4;

const RATING_BY_GRADE: Record<ReviewGrade, FsrsRating> = {
	again: 1,
	hard: 2,
	good: 3,
	easy: 4,
};

/** Probability of recall after `elapsedDays` for a card with stability `S`. */
function retrievability(elapsedDays: number, stability: number): number {
	return (
		(1 + FACTOR * (elapsedDays / Math.max(stability, MIN_STABILITY))) ** DECAY
	);
}

/** Interval (days) at which retrievability decays to the requested retention. */
function nextIntervalDays(
	stability: number,
	config: DeckSchedulingConfig
): number {
	const retention = clamp(config.fsrsRequestRetention, 0.7, 0.99);
	const interval = (stability / FACTOR) * (retention ** (1 / DECAY) - 1);
	const maxInterval = clamp(
		Math.floor(config.fsrsMaximumInterval),
		1,
		MAX_STORED_INTERVAL_DAYS
	);
	return clamp(Math.round(interval), 1, maxInterval);
}

function initStability(rating: FsrsRating): number {
	return Math.max(W[rating - 1], MIN_STABILITY);
}

function initDifficulty(rating: FsrsRating): number {
	return clamp(W[4] - (rating - 3) * W[5], 1, 10);
}

function nextDifficulty(difficulty: number, rating: FsrsRating): number {
	const updated = difficulty - W[6] * (rating - 3);
	// Mean reversion towards the initial difficulty of an "easy" first rating
	// keeps difficulty from drifting to the extremes over many reviews.
	const reverted = W[7] * initDifficulty(4) + (1 - W[7]) * updated;
	return clamp(reverted, 1, 10);
}

function nextRecallStability(
	difficulty: number,
	stability: number,
	recall: number,
	rating: FsrsRating
): number {
	const hardPenalty = rating === 2 ? W[15] : 1;
	const easyBonus = rating === 4 ? W[16] : 1;
	const growth =
		Math.exp(W[8]) *
		(11 - difficulty) *
		stability ** -W[9] *
		(Math.exp((1 - recall) * W[10]) - 1) *
		hardPenalty *
		easyBonus;
	return Math.max(stability * (1 + growth), MIN_STABILITY);
}

function nextForgetStability(
	difficulty: number,
	stability: number,
	recall: number
): number {
	const forget =
		W[11] *
		difficulty ** -W[12] *
		((stability + 1) ** W[13] - 1) *
		Math.exp((1 - recall) * W[14]);
	// A lapse can never leave the card more stable than it was.
	return clamp(forget, MIN_STABILITY, stability);
}

export function scheduleFsrs(
	card: SchedulingSnapshot,
	grade: ReviewGrade,
	config: DeckSchedulingConfig,
	now: Date
): SchedulingResult {
	const rating = RATING_BY_GRADE[grade];
	const base = {
		easeFactor: card.easeFactor,
		repetitions: card.repetitions + 1,
	};

	// First exposure — seed stability/difficulty from the initial rating.
	if (card.status === "new") {
		const stability = initStability(rating);
		const difficulty = initDifficulty(rating);

		if (grade === "again" || grade === "hard") {
			const minutes =
				grade === "again"
					? LEARNING_STEP_AGAIN_MINUTES
					: LEARNING_STEP_HARD_MINUTES;
			return {
				...base,
				status: "learning",
				stability,
				difficulty,
				interval: 0,
				elapsedDays: 0,
				scheduledDays: 0,
				nextReviewDate: addMinutes(now, minutes).toISOString(),
				isDueInSession: true,
			};
		}

		const interval = nextIntervalDays(stability, config);
		return {
			...base,
			status: "review",
			stability,
			difficulty,
			interval,
			elapsedDays: 0,
			scheduledDays: interval,
			nextReviewDate: addDays(now, interval).toISOString(),
			isDueInSession: false,
		};
	}

	// Learning / relearning steps — sub-day, handled inside the session.
	if (card.status === "learning" || card.status === "relearning") {
		// Preserve the state set at first exposure (or by a prior lapse) —
		// re-deriving it from whatever grade the student happens to press next
		// would silently erase a card's real difficulty/lapse history every
		// time it comes back around in the same session.
		const stability =
			card.stability > 0 ? card.stability : initStability(rating);
		const difficulty =
			card.difficulty > 0 ? card.difficulty : initDifficulty(rating);

		if (grade === "again" || grade === "hard") {
			const minutes =
				grade === "again"
					? LEARNING_STEP_AGAIN_MINUTES
					: LEARNING_STEP_HARD_MINUTES;
			return {
				...base,
				status: card.status,
				stability,
				difficulty,
				interval: 0,
				elapsedDays: 0,
				scheduledDays: 0,
				nextReviewDate: addMinutes(now, minutes).toISOString(),
				isDueInSession: true,
			};
		}

		// Graduation — apply the same recall-growth update a "review" grade
		// would get, from elapsed time since the card's last learning-step
		// review. A same-day graduation (elapsedDays≈0) yields recall≈1, so
		// growth≈0 and stability carries over unchanged — a card is only
		// credited with *real* growth once time has actually tested it.
		const elapsedDays = card.lastReviewedAt
			? daysBetween(card.lastReviewedAt, now)
			: 0;
		const recall = retrievability(elapsedDays, stability);
		const newDifficulty = nextDifficulty(difficulty, rating);
		const newStability = nextRecallStability(
			difficulty,
			stability,
			recall,
			rating
		);
		const interval = nextIntervalDays(newStability, config);
		return {
			...base,
			status: "review",
			stability: newStability,
			difficulty: newDifficulty,
			interval,
			elapsedDays,
			scheduledDays: interval,
			nextReviewDate: addDays(now, interval).toISOString(),
			isDueInSession: false,
		};
	}

	// Review — full FSRS memory-state update.
	const elapsedDays = card.lastReviewedAt
		? daysBetween(card.lastReviewedAt, now)
		: card.elapsedDays;
	const stability = Math.max(card.stability, MIN_STABILITY);
	const difficulty = card.difficulty > 0 ? card.difficulty : initDifficulty(3);
	const recall = retrievability(elapsedDays, stability);
	const newDifficulty = nextDifficulty(difficulty, rating);

	if (grade === "again") {
		return {
			...base,
			status: "relearning",
			stability: nextForgetStability(difficulty, stability, recall),
			difficulty: newDifficulty,
			interval: 0,
			elapsedDays,
			scheduledDays: 0,
			nextReviewDate: addMinutes(now, RELEARNING_STEP_MINUTES).toISOString(),
			isDueInSession: true,
		};
	}

	const newStability = nextRecallStability(
		difficulty,
		stability,
		recall,
		rating
	);
	const interval = nextIntervalDays(newStability, config);
	return {
		...base,
		status: "review",
		stability: newStability,
		difficulty: newDifficulty,
		interval,
		elapsedDays,
		scheduledDays: interval,
		nextReviewDate: addDays(now, interval).toISOString(),
		isDueInSession: false,
	};
}
