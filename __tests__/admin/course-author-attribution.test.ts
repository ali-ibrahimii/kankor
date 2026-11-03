import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NewCourseFormValues } from "@/components/blocks/course-builder/types";

// ─── Mocks ────────────────────────────────────────────────────────────────────

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
const mockGetPlatformAuthorId = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { getUser: mockGetUser },
		from: mockFrom,
	}),
}));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/platform-author", () => ({
	getPlatformAuthorId: mockGetPlatformAuthorId,
}));

const { createCourse } = await import(
	"@/components/blocks/course-builder/actions"
);

const VALUES: NewCourseFormValues = {
	title: "آموزش Next.js",
	subtitle: "",
	description: "",
	language: "fa",
	level: "all_levels",
	is_free: true,
	price_credits: "",
	visibility: "private",
	related_decks_ids: [],
	related_quizzes_ids: [],
	related_libraries_ids: [],
	learning_objectives: "",
	prerequisites: "",
	estimated_duration_hours: "",
	promo_video_url: "",
	welcome_message: "",
	seo_title: "",
	seo_description: "",
};

beforeEach(() => {
	vi.clearAllMocks();
	mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
	mockFrom.mockReturnValue(
		makeQueryBuilder({ data: { id: "course-1" }, error: null })
	);
});

describe("createCourse — admin authorship", () => {
	it("attributes an admin-created course to the platform profile", async () => {
		mockGetPlatformAuthorId.mockResolvedValue("platform-profile");
		const builder = makeQueryBuilder({ data: { id: "course-1" }, error: null });
		mockFrom.mockReturnValue(builder);

		await createCourse(VALUES, undefined, { platformAuthored: true });

		expect(mockGetPlatformAuthorId).toHaveBeenCalled();
		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({ instructor_id: "platform-profile" })
		);
	});

	it("keeps the creator as author when no platform profile exists", async () => {
		mockGetPlatformAuthorId.mockResolvedValue(null);
		const builder = makeQueryBuilder({ data: { id: "course-1" }, error: null });
		mockFrom.mockReturnValue(builder);

		await createCourse(VALUES, undefined, { platformAuthored: true });

		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({ instructor_id: "admin-1" })
		);
	});

	it("never looks up the platform author for instructor-owned courses", async () => {
		const builder = makeQueryBuilder({ data: { id: "course-1" }, error: null });
		mockFrom.mockReturnValue(builder);

		await createCourse(VALUES);

		expect(mockGetPlatformAuthorId).not.toHaveBeenCalled();
		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({ instructor_id: "admin-1" })
		);
	});
});
