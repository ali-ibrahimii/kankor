"use client";

import { atom } from "jotai";
import { countByBucket } from "./lib/queue";
import type {
	DeckSchedulingConfig,
	ReviewGrade,
	SchedulingResult,
	SessionCard,
	SessionCounts,
	StudySession,
} from "./types";

// ─── State ────────────────────────────────────────────────────────────────────

/**
 * One card occurrence in the session queue. A card that lapses ("again") is
 * re-queued as a NEW entry, so `queueId` — not `deckCardId` — identifies an
 * entry (the same card can appear multiple times).
 */
export interface QueueEntry {
	queueId: string;
	card: SessionCard;
	grade: ReviewGrade | null;
}

export interface SessionStats {
	again: number;
	hard: number;
	good: number;
	easy: number;
}

export interface StudySessionState {
	deckId: string | null;
	config: DeckSchedulingConfig | null;
	entries: QueueEntry[];
	currentIndex: number;
	isFlipped: boolean;
	isSubmitting: boolean;
	stats: SessionStats;
}

const INITIAL_STATS: SessionStats = { again: 0, hard: 0, good: 0, easy: 0 };

const INITIAL_STATE: StudySessionState = {
	deckId: null,
	config: null,
	entries: [],
	currentIndex: 0,
	isFlipped: false,
	isSubmitting: false,
	stats: INITIAL_STATS,
};

export const studySessionAtom = atom<StudySessionState>(INITIAL_STATE);

// ─── Derived atoms ────────────────────────────────────────────────────────────

function firstUngradedIndex(entries: QueueEntry[]): number {
	return entries.findIndex((entry) => entry.grade === null);
}

export const currentEntryAtom = atom<QueueEntry | null>((get) => {
	const { entries, currentIndex } = get(studySessionAtom);
	return entries[currentIndex] ?? null;
});

/** How far forward the student may navigate (the first ungraded card). */
export const maxReachableIndexAtom = atom((get) => {
	const { entries } = get(studySessionAtom);
	if (entries.length === 0) return 0;
	const ungraded = firstUngradedIndex(entries);
	return ungraded === -1 ? entries.length - 1 : ungraded;
});

export const isSessionCompleteAtom = atom((get) => {
	const { entries } = get(studySessionAtom);
	return entries.length > 0 && firstUngradedIndex(entries) === -1;
});

export const sessionProgressAtom = atom((get) => {
	const { entries } = get(studySessionAtom);
	const done = entries.filter((entry) => entry.grade !== null).length;
	return { done, total: entries.length };
});

/** Remaining (ungraded) cards bucketed for the stats chips. */
export const remainingCountsAtom = atom<SessionCounts>((get) => {
	const { entries } = get(studySessionAtom);
	return countByBucket(
		entries.filter((entry) => entry.grade === null).map((entry) => entry.card)
	);
});

// ─── Write atoms ──────────────────────────────────────────────────────────────

export const initStudySessionAtom = atom(
	null,
	(_get, set, session: StudySession | null) => {
		if (!session) {
			set(studySessionAtom, INITIAL_STATE);
			return;
		}
		set(studySessionAtom, {
			...INITIAL_STATE,
			deckId: session.deckId,
			config: session.config,
			entries: session.cards.map((card) => ({
				queueId: `${card.deckCardId}:0`,
				card,
				grade: null,
			})),
		});
	}
);

export const toggleFlipAtom = atom(null, (_get, set) => {
	set(studySessionAtom, (prev) => ({ ...prev, isFlipped: !prev.isFlipped }));
});

export const setSubmittingAtom = atom(null, (_get, set, value: boolean) => {
	set(studySessionAtom, (prev) => ({ ...prev, isSubmitting: value }));
});

/** Navigate to an already-reachable card (prev/next buttons, arrow keys). */
export const goToEntryAtom = atom(null, (get, set, index: number) => {
	const max = get(maxReachableIndexAtom);
	const clamped = Math.min(Math.max(index, 0), max);
	set(studySessionAtom, (prev) => ({
		...prev,
		currentIndex: clamped,
		// Reviewed cards open on their back so the recorded answer is visible.
		isFlipped: prev.entries[clamped]?.grade !== null,
	}));
});

/** Apply a confirmed (server-persisted) review to the session. */
export const applyGradeAtom = atom(
	null,
	(
		_get,
		set,
		payload: { queueId: string; grade: ReviewGrade; result: SchedulingResult }
	) => {
		set(studySessionAtom, (prev) => {
			const index = prev.entries.findIndex(
				(entry) => entry.queueId === payload.queueId
			);
			if (index === -1 || prev.entries[index].grade !== null) return prev;

			const graded = prev.entries[index];
			const updatedScheduling = {
				...graded.card.scheduling,
				status: payload.result.status,
				easeFactor: payload.result.easeFactor,
				interval: payload.result.interval,
				repetitions: payload.result.repetitions,
				stability: payload.result.stability,
				difficulty: payload.result.difficulty,
				elapsedDays: payload.result.elapsedDays,
				scheduledDays: payload.result.scheduledDays,
				nextReviewDate: payload.result.nextReviewDate,
			};

			const entries = prev.entries.map((entry, i) =>
				i === index
					? {
							...entry,
							grade: payload.grade,
							card: { ...entry.card, scheduling: updatedScheduling },
						}
					: entry
			);

			// Lapsed cards come back later in the same session.
			if (payload.result.isDueInSession) {
				const occurrence = Number(graded.queueId.split(":")[1] ?? 0) + 1;
				entries.push({
					queueId: `${graded.card.deckCardId}:${occurrence}`,
					card: { ...graded.card, scheduling: updatedScheduling },
					grade: null,
				});
			}

			const nextUngraded = firstUngradedIndex(entries);
			return {
				...prev,
				entries,
				currentIndex: nextUngraded === -1 ? index : nextUngraded,
				isFlipped: false,
				stats: {
					...prev.stats,
					[payload.grade]: prev.stats[payload.grade] + 1,
				},
			};
		});
	}
);
