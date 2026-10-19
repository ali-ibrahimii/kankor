import type {
	DeckSchedulingConfig,
	GradePreviews,
	IntervalPreview,
	ReviewGrade,
	SchedulingResult,
	SchedulingSnapshot,
} from "../types";
import { REVIEW_GRADES } from "../types";
import { scheduleFsrs } from "./fsrs";
import { scheduleLeitner } from "./leitner";
import { scheduleSm2 } from "./sm2";

/**
 * Single entry point for all three algorithms. Pure — safe to run on the
 * server (authoritative reviews) and on the client (interval previews).
 */
export function scheduleReview(
	card: SchedulingSnapshot,
	grade: ReviewGrade,
	config: DeckSchedulingConfig,
	now: Date = new Date()
): SchedulingResult {
	switch (config.algorithm) {
		case "fsrs":
			return scheduleFsrs(card, grade, config, now);
		case "sm2":
			return scheduleSm2(card, grade, config, now);
		case "leitner":
			return scheduleLeitner(card, grade, config, now);
	}
}

// ─── Interval previews (labels under the grade buttons) ───────────────────────

function toPreview(result: SchedulingResult, now: Date): IntervalPreview {
	if (result.isDueInSession) {
		const minutes = Math.max(
			1,
			Math.round(
				(new Date(result.nextReviewDate).getTime() - now.getTime()) / 60_000
			)
		);
		return { unit: "minutes", value: minutes };
	}
	if (result.interval >= 60) {
		return { unit: "months", value: Math.round(result.interval / 30) };
	}
	return { unit: "days", value: Math.max(1, result.interval) };
}

/** What each grade button would do to the current card. */
export function previewGrades(
	card: SchedulingSnapshot,
	config: DeckSchedulingConfig,
	now: Date = new Date()
): GradePreviews {
	const entries = REVIEW_GRADES.map((grade) => [
		grade,
		toPreview(scheduleReview(card, grade, config, now), now),
	]);
	return Object.fromEntries(entries) as GradePreviews;
}
