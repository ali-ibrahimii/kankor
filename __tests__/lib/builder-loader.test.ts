import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const byColumn = vi.hoisted(
	() => new Map<string, { data: unknown; error: unknown }>()
);

const mockFrom = vi.hoisted(() => vi.fn());
const mockLoadCourseContent = vi.hoisted(() => vi.fn());
const mockConsoleError = vi.hoisted(() =>
	vi.spyOn(console, "error").mockImplementation(() => {})
);

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(async () => ({
		from: mockFrom,
	})),
}));

vi.mock("@/components/blocks/course-builder/actions", () => ({
	loadCourseContent: mockLoadCourseContent,
}));

mockFrom.mockImplementation(() => ({
	select: () => ({
		eq: (column: string) => ({
			maybeSingle: async () =>
				byColumn.get(column) ?? { data: null, error: null },
		}),
	}),
}));

const { findCourseForBuilder, loadBuilderContent } = await import(
	"@/lib/courses/builder-loader"
);

const COURSE = {
	id: "course-1",
	title: "آموزش Next.js",
	is_published: false,
	instructor_id: "author-1",
};

beforeEach(() => {
	byColumn.clear();
	mockConsoleError.mockClear();
	mockLoadCourseContent.mockReset();
});

describe("findCourseForBuilder", () => {
	it("loads a course by slug", async () => {
		byColumn.set("slug", { data: COURSE, error: null });
		await expect(findCourseForBuilder("nextjs")).resolves.toEqual(COURSE);
	});

	it("loads a course by id when the parameter is a uuid", async () => {
		byColumn.set("id", { data: COURSE, error: null });
		await expect(
			findCourseForBuilder("00000000-0000-0000-0000-000000000001")
		).resolves.toEqual(COURSE);
	});

	it("falls back to the id when a stale slug no longer matches", async () => {
		// What used to send the admin to a 404 after renaming/recreating a course.
		byColumn.set("id", { data: COURSE, error: null });
		await expect(findCourseForBuilder("old-slug")).resolves.toEqual(COURSE);
	});

	it("returns null for a course that really does not exist", async () => {
		await expect(findCourseForBuilder("missing")).resolves.toBeNull();
	});

	it("logs a lookup error instead of failing silently", async () => {
		byColumn.set("slug", {
			data: null,
			error: { message: "permission denied for table courses" },
		});
		byColumn.set("id", {
			data: null,
			error: { message: "permission denied for table courses" },
		});

		await expect(findCourseForBuilder("nextjs")).resolves.toBeNull();
		expect(mockConsoleError).toHaveBeenCalledWith(
			expect.stringContaining("nextjs"),
			"permission denied for table courses"
		);
	});
});

describe("loadBuilderContent", () => {
	it("passes content through when it loads", async () => {
		mockLoadCourseContent.mockResolvedValue({
			success: true,
			data: { modules: [], lessons: [], blocks: [] },
		});

		await expect(loadBuilderContent("course-1")).resolves.toEqual({
			modules: [],
			lessons: [],
			blocks: [],
			error: null,
		});
	});

	it("keeps the course reachable when its content fails to load", async () => {
		mockLoadCourseContent.mockResolvedValue({
			success: false,
			error: "boom",
		});

		// The page must still render the builder instead of a 404.
		await expect(loadBuilderContent("course-1")).resolves.toEqual({
			modules: [],
			lessons: [],
			blocks: [],
			error: "boom",
		});
		expect(mockConsoleError).toHaveBeenCalled();
	});
});
