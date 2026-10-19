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
} from "./constants";
import { addDays, addMinutes, clamp } from "./dates";

/**
 * SM-2 (SuperMemo 2) with the Anki-style refinements the deck columns expose:
 * starting ease, easy bonus, and a global interval modifier.
 *
 * Reference: https://super-memory.com/english/ol/sm2.htm
 */

const MIN_EASE = 1.3;
/** Anki-style multiplier for "hard" answers past the first repetitions. */
const HARD_INTERVAL_FACTOR = 1.2;
/** Anki's flat ease penalty applied when a mature review card lapses. */
const EASE_LAPSE_PENALTY = 0.2;
/** First-interval defaults (days). */
const FIRST_INTERVAL = 1;
const SECOND_INTERVAL = 6;
const EASY_FIRST_INTERVAL = 4;

/** SM-2 quality score for each grade (again = failed recall). */
const QUALITY_BY_GRADE: Record<ReviewGrade, number> = {
	again: 1,
	hard: 3,
	good: 4,
	easy: 5,
};

function updatedEase(ease: number, quality: number): number {
	const next = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
	return Math.max(next, MIN_EASE);
}

export function scheduleSm2(
	card: SchedulingSnapshot,
	grade: ReviewGrade,
	config: DeckSchedulingConfig,
	now: Date
): SchedulingResult {
	const ease =
		card.easeFactor >= MIN_EASE ? card.easeFactor : config.sm2StartingEase;
	const base = {
		stability: card.stability,
		difficulty: card.difficulty,
		elapsedDays: card.lastReviewedAt ? card.elapsedDays : 0,
	};
	const isLearningPhase = card.status !== "review";

	// Failed recall — restart repetitions, retry soon. Anki also knocks 20
	// points off ease on every lapse from a mature review card (floored at
	// MIN_EASE); a brand-new/learning card has no established ease yet, so
	// its ease is left untouched, matching classic SM-2.
	if (grade === "again") {
		return {
			...base,
			status: card.status === "new" ? "learning" : "relearning",
			easeFactor:
				card.status === "review"
					? Math.max(ease - EASE_LAPSE_PENALTY, MIN_EASE)
					: ease,
			interval: 0,
			repetitions: 0,
			scheduledDays: 0,
			nextReviewDate: addMinutes(
				now,
				LEARNING_STEP_AGAIN_MINUTES
			).toISOString(),
			isDueInSession: true,
		};
	}

	// "Hard" during learning/relearning repeats the current step — Anki never
	// lets "Hard" graduate a card straight out of learning into a day-based
	// review interval.
	if (grade === "hard" && isLearningPhase) {
		return {
			...base,
			status: card.status === "new" ? "learning" : card.status,
			easeFactor: ease,
			interval: 0,
			repetitions: card.repetitions,
			scheduledDays: 0,
			nextReviewDate: addMinutes(now, LEARNING_STEP_HARD_MINUTES).toISOString(),
			isDueInSession: true,
		};
	}

	const quality = QUALITY_BY_GRADE[grade];
	const ease2 = updatedEase(ease, quality);
	const repetitions = card.repetitions + 1;

	// The graduating intervals (1st/2nd repetition) are flat settings, same as
	// Anki's "Graduating interval"/"Easy interval" — they are not multiplied
	// by the easy bonus. The easy bonus only grows intervals for already-
	// mature cards (repetitions > 2), same as Anki's ease*easyBonus formula.
	let rawInterval: number;
	if (repetitions === 1) {
		rawInterval = grade === "easy" ? EASY_FIRST_INTERVAL : FIRST_INTERVAL;
	} else if (repetitions === 2) {
		rawInterval = SECOND_INTERVAL;
	} else if (grade === "hard") {
		rawInterval = card.interval * HARD_INTERVAL_FACTOR;
	} else {
		rawInterval = card.interval * ease2;
		if (grade === "easy") rawInterval *= config.sm2EasyBonus;
	}

	const interval = clamp(
		Math.round(rawInterval * config.sm2IntervalModifier),
		1,
		MAX_STORED_INTERVAL_DAYS
	);

	return {
		...base,
		status: "review",
		easeFactor: ease2,
		interval,
		repetitions,
		scheduledDays: interval,
		nextReviewDate: addDays(now, interval).toISOString(),
		isDueInSession: false,
	};
}
