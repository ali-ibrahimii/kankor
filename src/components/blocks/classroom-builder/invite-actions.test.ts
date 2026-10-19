import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "eq", "in", "order"]) {
		builder[method] = vi.fn(() => builder);
	}
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: typeof result) => unknown
	) => Promise.resolve(result).then(onFulfilled);
	return builder;
}

const mockFrom = vi.hoisted(() => vi.fn());
const mockRpc = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		from: mockFrom,
		rpc: mockRpc,
	}),
}));

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
}));

const {
	inviteStudentToClassroom,
	listClassroomRequests,
	respondToClassroomRequest,
	cancelClassroomRequest,
} = await import("./invite-actions");

beforeEach(() => {
	mockFrom.mockReset();
	mockRpc.mockReset();
	mockRevalidatePath.mockReset();
});

// ─── inviteStudentToClassroom ───────────────────────────────────────────────

describe("inviteStudentToClassroom", () => {
	it("calls the invite RPC with trimmed email and revalidates", async () => {
		mockRpc.mockResolvedValue({
			data: { id: "req-1", classroom_id: "class-1" },
			error: null,
		});

		const result = await inviteStudentToClassroom(
			"class-1",
			"  student@mail.com  "
		);

		expect(mockRpc).toHaveBeenCalledWith("create_classroom_invite", {
			p_classroom_id: "class-1",
			p_student_email: "student@mail.com",
		});
		expect(mockRevalidatePath).toHaveBeenCalledWith(
			"/d/instructor/classrooms/class-1/edit"
		);
		expect(result).toEqual({
			success: true,
			data: { id: "req-1", classroom_id: "class-1" },
		});
	});

	it("surfaces the RPC error", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "No account found with that email." },
		});

		const result = await inviteStudentToClassroom("class-1", "nope@mail.com");
		expect(result).toEqual({
			success: false,
			error: "No account found with that email.",
		});
	});
});

// ─── listClassroomRequests ──────────────────────────────────────────────────

describe("listClassroomRequests", () => {
	it("merges pending requests with requester profiles", async () => {
		const requestsBuilder = makeQueryBuilder({
			data: [{ id: "req-1", user_id: "student-1", status: "pending" }],
			error: null,
		});
		const profilesBuilder = makeQueryBuilder({
			data: [
				{
					id: "student-1",
					full_name: "Student One",
					avatar_url: null,
					email: "student1@mail.com",
				},
			],
			error: null,
		});
		mockFrom.mockImplementation((table: string) =>
			table === "profiles" ? profilesBuilder : requestsBuilder
		);

		const result = await listClassroomRequests("class-1");

		expect(result.success).toBe(true);
		expect(result.success && result.data[0].profile).toEqual({
			id: "student-1",
			full_name: "Student One",
			avatar_url: null,
			email: "student1@mail.com",
		});
	});

	it("skips the profile fetch when there are no pending requests", async () => {
		mockFrom.mockReturnValue(makeQueryBuilder({ data: [], error: null }));

		const result = await listClassroomRequests("class-1");

		expect(result).toEqual({ success: true, data: [] });
		expect(mockFrom).toHaveBeenCalledTimes(1);
	});

	it("surfaces the query error", async () => {
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "load failed" } })
		);

		const result = await listClassroomRequests("class-1");
		expect(result).toEqual({ success: false, error: "load failed" });
	});
});

// ─── respondToClassroomRequest ──────────────────────────────────────────────

describe("respondToClassroomRequest", () => {
	it("calls the respond RPC and revalidates using the returned classroom id", async () => {
		mockRpc.mockResolvedValue({
			data: { id: "req-1", classroom_id: "class-1", status: "approved" },
			error: null,
		});

		const result = await respondToClassroomRequest("req-1", true);

		expect(mockRpc).toHaveBeenCalledWith("respond_to_classroom_request", {
			p_request_id: "req-1",
			p_approve: true,
		});
		expect(mockRevalidatePath).toHaveBeenCalledWith(
			"/d/instructor/classrooms/class-1/edit"
		);
		expect(result.success).toBe(true);
	});

	it("surfaces the RPC error", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "This request has already been responded to." },
		});

		const result = await respondToClassroomRequest("req-1", false);
		expect(result).toEqual({
			success: false,
			error: "This request has already been responded to.",
		});
	});
});

// ─── cancelClassroomRequest ─────────────────────────────────────────────────

describe("cancelClassroomRequest", () => {
	it("calls the cancel RPC and revalidates using the returned classroom id", async () => {
		mockRpc.mockResolvedValue({
			data: { id: "req-1", classroom_id: "class-1", status: "canceled" },
			error: null,
		});

		const result = await cancelClassroomRequest("req-1");

		expect(mockRpc).toHaveBeenCalledWith("cancel_classroom_request", {
			p_request_id: "req-1",
		});
		expect(mockRevalidatePath).toHaveBeenCalledWith(
			"/d/instructor/classrooms/class-1/edit"
		);
		expect(result.success).toBe(true);
	});

	it("surfaces the RPC error", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "Only invites you sent can be canceled." },
		});

		const result = await cancelClassroomRequest("req-1");
		expect(result).toEqual({
			success: false,
			error: "Only invites you sent can be canceled.",
		});
	});
});
