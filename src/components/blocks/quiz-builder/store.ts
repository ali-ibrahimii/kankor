"use client";

import { atom } from "jotai";
import type { DraftOption, DraftQuestion } from "./types";
import { createEmptyOption } from "./types";

// ── State shape ────────────────────────────────────────────────────────────

export interface QuizBuilderState {
	// Quiz domain data
	id: string | undefined;
	entrance_code: string | undefined;
	lesson_id: string | undefined;
	school_id: string | undefined;
	questions: DraftQuestion[];
	// UI / async state
	expandedIds: Set<string>;
	activeTab: string;
	isSaving: boolean;
	isDeleting: boolean;
	validationErrors: string[];
}

const INITIAL_STATE: QuizBuilderState = {
	id: undefined,
	entrance_code: undefined,
	lesson_id: undefined,
	school_id: undefined,
	questions: [],
	expandedIds: new Set(),
	activeTab: "questions",
	isSaving: false,
	isDeleting: false,
	validationErrors: [],
};

// ── Single source of truth ─────────────────────────────────────────────────

export const quizAtom = atom<QuizBuilderState>(INITIAL_STATE);

// ── Derived atoms (granular subscriptions) ─────────────────────────────────

// Reference-stable when unrelated fields change — Jotai only notifies
// subscribers when Object.is(prev, next) returns false for the slice.

export const activeQuestionsAtom = atom((get) =>
	get(quizAtom).questions.filter((q) => !q._deleted)
);

export const totalPointsAtom = atom((get) =>
	get(activeQuestionsAtom).reduce((sum, q) => sum + (q.points ?? 0), 0)
);

// Exposed as a derived atom so SortableQuestionCard re-renders only
// when the Set reference actually changes (i.e. expand/collapse events),
// not on every keystroke in a question title.
export const expandedIdsAtom = atom((get) => get(quizAtom).expandedIds);

// Convenience slice used by quiz-settings.tsx
export const entranceCodeAtom = atom((get) => get(quizAtom).entrance_code);

// ── Initializer ────────────────────────────────────────────────────────────

export const initQuizAtom = atom(
	null,
	(
		_get,
		set,
		payload: Pick<
			QuizBuilderState,
			"id" | "entrance_code" | "lesson_id" | "school_id" | "questions"
		>
	) => {
		set(quizAtom, {
			...INITIAL_STATE,
			...payload,
		});
	}
);

// ── Question write atoms ───────────────────────────────────────────────────

export const addQuestionAtom = atom(
	null,
	(get, set, question: DraftQuestion) => {
		const { questions, expandedIds } = get(quizAtom);
		set(quizAtom, (prev) => ({
			...prev,
			questions: [...questions, question],
			expandedIds: new Set([...expandedIds, question.id]),
			activeTab: "questions",
		}));
	}
);

export const deleteQuestionAtom = atom(null, (get, set, id: string) => {
	const { questions, expandedIds } = get(quizAtom);
	const next = new Set(expandedIds);
	next.delete(id);
	set(quizAtom, (prev) => ({
		...prev,
		questions: questions.map((q) =>
			q.id === id ? { ...q, _deleted: true } : q
		),
		expandedIds: next,
	}));
});

export const patchQuestionAtom = atom(
	null,
	(get, set, { id, patch }: { id: string; patch: Partial<DraftQuestion> }) => {
		set(quizAtom, (prev) => ({
			...prev,
			questions: prev.questions.map((q) =>
				q.id === id ? { ...q, ...patch } : q
			),
		}));
	}
);

export const reorderQuestionsAtom = atom(
	null,
	(_get, set, reordered: DraftQuestion[]) => {
		set(quizAtom, (prev) => ({
			...prev,
			questions: [...reordered, ...prev.questions.filter((q) => q._deleted)],
		}));
	}
);

export const toggleExpandAtom = atom(null, (get, set, id: string) => {
	const next = new Set(get(quizAtom).expandedIds);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	set(quizAtom, (prev) => ({ ...prev, expandedIds: next }));
});

// ── Option write atoms ─────────────────────────────────────────────────────

export const patchOptionAtom = atom(
	null,
	(
		get,
		set,
		{
			questionId,
			optionId,
			patch,
		}: { questionId: string; optionId: string; patch: Partial<DraftOption> }
	) => {
		const { questions } = get(quizAtom);
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		const isSingleCorrect = [
			"multiple_choice_single_correct",
			"true_false",
			"yes_no",
		].includes(question.question_type);

		let updatedOptions = question.options.map((o) =>
			o.id === optionId ? { ...o, ...patch } : o
		);
		if (isSingleCorrect && patch.is_correct === true) {
			updatedOptions = updatedOptions.map((o) => ({
				...o,
				is_correct: o.id === optionId,
			}));
		}

		set(quizAtom, (prev) => ({
			...prev,
			questions: questions.map((q) =>
				q.id === questionId ? { ...q, options: updatedOptions } : q
			),
		}));
	}
);

export const addOptionAtom = atom(null, (get, set, questionId: string) => {
	const { questions } = get(quizAtom);
	const question = questions.find((q) => q.id === questionId);
	if (!question) return;

	const activeOpts = question.options.filter((o) => !o._deleted);
	const newOpt = createEmptyOption(questionId, activeOpts.length);

	if (question.question_type === "matching") {
		newOpt.is_correct = true;
		newOpt.match_target_text = "";
	} else if (question.question_type === "fill_in_the_blanks") {
		newOpt.is_correct = true;
	}

	set(quizAtom, (prev) => ({
		...prev,
		questions: questions.map((q) =>
			q.id === questionId ? { ...q, options: [...q.options, newOpt] } : q
		),
	}));
});

export const deleteOptionAtom = atom(
	null,
	(
		get,
		set,
		{ questionId, optionId }: { questionId: string; optionId: string }
	) => {
		set(quizAtom, (prev) => ({
			...prev,
			questions: prev.questions.map((q) =>
				q.id === questionId
					? {
							...q,
							options: q.options.map((o) =>
								o.id === optionId ? { ...o, _deleted: true } : o
							),
						}
					: q
			),
		}));
	}
);

export const reorderOptionsAtom = atom(
	null,
	(
		_get,
		set,
		{ questionId, reordered }: { questionId: string; reordered: DraftOption[] }
	) => {
		set(quizAtom, (prev) => {
			const question = prev.questions.find((q) => q.id === questionId);
			if (!question) return prev;
			const deleted = question.options.filter((o) => o._deleted);
			return {
				...prev,
				questions: prev.questions.map((q) =>
					q.id === questionId
						? { ...q, options: [...reordered, ...deleted] }
						: q
				),
			};
		});
	}
);
