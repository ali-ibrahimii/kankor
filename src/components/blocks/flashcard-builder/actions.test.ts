import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditDeckFormValues, NewDeckFormValues } from "./types";

// ─── Mocks ──────────────────────────────────────────────────────────────────
// Chainable query-builder mock: every method except the terminal one returns
// `this`, and the terminal call resolves with the given { data, error }.

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of [
		"insert",
		"update",
		"delete",
		"select",
		"eq",
		"order",
	]) {
		builder[method] = vi.fn(() => builder);
	}
	builder.single = vi.fn(() => Promise.resolve(result));
	// Awaiting the builder itself (no .single()) also resolves, e.g. plain
	// `.delete().eq(...)` without a terminal `.single()`.
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: typeof result) => unknown
	) => Promise.resolve(result).then(onFulfilled);
	return builder;
}

const mockGetUser = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockRpc = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { getUser: mockGetUser },
		from: mockFrom,
		rpc: mockRpc,
	}),
}));

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
}));

// Import after the mocks so the module under test picks them up.
const { createDeck, loadDeckWithFlashcards, updateDeckDetails } = await import(
	"./actions"
);

const NEW_DECK_VALUES: NewDeckFormValues = {
	name: "  My Deck  ",
	description: "  desc  ",
	visibility: "private",
	algorithm: "fsrs",
	is_free: true,
	price_credits: "",
	fsrs_maximum_interval: "",
	fsrs_request_retention: "",
	sm2_easy_bonus: "",
	sm2_interval_modifier: "",
	sm2_starting_ease: "",
	related_courses_ids: [],
	related_libraries_ids: [],
};

beforeEach(() => {
	mockGetUser.mockReset();
	mockFrom.mockReset();
	mockRpc.mockReset();
	mockRevalidatePath.mockReset();

	// Default stub for from() to return empty related resource arrays
	mockFrom.mockReturnValue(
		makeQueryBuilder({
			data: { related_courses_ids: [], related_libraries_ids: [] },
			error: null,
		})
	);
});

// ─── createDeck ───────────────────────────────────────────────────────────────

describe("createDeck", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await createDeck(NEW_DECK_VALUES);
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("inserts the deck with trimmed values and defaults, returning id + slug", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		const builder = makeQueryBuilder({
			data: { id: "deck-1", slug: "my-deck" },
			error: null,
		});
		mockFrom.mockReturnValue(builder);

		const result = await createDeck(NEW_DECK_VALUES);

		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "My Deck",
				description: "desc",
				user_id: "user-1",
				creation: "custom",
				fsrs_maximum_interval: 36500,
				fsrs_request_retention: 0.9,
				sm2_easy_bonus: 1.3,
				sm2_interval_modifier: 1.0,
				sm2_starting_ease: 2.5,
			})
		);
		expect(result).toEqual({
			success: true,
			data: { deckId: "deck-1", slug: "my-deck" },
		});
		expect(mockRevalidatePath).toHaveBeenCalledWith("/d/decks");
		expect(mockRevalidatePath).toHaveBeenCalledWith("/d/instructor/decks");
	});

	it("falls back to the id when the trigger produced no slug", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: { id: "deck-1", slug: null }, error: null })
		);
		const result = await createDeck(NEW_DECK_VALUES);
		expect(result).toEqual({
			success: true,
			data: { deckId: "deck-1", slug: "deck-1" },
		});
	});

	it("surfaces the insert error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "insert failed" } })
		);
		const result = await createDeck(NEW_DECK_VALUES);
		expect(result).toEqual({ success: false, error: "insert failed" });
	});
});

// ─── loadDeckWithFlashcards ───────────────────────────────────────────────────

describe("loadDeckWithFlashcards", () => {
	function deckRow(overrides: Record<string, unknown> = {}) {
		return {
			id: "deck-1",
			name: "My Deck",
			description: null,
			visibility: "private",
			algorithm: "fsrs",
			fsrs_maximum_interval: 36500,
			fsrs_request_retention: 0.9,
			sm2_easy_bonus: 1.3,
			sm2_interval_modifier: 1.0,
			sm2_starting_ease: 2.5,
			is_owner: true,
			flashcards: null,
			...overrides,
		};
	}

	it("calls the RPC with p_deck_slug for a non-uuid identifier", async () => {
		const single = vi.fn().mockResolvedValue({ data: deckRow(), error: null });
		mockRpc.mockReturnValue({ single });

		await loadDeckWithFlashcards("my-deck-slug");

		expect(mockRpc).toHaveBeenCalledWith("get_deck_details", {
			p_deck_slug: "my-deck-slug",
		});
	});

	it("calls the RPC with p_deck_id for a uuid identifier (admin/school routes)", async () => {
		const single = vi.fn().mockResolvedValue({ data: deckRow(), error: null });
		mockRpc.mockReturnValue({ single });

		await loadDeckWithFlashcards("11111111-2222-3333-4444-555555555555");

		expect(mockRpc).toHaveBeenCalledWith("get_deck_details", {
			p_deck_id: "11111111-2222-3333-4444-555555555555",
		});
	});

	it("returns failure when the deck isn't found", async () => {
		const single = vi.fn().mockResolvedValue({ data: null, error: null });
		mockRpc.mockReturnValue({ single });

		const result = await loadDeckWithFlashcards("missing-slug");
		expect(result.success).toBe(false);
	});

	it("maps the owner's embedded flashcards and reports isOwner", async () => {
		const single = vi.fn().mockResolvedValue({
			data: deckRow({
				is_owner: true,
				flashcards: [
					{
						id: "card-1",
						question: "Q1",
						answers: [{ answer: "A", isCorrect: true }],
						fact: null,
						hint: null,
						img_path: null,
						vid_path: null,
						page: 0,
						created_at: "2026-01-01T00:00:00Z",
					},
				],
			}),
			error: null,
		});
		mockRpc.mockReturnValue({ single });

		const result = await loadDeckWithFlashcards("my-deck-slug");

		expect(result).toEqual({
			success: true,
			data: {
				deck: expect.objectContaining({ id: "deck-1", name: "My Deck" }),
				flashcards: [
					{
						id: "card-1",
						question: "Q1",
						answers: [{ answer: "A", isCorrect: true }],
						fact: null,
						hint: null,
						img_path: null,
						vid_path: null,
						page: 0,
					},
				],
				isOwner: true,
			},
		});
	});

	it("reports isOwner false and no flashcards for a non-owner", async () => {
		const single = vi.fn().mockResolvedValue({
			data: deckRow({ is_owner: false, flashcards: null }),
			error: null,
		});
		mockRpc.mockReturnValue({ single });

		const result = await loadDeckWithFlashcards("public-deck-slug");
		expect(result.success && result.data.isOwner).toBe(false);
		expect(result.success && result.data.flashcards).toEqual([]);
	});
});

// ─── updateDeckDetails ────────────────────────────────────────────────────────

describe("updateDeckDetails", () => {
	const EDIT_VALUES: EditDeckFormValues = {
		name: "Updated",
		description: "",
		visibility: "private",
		algorithm: "fsrs",
		is_free: true,
		price_credits: "",
		fsrs_maximum_interval: "",
		fsrs_request_retention: "",
		sm2_easy_bonus: "",
		sm2_interval_modifier: "",
		sm2_starting_ease: "",
		related_courses_ids: [],
		related_libraries_ids: [],
	};

	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await updateDeckDetails("deck-1", EDIT_VALUES);
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
	});

	it("revalidates the student and instructor slug-based edit paths", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({
				data: {
					id: "deck-1",
					slug: "my-deck",
					name: "Updated",
					description: null,
					visibility: "private",
					algorithm: "fsrs",
					fsrs_maximum_interval: 36500,
					fsrs_request_retention: 0.9,
					sm2_easy_bonus: 1.3,
					sm2_interval_modifier: 1.0,
					sm2_starting_ease: 2.5,
				},
				error: null,
			})
		);

		const result = await updateDeckDetails("deck-1", EDIT_VALUES);

		expect(result.success).toBe(true);
		expect(mockRevalidatePath).toHaveBeenCalledWith("/d/decks/my-deck/edit");
		expect(mockRevalidatePath).toHaveBeenCalledWith(
			"/d/instructor/decks/my-deck/edit"
		);
		expect(mockRevalidatePath).toHaveBeenCalledWith(
			"/d/admin/decks/my-deck/edit"
		);
	});
});
