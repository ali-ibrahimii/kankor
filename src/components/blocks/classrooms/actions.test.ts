import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "eq", "order", "in"]) {
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

vi.mock("@/lib/routes", () => ({
	routes: {
		decks: { slug: { page: ({ slug }: { slug: string }) => `/decks/${slug}` } },
		courses: {
			slug: { page: ({ slug }: { slug: string }) => `/courses/${slug}` },
		},
	},
}));

const {
	requestJoinClassroom,
	listMyClassrooms,
	listMyPendingClassroomRequests,
	respondToMyClassroomRequest,
	getMyClassroomDetail,
} = await import("./actions");

beforeEach(() => {
	mockGetUser.mockReset();
	mockFrom.mockReset();
	mockRpc.mockReset();
	mockRevalidatePath.mockReset();
});

// ─── requestJoinClassroom ───────────────────────────────────────────────────

describe("requestJoinClassroom", () => {
	it("calls the join RPC with the trimmed code and revalidates", async () => {
		mockRpc.mockResolvedValue({
			data: { id: "req-1", classroom_id: "class-1" },
			error: null,
		});

		const result = await requestJoinClassroom("  ABC123  ");

		expect(mockRpc).toHaveBeenCalledWith("request_join_classroom", {
			p_join_code: "ABC123",
		});
		expect(mockRevalidatePath).toHaveBeenCalledWith("/d/classrooms");
		expect(result.success).toBe(true);
	});

	it("surfaces the RPC error", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "Invalid join code." },
		});

		const result = await requestJoinClassroom("BOGUS");
		expect(result).toEqual({ success: false, error: "Invalid join code." });
	});
});

// ─── listMyClassrooms ───────────────────────────────────────────────────────

describe("listMyClassrooms", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await listMyClassrooms();
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("maps memberships with their joined classroom details", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({
				data: [
					{
						id: "member-1",
						classroom_id: "class-1",
						role: "student",
						created_at: "2026-01-01T00:00:00Z",
						classroom: {
							name: "Algebra",
							description: "Grade 10 math",
							cover_image: null,
						},
					},
				],
				error: null,
			})
		);

		const result = await listMyClassrooms();

		expect(result).toEqual({
			success: true,
			data: [
				{
					membership_id: "member-1",
					classroom_id: "class-1",
					role: "student",
					joined_at: "2026-01-01T00:00:00Z",
					name: "Algebra",
					description: "Grade 10 math",
					cover_image: null,
				},
			],
		});
	});

	it("surfaces the query error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "load failed" } })
		);

		const result = await listMyClassrooms();
		expect(result).toEqual({ success: false, error: "load failed" });
	});
});

// ─── listMyPendingClassroomRequests ─────────────────────────────────────────

describe("listMyPendingClassroomRequests", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await listMyPendingClassroomRequests();
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("maps pending requests with their classroom name", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({
				data: [
					{
						id: "req-1",
						classroom_id: "class-1",
						initiated_by: "instructor",
						created_at: "2026-01-01T00:00:00Z",
						classroom_name: "Algebra",
					},
				],
				error: null,
			})
		);

		const result = await listMyPendingClassroomRequests();

		expect(result).toEqual({
			success: true,
			data: [
				{
					id: "req-1",
					classroom_id: "class-1",
					classroom_name: "Algebra",
					initiated_by: "instructor",
					created_at: "2026-01-01T00:00:00Z",
				},
			],
		});
	});

	it("surfaces the query error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "load failed" } })
		);

		const result = await listMyPendingClassroomRequests();
		expect(result).toEqual({ success: false, error: "load failed" });
	});
});

// ─── respondToMyClassroomRequest ────────────────────────────────────────────

describe("respondToMyClassroomRequest", () => {
	it("calls the respond RPC and revalidates the classrooms page", async () => {
		mockRpc.mockResolvedValue({ data: {}, error: null });

		const result = await respondToMyClassroomRequest("req-1", true);

		expect(mockRpc).toHaveBeenCalledWith("respond_to_classroom_request", {
			p_request_id: "req-1",
			p_approve: true,
		});
		expect(mockRevalidatePath).toHaveBeenCalledWith("/d/classrooms");
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("surfaces the RPC error", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "Not authorized to respond to this invite." },
		});

		const result = await respondToMyClassroomRequest("req-1", false);
		expect(result).toEqual({
			success: false,
			error: "Not authorized to respond to this invite.",
		});
	});
});

// ─── getMyClassroomDetail ───────────────────────────────────────────────────

describe("getMyClassroomDetail", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await getMyClassroomDetail("class-1");
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("fails when the caller isn't a member", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(makeQueryBuilder({ data: null, error: null }));

		const result = await getMyClassroomDetail("class-1");
		expect(result).toEqual({
			success: false,
			error: "You are not a member of this classroom.",
		});
	});

	it("returns classroom detail with resolved resource titles/hrefs", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

		const membershipBuilder = makeQueryBuilder({
			data: { role: "student" },
			error: null,
		});
		const classroomBuilder = makeQueryBuilder({
			data: {
				id: "class-1",
				name: "Algebra",
				description: "desc",
				cover_image: null,
			},
			error: null,
		});
		const resourcesBuilder = makeQueryBuilder({
			data: [
				{ id: "res-1", resource_type: "deck", resource_id: "deck-1" },
				{ id: "res-2", resource_type: "course", resource_id: "course-1" },
			],
			error: null,
		});
		const materialsBuilder = makeQueryBuilder({
			data: [
				{
					id: "mat-1",
					title: "Lesson 1",
					description: null,
					type: "lesson",
					created_at: "2026-01-01T00:00:00Z",
				},
			],
			error: null,
		});
		const announcementsBuilder = makeQueryBuilder({
			data: [
				{
					id: "ann-1",
					message: "Welcome!",
					created_at: "2026-01-01T00:00:00Z",
					author: { full_name: "Instructor One", avatar_url: null },
				},
			],
			error: null,
		});
		const decksBuilder = makeQueryBuilder({
			data: [{ id: "deck-1", name: "Deck One", slug: "deck-one" }],
			error: null,
		});
		const coursesBuilder = makeQueryBuilder({
			data: [{ id: "course-1", title: "Course One", slug: "course-one" }],
			error: null,
		});

		mockFrom.mockImplementation((table: string) => {
			switch (table) {
				case "classroom_members":
					return membershipBuilder;
				case "classrooms":
					return classroomBuilder;
				case "classroom_resources":
					return resourcesBuilder;
				case "classroom_materials":
					return materialsBuilder;
				case "classroom_announcements":
					return announcementsBuilder;
				case "decks":
					return decksBuilder;
				case "courses":
					return coursesBuilder;
				default:
					throw new Error(`Unexpected table: ${table}`);
			}
		});

		const result = await getMyClassroomDetail("class-1");

		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.data.role).toBe("student");
		expect(result.data.resources).toEqual([
			{
				id: "res-1",
				resource_type: "deck",
				resource_id: "deck-1",
				title: "Deck One",
				href: "/decks/deck-one",
			},
			{
				id: "res-2",
				resource_type: "course",
				resource_id: "course-1",
				title: "Course One",
				href: "/courses/course-one",
			},
		]);
		expect(result.data.materials).toEqual([
			{
				id: "mat-1",
				title: "Lesson 1",
				description: null,
				type: "lesson",
				created_at: "2026-01-01T00:00:00Z",
			},
		]);
		expect(result.data.announcements).toEqual([
			{
				id: "ann-1",
				message: "Welcome!",
				created_at: "2026-01-01T00:00:00Z",
				author: { full_name: "Instructor One", avatar_url: null },
			},
		]);
	});

	it("surfaces the classroom fetch error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		const membershipBuilder = makeQueryBuilder({
			data: { role: "student" },
			error: null,
		});
		const classroomBuilder = makeQueryBuilder({
			data: null,
			error: { message: "Classroom not found." },
		});
		const emptyBuilder = makeQueryBuilder({ data: [], error: null });

		mockFrom.mockImplementation((table: string) => {
			if (table === "classroom_members") return membershipBuilder;
			if (table === "classrooms") return classroomBuilder;
			return emptyBuilder;
		});

		const result = await getMyClassroomDetail("class-1");
		expect(result).toEqual({
			success: false,
			error: "Classroom not found.",
		});
	});
});
