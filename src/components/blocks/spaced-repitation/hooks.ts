"use client";

import { useMemoizedFn } from "ahooks";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { reviewCard } from "./actions";
import { previewGrades } from "./lib/scheduler";
import {
	applyGradeAtom,
	currentEntryAtom,
	goToEntryAtom,
	initStudySessionAtom,
	isSessionCompleteAtom,
	maxReachableIndexAtom,
	remainingCountsAtom,
	sessionProgressAtom,
	setSubmittingAtom,
	studySessionAtom,
	toggleFlipAtom,
} from "./store";
import type { GradePreviews, ReviewGrade, StudySession } from "./types";

// ─── useStudySession ──────────────────────────────────────────────────────────

/**
 * Binds a server-fetched session to the Jotai store and exposes everything
 * the study UI needs: current card, flip/grade/navigation handlers, progress.
 */
export function useStudySession(session: StudySession | null) {
	const t = useTranslations("spacedRepetition");
	const state = useAtomValue(studySessionAtom);
	const current = useAtomValue(currentEntryAtom);
	const maxReachable = useAtomValue(maxReachableIndexAtom);
	const isComplete = useAtomValue(isSessionCompleteAtom);
	const progress = useAtomValue(sessionProgressAtom);
	const remaining = useAtomValue(remainingCountsAtom);

	const initSession = useSetAtom(initStudySessionAtom);
	const toggleFlip = useSetAtom(toggleFlipAtom);
	const setSubmitting = useSetAtom(setSubmittingAtom);
	const goTo = useSetAtom(goToEntryAtom);
	const applyGrade = useSetAtom(applyGradeAtom);

	// Re-seed the store whenever the server sends a different session
	// (deck switch, page refresh after enrolling, next day's queue).
	React.useEffect(() => {
		initSession(session);
	}, [session, initSession]);

	const grade = useMemoizedFn(async (value: ReviewGrade) => {
		if (!current || current.grade !== null || state.isSubmitting) return;
		setSubmitting(true);
		try {
			const result = await reviewCard(current.card.deckCardId, value);
			if (!result.success) {
				toast.error(t("grades.saveFailed"));
				return;
			}
			applyGrade({
				queueId: current.queueId,
				grade: value,
				result: result.data,
			});
		} catch {
			toast.error(t("grades.saveFailed"));
		} finally {
			setSubmitting(false);
		}
	});

	const flip = useMemoizedFn(() => {
		if (current) toggleFlip();
	});

	const goPrev = useMemoizedFn(() => goTo(state.currentIndex - 1));
	const goNext = useMemoizedFn(() => goTo(state.currentIndex + 1));

	// What each grade button would schedule — computed with the same pure
	// algorithms the server uses, so the labels match reality.
	const previews: GradePreviews | null = React.useMemo(() => {
		if (!current || !state.config || current.grade !== null) return null;
		return previewGrades(current.card.scheduling, state.config);
	}, [current, state.config]);

	return {
		deckId: state.deckId,
		current,
		isFlipped: state.isFlipped,
		isSubmitting: state.isSubmitting,
		isComplete,
		hasCards: state.entries.length > 0,
		stats: state.stats,
		progress,
		remaining,
		previews,
		canGoPrev: state.currentIndex > 0,
		canGoNext: state.currentIndex < maxReachable,
		flip,
		grade,
		goPrev,
		goNext,
	};
}

export type StudySessionHandle = ReturnType<typeof useStudySession>;

// ─── useKeyboardShortcuts ─────────────────────────────────────────────────────

interface KeyboardShortcutOptions {
	enabled: boolean;
	isFlipped: boolean;
	onFlip: () => void;
	onGrade: (grade: ReviewGrade) => void;
	onPrev: () => void;
	onNext: () => void;
}

const GRADE_KEYS: Record<string, ReviewGrade> = {
	"1": "again",
	"2": "hard",
	"3": "good",
	"4": "easy",
};

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return (
		target.isContentEditable ||
		target.tagName === "INPUT" ||
		target.tagName === "TEXTAREA" ||
		target.tagName === "SELECT"
	);
}

/** Real buttons (accordion trigger, grade/nav buttons) keep native Space/Enter. */
function isNativeButtonTarget(target: EventTarget | null): boolean {
	return target instanceof HTMLElement && target.closest("button") !== null;
}

/** Space/Enter flip · 1–4 grade · arrow keys navigate. */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions) {
	const handler = useMemoizedFn((event: KeyboardEvent) => {
		if (!options.enabled || isTypingTarget(event.target)) return;

		if (event.key === " " || event.key === "Enter") {
			if (isNativeButtonTarget(event.target)) return;
			event.preventDefault();
			options.onFlip();
			return;
		}
		if (options.isFlipped && GRADE_KEYS[event.key]) {
			event.preventDefault();
			options.onGrade(GRADE_KEYS[event.key]);
			return;
		}
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			options.onPrev();
			return;
		}
		if (event.key === "ArrowRight") {
			event.preventDefault();
			options.onNext();
		}
	});

	React.useEffect(() => {
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handler]);
}
