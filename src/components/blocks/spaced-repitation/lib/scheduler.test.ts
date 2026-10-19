import { describe, expect, it } from "vitest";
import type { DeckSchedulingConfig, SchedulingSnapshot } from "../types";
import { DEFAULT_LEITNER_BOX_INTERVALS } from "../types";
import { scheduleFsrs } from "./fsrs";
import { scheduleLeitner } from "./leitner";
import { buildSessionQueue, countByBucket } from "./queue";
import { previewGrades, scheduleReview } from "./scheduler";
import { scheduleSm2 } from "./sm2";

const NOW = new Date("2026-07-02T10:00:00.000Z");

const config: DeckSchedulingConfig = {
	algorithm: "fsrs",
	fsrsRequestRetention: 0.9,
	fsrsMaximumInterval: 36500,
	sm2StartingEase: 2.5,
	sm2EasyBonus: 1.3,
	sm2IntervalModifier: 1,
	leitnerBoxIntervals: DEFAULT_LEITNER_BOX_INTERVALS,
};

function newCard(
	overrides: Partial<SchedulingSnapshot> = {}
): SchedulingSnapshot {
	return {
		status: "new",
		easeFactor: 2.5,
		interval: 0,
		repetitions: 0,
		stability: 0,
		difficulty: 0,
		elapsedDays: 0,
		scheduledDays: 0,
		nextReviewDate: NOW.toISOString(),
		lastReviewedAt: null,
		firstReviewedAt: null,
		...overrides,
	};
}

// ─── FSRS ─────────────────────────────────────────────────────────────────────

describe("scheduleFsrs", () => {
	it("keeps a failed new card in the session", () => {
		const result = scheduleFsrs(newCard(), "again", config, NOW);
		expect(result.status).toBe("learning");
		expect(result.isDueInSession).toBe(true);
		expect(result.interval).toBe(0);
	});

	it("graduates a new card rated good with a positive interval", () => {
		const result = scheduleFsrs(newCard(), "good", config, NOW);
		expect(result.status).toBe("review");
		expect(result.isDueInSession).toBe(false);
		expect(result.interval).toBeGreaterThanOrEqual(1);
		expect(result.stability).toBeCloseTo(3.7145, 3);
		expect(result.difficulty).toBeCloseTo(5.1618, 3);
	});

	it("gives easy a longer first interval than good", () => {
		const good = scheduleFsrs(newCard(), "good", config, NOW);
		const easy = scheduleFsrs(newCard(), "easy", config, NOW);
		expect(easy.interval).toBeGreaterThan(good.interval);
	});

	it("grows stability on a successful review and shrinks it on a lapse", () => {
		const reviewed = newCard({
			status: "review",
			stability: 10,
			difficulty: 5,
			interval: 10,
			repetitions: 3,
			lastReviewedAt: new Date("2026-06-22T10:00:00.000Z").toISOString(),
		});
		const good = scheduleFsrs(reviewed, "good", config, NOW);
		expect(good.stability).toBeGreaterThan(10);
		expect(good.status).toBe("review");

		const lapse = scheduleFsrs(reviewed, "again", config, NOW);
		expect(lapse.stability).toBeLessThan(10);
		expect(lapse.status).toBe("relearning");
		expect(lapse.isDueInSession).toBe(true);
	});

	it("respects the maximum interval", () => {
		const capped = { ...config, fsrsMaximumInterval: 30 };
		const reviewed = newCard({
			status: "review",
			stability: 500,
			difficulty: 3,
			interval: 300,
			repetitions: 10,
			lastReviewedAt: new Date("2026-01-01T10:00:00.000Z").toISOString(),
		});
		const result = scheduleFsrs(reviewed, "easy", capped, NOW);
		expect(result.interval).toBeLessThanOrEqual(30);
	});

	// Regression tests for a bug where graduating out of learning/relearning
	// discarded the card's real accumulated stability and reset it to
	// initStability(currentGrade) instead — silently erasing lapse history.
	describe("graduating from learning/relearning", () => {
		it("preserves the card's actual stability instead of resetting it (relearning)", () => {
			const relearning = newCard({
				status: "relearning",
				stability: 1.2,
				difficulty: 6,
			});
			const result = scheduleFsrs(relearning, "good", config, NOW);
			expect(result.status).toBe("review");
			// Same-day graduation (no elapsed time) shouldn't credit the card
			// with growth it hasn't earned yet.
			expect(result.stability).toBeCloseTo(1.2, 3);
			expect(result.interval).toBe(1);
		});

		it("preserves the card's actual stability instead of resetting it (learning)", () => {
			const learning = newCard({
				status: "learning",
				stability: 0.4872, // initStability("again") from first exposure
				difficulty: 7.6214, // initDifficulty("again")
			});
			const result = scheduleFsrs(learning, "good", config, NOW);
			expect(result.status).toBe("review");
			expect(result.stability).toBeCloseTo(0.4872, 3);
			// The old bug would reset stability to initStability("good") = W[2].
			expect(result.stability).not.toBeCloseTo(3.7145, 1);
			expect(result.interval).toBe(1);
		});

		it("still repeats the current step for again/hard without touching stability", () => {
			const learning = newCard({
				status: "learning",
				stability: 1.2,
				difficulty: 6,
			});
			const again = scheduleFsrs(learning, "again", config, NOW);
			expect(again.status).toBe("learning");
			expect(again.isDueInSession).toBe(true);
			expect(again.stability).toBe(1.2);

			const hard = scheduleFsrs(learning, "hard", config, NOW);
			expect(hard.status).toBe("learning");
			expect(hard.isDueInSession).toBe(true);
			expect(hard.stability).toBe(1.2);
		});
	});
});

// ─── SM-2 ─────────────────────────────────────────────────────────────────────

describe("scheduleSm2", () => {
	it("resets repetitions and requeues on failure", () => {
		const card = newCard({ status: "review", repetitions: 4, interval: 20 });
		const result = scheduleSm2(card, "again", config, NOW);
		expect(result.repetitions).toBe(0);
		expect(result.status).toBe("relearning");
		expect(result.isDueInSession).toBe(true);
	});

	it("follows the classic 1 → 6 → interval*EF progression", () => {
		const first = scheduleSm2(newCard(), "good", config, NOW);
		expect(first.interval).toBe(1);
		expect(first.repetitions).toBe(1);

		const second = scheduleSm2(
			newCard({
				status: "review",
				repetitions: 1,
				interval: 1,
				easeFactor: first.easeFactor,
			}),
			"good",
			config,
			NOW
		);
		expect(second.interval).toBe(6);

		const third = scheduleSm2(
			newCard({
				status: "review",
				repetitions: 2,
				interval: 6,
				easeFactor: second.easeFactor,
			}),
			"good",
			config,
			NOW
		);
		expect(third.interval).toBe(Math.round(6 * third.easeFactor));
	});

	it("never lets ease drop below 1.3", () => {
		let ease = 1.32;
		for (let i = 0; i < 10; i += 1) {
			const result = scheduleSm2(
				newCard({
					status: "review",
					repetitions: 3,
					interval: 10,
					easeFactor: ease,
				}),
				"hard",
				config,
				NOW
			);
			ease = result.easeFactor;
		}
		expect(ease).toBeGreaterThanOrEqual(1.3);
	});

	it("applies the easy bonus and interval modifier", () => {
		const tuned = { ...config, sm2EasyBonus: 2, sm2IntervalModifier: 0.5 };
		const result = scheduleSm2(
			newCard({
				status: "review",
				repetitions: 2,
				interval: 10,
				easeFactor: 2.5,
			}),
			"easy",
			tuned,
			NOW
		);
		// interval 10 * updated ease (2.6) * bonus 2 * modifier 0.5 = 26
		expect(result.interval).toBe(26);
	});

	// Anki-fidelity regression tests.
	describe("Anki-fidelity fixes", () => {
		it("applies Anki's 20-point ease penalty when a mature review card lapses", () => {
			const card = newCard({
				status: "review",
				repetitions: 4,
				interval: 20,
				easeFactor: 2.5,
			});
			const result = scheduleSm2(card, "again", config, NOW);
			expect(result.easeFactor).toBeCloseTo(2.3, 5);
		});

		it("floors the lapse-penalized ease at 1.3", () => {
			const card = newCard({
				status: "review",
				repetitions: 4,
				interval: 20,
				easeFactor: 1.35,
			});
			const result = scheduleSm2(card, "again", config, NOW);
			expect(result.easeFactor).toBe(1.3);
		});

		it("does not penalize ease when a new/learning card fails", () => {
			const result = scheduleSm2(
				newCard({ easeFactor: 2.5 }),
				"again",
				config,
				NOW
			);
			expect(result.easeFactor).toBe(2.5);
		});

		it("keeps 'hard' in learning for a brand-new card instead of graduating it", () => {
			const result = scheduleSm2(newCard(), "hard", config, NOW);
			expect(result.status).toBe("learning");
			expect(result.isDueInSession).toBe(true);
			expect(result.interval).toBe(0);
			expect(result.repetitions).toBe(0);
		});

		it("keeps 'hard' in relearning without graduating it", () => {
			const card = newCard({
				status: "relearning",
				repetitions: 0,
				interval: 0,
			});
			const result = scheduleSm2(card, "hard", config, NOW);
			expect(result.status).toBe("relearning");
			expect(result.isDueInSession).toBe(true);
		});

		it("still applies the 1.2x hard factor for an already-mature review card", () => {
			const card = newCard({
				status: "review",
				repetitions: 4,
				interval: 10,
				easeFactor: 2.5,
			});
			const result = scheduleSm2(card, "hard", config, NOW);
			expect(result.status).toBe("review");
			expect(result.interval).toBe(Math.round(10 * 1.2));
		});

		it("does not multiply the easy bonus into the flat graduating intervals", () => {
			const tuned = { ...config, sm2EasyBonus: 2 };
			const first = scheduleSm2(newCard(), "easy", tuned, NOW);
			expect(first.interval).toBe(4); // EASY_FIRST_INTERVAL, not 4*2=8

			const second = scheduleSm2(
				newCard({
					status: "review",
					repetitions: 1,
					interval: 4,
					easeFactor: 2.5,
				}),
				"easy",
				tuned,
				NOW
			);
			expect(second.interval).toBe(6); // SECOND_INTERVAL, not 6*2=12
		});
	});
});

// ─── Leitner ──────────────────────────────────────────────────────────────────

describe("scheduleLeitner", () => {
	it("promotes through boxes: good moves one box up", () => {
		const first = scheduleLeitner(newCard(), "good", config, NOW);
		expect(first.repetitions).toBe(1);
		expect(first.interval).toBe(1);

		const second = scheduleLeitner(
			newCard({ status: "review", repetitions: 1, interval: 1 }),
			"good",
			config,
			NOW
		);
		expect(second.repetitions).toBe(2);
		expect(second.interval).toBe(2);
	});

	it("sends a failed card back to box 1 via the session queue", () => {
		const result = scheduleLeitner(
			newCard({ status: "review", repetitions: 4, interval: 8 }),
			"again",
			config,
			NOW
		);
		expect(result.repetitions).toBe(0);
		expect(result.isDueInSession).toBe(true);
	});

	it("keeps hard in the same box and lets easy skip one", () => {
		const inBoxTwo = newCard({ status: "review", repetitions: 2, interval: 2 });
		expect(scheduleLeitner(inBoxTwo, "hard", config, NOW).repetitions).toBe(2);
		expect(scheduleLeitner(inBoxTwo, "easy", config, NOW).repetitions).toBe(4);
	});

	it("caps at the last box", () => {
		const top = newCard({ status: "review", repetitions: 5, interval: 16 });
		const result = scheduleLeitner(top, "easy", config, NOW);
		expect(result.repetitions).toBe(5);
		expect(result.interval).toBe(16);
	});
});

// ─── Dispatcher & previews ────────────────────────────────────────────────────

describe("scheduleReview / previewGrades", () => {
	it("dispatches by deck algorithm", () => {
		const sm2 = scheduleReview(
			newCard(),
			"good",
			{ ...config, algorithm: "sm2" },
			NOW
		);
		expect(sm2.interval).toBe(1);
		const leitner = scheduleReview(
			newCard(),
			"easy",
			{ ...config, algorithm: "leitner" },
			NOW
		);
		expect(leitner.interval).toBe(2);
	});

	it("previews every grade", () => {
		const previews = previewGrades(newCard(), config, NOW);
		expect(previews.again.unit).toBe("minutes");
		expect(previews.good.unit).toBe("days");
	});
});

// ─── Queue ────────────────────────────────────────────────────────────────────

describe("buildSessionQueue", () => {
	const card = (status: SchedulingSnapshot["status"], due: string) => ({
		deckCardId: `${status}-${due}`,
		flashcard: { id: "f", question: "q", answers: [], fact: null, hint: null },
		scheduling: newCard({ status, nextReviewDate: due }),
	});

	it("orders learning before review before new", () => {
		const queue = buildSessionQueue([
			card("new", "2026-07-02T09:00:00.000Z"),
			card("review", "2026-07-01T09:00:00.000Z"),
			card("learning", "2026-07-02T08:00:00.000Z"),
		]);
		expect(queue.map((c) => c.scheduling.status)).toEqual([
			"learning",
			"review",
			"new",
		]);
	});

	it("counts buckets", () => {
		const counts = countByBucket([
			card("new", "a"),
			card("relearning", "b"),
			card("review", "c"),
			card("review", "d"),
		]);
		expect(counts).toEqual({ newCount: 1, learningCount: 1, reviewCount: 2 });
	});
});
