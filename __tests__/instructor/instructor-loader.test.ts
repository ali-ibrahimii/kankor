import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const byColumn = vi.hoisted(
	() => new Map<string, { data: unknown; error: unknown }>()
);
const mockFrom = vi.hoisted(() => vi.fn());
const mockGetCurrentUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/auth/session", () => ({
	getCurrentUser: mockGetCurrentUser,
}));

mockFrom.mockImplementation(() => ({
	select: () => ({
		eq: (column: string) => ({
			maybeSingle: async () =>
				byColumn.get(column) ?? { data: null, error: null },
		}),
	}),
}));

const { findInstructorCourse } = await import(
	"@/app/[locale]/d/instructor/_lib/instructor-data"
);

const COURSE = {
	id: "11111111-1111-1111-1111-111111111111",
	slug: "nextjs",
	title: "آموزش Next.js",
	is_published: false,
	instructor_id: "author-1",
};

beforeEach(() => {
	byColumn.clear();
	mockGetCurrentUser.mockReset();
	mockFrom.mockClear();
});

describe("findInstructorCourse", () => {
	it("loads a course by slug", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "author-1",
			role: "instructor",
		});
		byColumn.set("slug", { data: COURSE, error: null });
		await expect(findInstructorCourse("nextjs")).resolves.toEqual(COURSE);
	});

	it("loads a course by id when the identifier is a uuid", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "author-1",
			role: "instructor",
		});
		byColumn.set("id", { data: COURSE, error: null });
		await expect(findInstructorCourse(COURSE.id)).resolves.toEqual(COURSE);
	});

	it("hides a foreign course from a non-admin instructor", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "someone-else",
			role: "instructor",
		});
		byColumn.set("slug", { data: COURSE, error: null });
		await expect(findInstructorCourse("nextjs")).resolves.toBeNull();
	});

	it("lets a super-admin open any course", async () => {
		mockGetCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
		byColumn.set("slug", { data: COURSE, error: null });
		await expect(findInstructorCourse("nextjs")).resolves.toEqual(COURSE);
	});

	it("returns null without a signed-in user", async () => {
		mockGetCurrentUser.mockResolvedValue(null);
		byColumn.set("slug", { data: COURSE, error: null });
		await expect(findInstructorCourse("nextjs")).resolves.toBeNull();
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("returns null on a query error", async () => {
		mockGetCurrentUser.mockResolvedValue({
			id: "author-1",
			role: "instructor",
		});
		byColumn.set("slug", {
			data: null,
			error: { message: "boom", code: "XX000" },
		});
		await expect(findInstructorCourse("nextjs")).resolves.toBeNull();
	});
});
