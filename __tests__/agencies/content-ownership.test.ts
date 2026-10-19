import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NewCourseFormValues } from "@/components/blocks/course-builder/types";
import type { NewDeckFormValues } from "@/components/blocks/flashcard-builder/types";

// Chainable query-builder mock (same pattern as flashcard-builder tests).
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
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: typeof result) => unknown
	) => Promise.resolve(result).then(onFulfilled);
	return builder;
}

const mockGetUser = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { getUser: mockGetUser },
		from: mockFrom,
	}),
}));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const { createCourse } = await import(
	"@/components/blocks/course-builder/actions"
);
const { createDeck } = await import(
	"@/components/blocks/flashcard-builder/actions"
);

const AGENCY_ID = "00000000-0000-0000-0000-000000000001";

const COURSE_VALUES: NewCourseFormValues = {
	title: "Agency Course",
	subtitle: "",
	description: "",
	language: "fa",
	level: "all_levels",
	is_free: false,
	price_credits: "200",
	visibility: "public",
	related_decks_ids: [],
	related_quizzes_ids: [],
	related_libraries_ids: [],
};

const DECK_VALUES: NewDeckFormValues = {
	name: "Agency Deck",
	description: "",
	visibility: "public",
	algorithm: "fsrs",
	is_free: true,
	price_credits: "",
	fsrs_maximum_interval: "36500",
	fsrs_request_retention: "0.9",
	sm2_easy_bonus: "1.3",
	sm2_interval_modifier: "1.0",
	sm2_starting_ease: "2.5",
	related_courses_ids: [],
	related_libraries_ids: [],
};

beforeEach(() => {
	mockGetUser.mockReset();
	mockFrom.mockReset();
	mockGetUser.mockResolvedValue({ data: { user: { id: "member-1" } } });
});

describe("createCourse (agency ownership)", () => {
	it("stamps agency_id when creating for an agency", async () => {
		const builder = makeQueryBuilder({ data: { id: "c-1" }, error: null });
		mockFrom.mockReturnValue(builder);

		await createCourse(COURSE_VALUES, AGENCY_ID);

		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				agency_id: AGENCY_ID,
				instructor_id: "member-1",
			})
		);
	});

	it("leaves agency_id null for regular creation", async () => {
		const builder = makeQueryBuilder({ data: { id: "c-1" }, error: null });
		mockFrom.mockReturnValue(builder);

		await createCourse(COURSE_VALUES);

		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({ agency_id: null })
		);
	});
});

describe("createDeck (agency ownership)", () => {
	it("stamps agency_id when creating for an agency", async () => {
		const builder = makeQueryBuilder({
			data: { id: "d-1", slug: "agency-deck" },
			error: null,
		});
		mockFrom.mockReturnValue(builder);

		await createDeck(DECK_VALUES, AGENCY_ID);

		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({ agency_id: AGENCY_ID, user_id: "member-1" })
		);
	});
});
