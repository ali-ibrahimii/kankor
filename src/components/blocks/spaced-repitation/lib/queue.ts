import type { SessionCard, SessionCounts } from "../types";

/**
 * Order a study queue the way Anki does: cards stuck in (re)learning first
 * (they are time-critical), then due reviews oldest-first, then new cards.
 */
export function buildSessionQueue(cards: SessionCard[]): SessionCard[] {
	const bucketOrder = {
		learning: 0,
		relearning: 0,
		review: 1,
		new: 2,
	} as const;
	return [...cards].sort((a, b) => {
		const bucketDiff =
			bucketOrder[a.scheduling.status] - bucketOrder[b.scheduling.status];
		if (bucketDiff !== 0) return bucketDiff;
		return a.scheduling.nextReviewDate.localeCompare(
			b.scheduling.nextReviewDate
		);
	});
}

export function countByBucket(cards: SessionCard[]): SessionCounts {
	const counts: SessionCounts = {
		newCount: 0,
		learningCount: 0,
		reviewCount: 0,
	};
	for (const card of cards) {
		switch (card.scheduling.status) {
			case "new":
				counts.newCount += 1;
				break;
			case "learning":
			case "relearning":
				counts.learningCount += 1;
				break;
			case "review":
				counts.reviewCount += 1;
				break;
		}
	}
	return counts;
}
