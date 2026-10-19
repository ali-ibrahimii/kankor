import type { Database } from "@/lib/supabase/database.types";

export type FlashcardAlgorithm =
	Database["public"]["Enums"]["flashcard_algorithm"];
export type Visibility = Database["public"]["Enums"]["visibility"];

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface FlashcardAnswer {
	answer: string;
	isCorrect: boolean;
}

export interface DraftFlashcard {
	id: string; // flashcards.id
	question: string;
	answers: FlashcardAnswer[];
	fact: string | null;
	hint: string | null;
	img_path: string | null;
	vid_path: string | null;
	page: number;
}

export interface DeckDetails {
	id: string;
	name: string;
	description: string | null;
	visibility: Visibility;
	algorithm: FlashcardAlgorithm;
	is_free: boolean;
	price_credits: number;
	fsrs_maximum_interval: number;
	fsrs_request_retention: number;
	sm2_easy_bonus: number;
	sm2_interval_modifier: number;
	sm2_starting_ease: number;
	book_id?: string | null;
	subject_id?: string | null;
	grade_id?: string | null;
}

// ─── Builder UI state ─────────────────────────────────────────────────────────

export interface FlashcardBuilderState {
	deck: DeckDetails;
	flashcards: DraftFlashcard[];
	isSaving: boolean;
}

// ─── Form value types ─────────────────────────────────────────────────────────

export interface NewDeckFormValues {
	name: string;
	description: string;
	visibility: string;
	algorithm: string;
	is_free: boolean;
	price_credits: string;
	// Advanced settings (stored as strings, parsed to number in action)
	fsrs_maximum_interval: string;
	fsrs_request_retention: string;
	sm2_easy_bonus: string;
	sm2_interval_modifier: string;
	sm2_starting_ease: string;
	related_courses_ids: string[];
	related_libraries_ids: string[];
	book_id?: string | null;
	subject_id?: string | null;
	grade_id?: string | null;
}

export interface EditDeckFormValues {
	name: string;
	description: string;
	visibility: string;
	algorithm: string;
	is_free: boolean;
	price_credits: string;
	fsrs_maximum_interval: string;
	fsrs_request_retention: string;
	sm2_easy_bonus: string;
	sm2_interval_modifier: string;
	sm2_starting_ease: string;
	related_courses_ids: string[];
	related_libraries_ids: string[];
	book_id?: string | null;
	subject_id?: string | null;
	grade_id?: string | null;
}

export interface FlashcardFormValues {
	question: string;
	fact: string;
	hint: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const INITIAL_DECK_DETAILS: DeckDetails = {
	id: "",
	name: "",
	description: null,
	visibility: "private",
	algorithm: "fsrs",
	is_free: true,
	price_credits: 0,
	fsrs_maximum_interval: 36500,
	fsrs_request_retention: 0.9,
	sm2_easy_bonus: 1.3,
	sm2_interval_modifier: 1.0,
	sm2_starting_ease: 2.5,
};
