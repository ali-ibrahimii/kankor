import type {
	DeckSchedulingConfig,
	ReviewGrade,
	SchedulingResult,
	SchedulingSnapshot,
} from "../types";
import { DEFAULT_LEITNER_BOX_INTERVALS } from "../types";
import { LEARNING_STEP_AGAIN_MINUTES } from "./constants";
import { addDays, addMinutes, clamp } from "./dates";

/**
 * Leitner box system. The card's box number lives in `repetitions`
 * (0 = unseen, 1 = first box). Correct answers promote the card one box
 * ("easy" jumps two), a wrong answer sends it back to box 1.
 */

function boxIntervals(config: DeckSchedulingConfig): readonly number[] {
	return config.leitnerBoxIntervals.length > 0
		? config.leitnerBoxIntervals
		: DEFAULT_LEITNER_BOX_INTERVALS;
}

export function scheduleLeitner(
	card: SchedulingSnapshot,
	grade: ReviewGrade,
	config: DeckSchedulingConfig,
	now: Date
): SchedulingResult {
	const intervals = boxIntervals(config);
	const maxBox = intervals.length;
	const currentBox = clamp(card.repetitions, 0, maxBox);
	const base = {
		easeFactor: card.easeFactor,
		stability: card.stability,
		difficulty: card.difficulty,
		elapsedDays: card.lastReviewedAt ? card.elapsedDays : 0,
	};

	// Wrong answer — back to box 1, retry within the session first.
	if (grade === "again") {
		return {
			...base,
			status: card.status === "new" ? "learning" : "relearning",
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

	// hard = repeat the current box, good = up one box, easy = up two boxes.
	// A new card enters box 1 ("easy" lets it skip straight to box 2).
	const promotion = grade === "hard" ? 0 : grade === "easy" ? 2 : 1;
	const nextBox =
		currentBox === 0
			? clamp(promotion, 1, maxBox)
			: clamp(currentBox + promotion, 1, maxBox);
	const interval = intervals[nextBox - 1];

	return {
		...base,
		status: "review",
		interval,
		repetitions: nextBox,
		scheduledDays: interval,
		nextReviewDate: addDays(now, interval).toISOString(),
		isDueInSession: false,
	};
}
