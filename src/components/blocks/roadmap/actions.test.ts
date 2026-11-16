import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of [
		"select",
		"insert",
		"update",
		"delete",
		"eq",
		"order",
		"limit",
		"ilike",
		"not",
		"in",
	]) {
		builder[method] = vi.fn(() => builder);
	}
	builder.single = vi.fn(() => Promise.resolve(result));
	builder.maybeSingle = vi.fn(() => Promise.resolve(result));
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

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
}));

import {
	createRoadmap,
	deleteRoadmap,
	getPublishedRoadmapBySlug,
	listManagedRoadmaps,
	searchCoursesForRoadmap,
	setRoadmapItems,
	updateRoadmap,
} from "./actions";

const USER = { id: "user-1" };

describe("roadmap actions", () => {
	beforeEach(() => {
		mockGetUser.mockReset();
		mockFrom.mockReset();
		mockRevalidatePath.mockReset();
		mockGetUser.mockResolvedValue({ data: { user: USER } });
	});

	it("rejects unauthenticated callers", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await listManagedRoadmaps();
		expect(result.success).toBe(false);
	});

	it("listManagedRoadmaps sorts items by order_index", async () => {
		const roadmap = {
			id: "r1",
			title: "Path",
			roadmap_items: [
				{ id: "i2", order_index: 2, course_id: "c2", course: null },
				{ id: "i1", order_index: 1, course_id: "c1", course: null },
			],
		};
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: [roadmap], error: null })
		);

		const result = await listManagedRoadmaps();
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data[0].roadmap_items.map((item) => item.id)).toEqual([
			"i1",
			"i2",
		]);
	});

	it("createRoadmap inserts with a slug and the caller as creator", async () => {
		const builder = makeQueryBuilder({
			data: { id: "r1", title: "My Path" },
			error: null,
		});
		mockFrom.mockReturnValue(builder);

		const result = await createRoadmap({
			title: "My Path",
			description: "desc",
		});
		expect(result.success).toBe(true);
		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "My Path",
				description: "desc",
				created_by: USER.id,
				slug: expect.stringContaining("my-path"),
			})
		);
		expect(mockRevalidatePath).toHaveBeenCalled();
	});

	it("createRoadmap transliterates non-latin titles into a timestamp slug", async () => {
		const builder = makeQueryBuilder({ data: { id: "r1" }, error: null });
		mockFrom.mockReturnValue(builder);

		await createRoadmap({ title: "نقشه راه" });
		const insertArg = builder.insert.mock.calls[0]?.[0] as {
			slug: string;
		};
		expect(insertArg.slug).toMatch(/^roadmap-/);
	});

	it("updateRoadmap applies the patch and revalidates", async () => {
		const builder = makeQueryBuilder({
			data: { id: "r1", is_published: true },
			error: null,
		});
		mockFrom.mockReturnValue(builder);

		const result = await updateRoadmap("r1", { is_published: true });
		expect(result.success).toBe(true);
		expect(builder.update).toHaveBeenCalledWith({ is_published: true });
		expect(builder.eq).toHaveBeenCalledWith("id", "r1");
		expect(mockRevalidatePath).toHaveBeenCalled();
	});

	it("deleteRoadmap removes the row", async () => {
		const builder = makeQueryBuilder({ data: null, error: null });
		mockFrom.mockReturnValue(builder);

		const result = await deleteRoadmap("r1");
		expect(result.success).toBe(true);
		expect(builder.delete).toHaveBeenCalled();
	});

	it("setRoadmapItems replaces the list with ordered rows", async () => {
		const builder = makeQueryBuilder({ data: [], error: null });
		mockFrom.mockReturnValue(builder);

		const result = await setRoadmapItems("r1", ["c2", "c1", "c2"]);
		expect(result.success).toBe(true);
		expect(builder.delete).toHaveBeenCalled();
		expect(builder.insert).toHaveBeenCalledWith([
			{ roadmap_id: "r1", course_id: "c2", order_index: 0 },
			{ roadmap_id: "r1", course_id: "c1", order_index: 1 },
		]);
	});

	it("setRoadmapItems with an empty list only deletes", async () => {
		const builder = makeQueryBuilder({ data: [], error: null });
		mockFrom.mockReturnValue(builder);

		const result = await setRoadmapItems("r1", []);
		expect(result.success).toBe(true);
		expect(builder.delete).toHaveBeenCalled();
		expect(builder.insert).not.toHaveBeenCalled();
	});

	it("getPublishedRoadmapBySlug filters by slug and publication", async () => {
		const builder = makeQueryBuilder({
			data: {
				id: "r1",
				slug: "my-path",
				roadmap_items: [
					{ id: "i2", order_index: 2, course_id: "c2", course: null },
					{ id: "i1", order_index: 1, course_id: "c1", course: null },
				],
			},
			error: null,
		});
		mockFrom.mockReturnValue(builder);

		const result = await getPublishedRoadmapBySlug("my-path");
		expect(result.success).toBe(true);
		if (!result.success || !result.data) throw new Error("expected data");
		expect(result.data.roadmap_items[0].id).toBe("i1");
		expect(builder.eq).toHaveBeenCalledWith("slug", "my-path");
		expect(builder.eq).toHaveBeenCalledWith("is_published", true);
	});

	it("searchCoursesForRoadmap narrows with ilike on non-empty search", async () => {
		const builder = makeQueryBuilder({ data: [{ id: "c1" }], error: null });
		mockFrom.mockReturnValue(builder);

		const result = await searchCoursesForRoadmap("calc");
		expect(result.success).toBe(true);
		expect(builder.ilike).toHaveBeenCalledWith("title", "%calc%");
	});

	it("searchCoursesForRoadmap skips ilike on empty search", async () => {
		const builder = makeQueryBuilder({ data: [], error: null });
		mockFrom.mockReturnValue(builder);

		await searchCoursesForRoadmap("   ");
		expect(builder.ilike).not.toHaveBeenCalled();
	});

	it("surfaces database errors as { success: false }", async () => {
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "boom" } })
		);
		const result = await listManagedRoadmaps();
		expect(result).toEqual({ success: false, error: "boom" });
	});
});
