"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decodeSlugParam, isUuid } from "@/lib/utils";
import type {
	DeckDetails,
	DraftFlashcard,
	EditDeckFormValues,
	FlashcardAlgorithm,
	FlashcardAnswer,
	NewDeckFormValues,
	Visibility,
} from "./types";

// ─── Result type ──────────────────────────────────────────────────────────────

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

// ─── Create deck ──────────────────────────────────────────────────────────────

export async function createDeck(
	values: NewDeckFormValues,
	/** When set, the deck is owned by (and attributed to) this agency — RLS
	 * requires the caller to hold `decks.manage_own` for it. */
	agencyId?: string
): Promise<Result<{ deckId: string; slug: string }>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("decks")
		.insert({
			agency_id: agencyId ?? null,
			name: values.name.trim(),
			description: values.description.trim() || null,
			visibility: (values.visibility as Visibility) ?? "private",
			algorithm: (values.algorithm as FlashcardAlgorithm) ?? "fsrs",
			is_free: values.is_free ?? true,
			price_credits: values.is_free
				? 0
				: values.price_credits
					? Number(values.price_credits)
					: 0,
			creation: "custom",
			user_id: user.id,
			fsrs_maximum_interval: values.fsrs_maximum_interval
				? Number(values.fsrs_maximum_interval)
				: 36500,
			fsrs_request_retention: values.fsrs_request_retention
				? Number(values.fsrs_request_retention)
				: 0.9,
			sm2_easy_bonus: values.sm2_easy_bonus
				? Number(values.sm2_easy_bonus)
				: 1.3,
			sm2_interval_modifier: values.sm2_interval_modifier
				? Number(values.sm2_interval_modifier)
				: 1.0,
			sm2_starting_ease: values.sm2_starting_ease
				? Number(values.sm2_starting_ease)
				: 2.5,
			related_courses_ids: values.related_courses_ids || [],
			related_libraries_ids: values.related_libraries_ids || [],
			book_id: values.book_id || null,
			subject_id: values.subject_id || null,
			grade_id: values.grade_id || null,
		})
		.select("id, slug")
		.single();

	if (error) return { success: false, error: error.message };

	revalidatePath("/d/instructor/decks");
	revalidatePath("/d/admin/decks");
	revalidatePath("/d/decks");

	return {
		success: true,
		data: { deckId: data.id, slug: data.slug ?? data.id },
	};
}

// ─── Load deck with flashcards ─────────────────────────────────────────────────
// Single RPC call (get_deck_details) replaces what used to be a separate
// ownership query + a deck query + a flashcards query. Accepts either a deck
// slug (student/instructor routes) or a raw deck id (admin/school routes,
// which weren't migrated to slug-based URLs).

export async function loadDeckWithFlashcards(identifier: string): Promise<
	Result<{
		deck: DeckDetails;
		flashcards: DraftFlashcard[];
		isOwner: boolean;
	}>
> {
	const slug = decodeSlugParam(identifier);
	const supabase = await createClient();

	const { data: deckRow, error: deckError } = await supabase
		.rpc(
			"get_deck_details",
			isUuid(slug) ? { p_deck_id: slug } : { p_deck_slug: slug }
		)
		.single();

	if (deckError || !deckRow)
		return { success: false, error: deckError?.message ?? "Deck not found" };

	const { data: deckMeta } = await supabase
		.from("decks")
		.select(
			"related_courses_ids, related_libraries_ids, book_id, subject_id, grade_id"
		)
		.eq("id", deckRow.id)
		.single();

	const deck: DeckDetails & {
		related_courses_ids?: string[];
		related_libraries_ids?: string[];
	} = {
		id: deckRow.id,
		name: deckRow.name,
		description: deckRow.description ?? null,
		visibility: deckRow.visibility,
		algorithm: deckRow.algorithm,
		is_free: deckRow.is_free,
		price_credits: deckRow.price_credits,
		fsrs_maximum_interval: deckRow.fsrs_maximum_interval,
		fsrs_request_retention: deckRow.fsrs_request_retention,
		sm2_easy_bonus: deckRow.sm2_easy_bonus,
		sm2_interval_modifier: deckRow.sm2_interval_modifier,
		sm2_starting_ease: deckRow.sm2_starting_ease,
		related_courses_ids: deckMeta?.related_courses_ids || [],
		related_libraries_ids: deckMeta?.related_libraries_ids || [],
		book_id: deckMeta?.book_id,
		subject_id: deckMeta?.subject_id,
		grade_id: deckMeta?.grade_id,
	};

	const flashcards: DraftFlashcard[] = (
		(deckRow.flashcards ?? []) as unknown as Array<{
			id: string;
			question: string;
			answers: FlashcardAnswer[];
			fact: string | null;
			hint: string | null;
			img_path: string | null;
			vid_path: string | null;
			page: number;
		}>
	).map((f) => ({
		id: f.id,
		question: f.question,
		answers: f.answers ?? [],
		fact: f.fact ?? null,
		hint: f.hint ?? null,
		img_path: f.img_path ?? null,
		vid_path: f.vid_path ?? null,
		page: f.page ?? 0,
	}));

	return {
		success: true,
		data: { deck, flashcards, isOwner: deckRow.is_owner },
	};
}

// ─── Update deck details ──────────────────────────────────────────────────────

export async function updateDeckDetails(
	deckId: string,
	values: EditDeckFormValues
): Promise<Result<DeckDetails>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("decks")
		.update({
			name: values.name.trim(),
			description: values.description.trim() || null,
			visibility: (values.visibility as Visibility) ?? "private",
			algorithm: (values.algorithm as FlashcardAlgorithm) ?? "fsrs",
			is_free: values.is_free,
			price_credits: values.is_free
				? 0
				: values.price_credits
					? Number(values.price_credits)
					: 0,
			fsrs_maximum_interval: values.fsrs_maximum_interval
				? Number(values.fsrs_maximum_interval)
				: undefined,
			fsrs_request_retention: values.fsrs_request_retention
				? Number(values.fsrs_request_retention)
				: undefined,
			sm2_easy_bonus: values.sm2_easy_bonus
				? Number(values.sm2_easy_bonus)
				: undefined,
			sm2_interval_modifier: values.sm2_interval_modifier
				? Number(values.sm2_interval_modifier)
				: undefined,
			sm2_starting_ease: values.sm2_starting_ease
				? Number(values.sm2_starting_ease)
				: undefined,
			related_courses_ids: values.related_courses_ids || [],
			related_libraries_ids: values.related_libraries_ids || [],
			book_id: values.book_id || null,
			subject_id: values.subject_id || null,
			grade_id: values.grade_id || null,
		})
		.eq("id", deckId)
		.select("*")
		.single();

	if (error) return { success: false, error: error.message };

	const slugOrId = data.slug ?? deckId;
	revalidatePath(`/d/decks/${slugOrId}/edit`);
	revalidatePath(`/d/instructor/decks/${slugOrId}/edit`);
	revalidatePath(`/d/admin/decks/${slugOrId}/edit`);

	const updated: DeckDetails & {
		related_courses_ids?: string[];
		related_libraries_ids?: string[];
	} = {
		id: data.id,
		name: data.name,
		description: data.description ?? null,
		visibility: data.visibility,
		algorithm: data.algorithm,
		is_free: data.is_free,
		price_credits: data.price_credits,
		fsrs_maximum_interval: data.fsrs_maximum_interval,
		fsrs_request_retention: data.fsrs_request_retention,
		sm2_easy_bonus: data.sm2_easy_bonus,
		sm2_interval_modifier: data.sm2_interval_modifier,
		sm2_starting_ease: data.sm2_starting_ease,
		related_courses_ids: data.related_courses_ids || [],
		related_libraries_ids: data.related_libraries_ids || [],
	};

	return { success: true, data: updated };
}

// ─── Add flashcard to deck ────────────────────────────────────────────────────

export async function addFlashcardToDeck(
	deckId: string,
	values: {
		question: string;
		answers: FlashcardAnswer[];
		fact: string | null;
		hint: string | null;
	}
): Promise<Result<DraftFlashcard>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data: flashcard, error: flashcardError } = await supabase
		.from("flashcards")
		.insert({
			question: values.question.trim(),
			answers:
				values.answers as unknown as import("@/lib/supabase/database.types").Json[],
			fact: values.fact?.trim() || null,
			hint: values.hint?.trim() || null,
			creation: "custom",
			user_id: user.id,
			deck_id: deckId,
			page: 0,
		})
		.select("id")
		.single();

	if (flashcardError) return { success: false, error: flashcardError.message };

	return {
		success: true,
		data: {
			id: flashcard.id,
			question: values.question.trim(),
			answers: values.answers,
			fact: values.fact?.trim() ?? null,
			hint: values.hint?.trim() ?? null,
			img_path: null,
			vid_path: null,
			page: 0,
		},
	};
}

// ─── Update flashcard ─────────────────────────────────────────────────────────

export async function updateFlashcard(
	flashcardId: string,
	values: {
		question: string;
		answers: FlashcardAnswer[];
		fact: string | null;
		hint: string | null;
	}
): Promise<Result<Partial<DraftFlashcard>>> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("flashcards")
		.update({
			question: values.question.trim(),
			answers:
				values.answers as unknown as import("@/lib/supabase/database.types").Json[],
			fact: values.fact?.trim() || null,
			hint: values.hint?.trim() || null,
		})
		.eq("id", flashcardId);

	if (error) return { success: false, error: error.message };

	return {
		success: true,
		data: {
			question: values.question.trim(),
			answers: values.answers,
			fact: values.fact?.trim() ?? null,
			hint: values.hint?.trim() ?? null,
		},
	};
}

// ─── Delete flashcard from deck ───────────────────────────────────────────────

export async function deleteFlashcardFromDeck(
	flashcardId: string
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("flashcards")
		.delete()
		.eq("id", flashcardId);

	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}
