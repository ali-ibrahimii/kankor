"use client";

import { atom } from "jotai";
import type {
	DeckDetails,
	DraftFlashcard,
	FlashcardBuilderState,
} from "./types";
import { INITIAL_DECK_DETAILS } from "./types";

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: FlashcardBuilderState = {
	deck: INITIAL_DECK_DETAILS,
	flashcards: [],
	isSaving: false,
};

// ─── Root atom ────────────────────────────────────────────────────────────────

export const flashcardBuilderAtom = atom<FlashcardBuilderState>(INITIAL_STATE);

// ─── Derived atoms ────────────────────────────────────────────────────────────

export const deckAtom = atom((get) => get(flashcardBuilderAtom).deck);

export const flashcardsAtom = atom(
	(get) => get(flashcardBuilderAtom).flashcards
);

// ─── Init atom ────────────────────────────────────────────────────────────────

export const initFlashcardBuilderAtom = atom(
	null,
	(_get, set, payload: { deck: DeckDetails; flashcards: DraftFlashcard[] }) => {
		set(flashcardBuilderAtom, {
			...INITIAL_STATE,
			deck: payload.deck,
			flashcards: payload.flashcards,
		});
	}
);

// ─── Deck write atoms ─────────────────────────────────────────────────────────

export const patchDeckAtom = atom(
	null,
	(_get, set, patch: Partial<DeckDetails>) => {
		set(flashcardBuilderAtom, (prev) => ({
			...prev,
			deck: { ...prev.deck, ...patch },
		}));
	}
);

// ─── Flashcard write atoms ────────────────────────────────────────────────────

export const addFlashcardAtom = atom(
	null,
	(_get, set, flashcard: DraftFlashcard) => {
		set(flashcardBuilderAtom, (prev) => ({
			...prev,
			flashcards: [...prev.flashcards, flashcard],
		}));
	}
);

export const updateFlashcardAtom = atom(
	null,
	(
		_get,
		set,
		{ id, patch }: { id: string; patch: Partial<DraftFlashcard> }
	) => {
		set(flashcardBuilderAtom, (prev) => ({
			...prev,
			flashcards: prev.flashcards.map((f) =>
				f.id === id ? { ...f, ...patch } : f
			),
		}));
	}
);

export const removeFlashcardAtom = atom(null, (_get, set, id: string) => {
	set(flashcardBuilderAtom, (prev) => ({
		...prev,
		flashcards: prev.flashcards.filter((f) => f.id !== id),
	}));
});

export const setSavingAtom = atom(null, (_get, set, isSaving: boolean) => {
	set(flashcardBuilderAtom, (prev) => ({ ...prev, isSaving }));
});
