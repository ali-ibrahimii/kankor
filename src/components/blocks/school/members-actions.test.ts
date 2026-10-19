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

const { inviteSchoolMember, listSchoolMembers, listPendingSchoolInvites } =
	await import("./members-actions");

beforeEach(() => {
	mockFrom.mockReset();
	mockRpc.mockReset();
	mockRevalidatePath.mockReset();
});

// ─── inviteSchoolMember ─────────────────────────────────────────────────────

describe("inviteSchoolMember", () => {
	it("calls the invite RPC with trimmed email and revalidates", async () => {
		mockRpc.mockResolvedValue({ data: {}, error: null });

		const result = await inviteSchoolMember(
			"school-1",
			"  member@mail.com  ",
			"manager"
		);

		expect(mockRpc).toHaveBeenCalledWith("invite_school_member", {
			p_school_id: "school-1",
			p_email: "member@mail.com",
			p_role: "manager",
		});
		expect(mockRevalidatePath).toHaveBeenCalledWith(
			"/d/school/school-1/members"
		);
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("surfaces the RPC error", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "No account found with that email." },
		});

		const result = await inviteSchoolMember(
			"school-1",
			"nope@mail.com",
			"staff"
		);
		expect(result).toEqual({
			success: false,
			error: "No account found with that email.",
		});
	});
});

// ─── listSchoolMembers ──────────────────────────────────────────────────────

describe("listSchoolMembers", () => {
	it("merges members with their profiles", async () => {
		const membersBuilder = makeQueryBuilder({
			data: [{ id: "m1", user_id: "user-1", role: "owner", created_at: "t" }],
			error: null,
		});
		const profilesBuilder = makeQueryBuilder({
			data: [
				{
					id: "user-1",
					full_name: "Owner Person",
					avatar_url: null,
					email: "owner@mail.com",
				},
			],
			error: null,
		});
		mockFrom.mockImplementation((table: string) =>
			table === "profiles" ? profilesBuilder : membersBuilder
		);

		const result = await listSchoolMembers("school-1");

		expect(result.success).toBe(true);
		expect(result.success && result.data[0].profile?.email).toBe(
			"owner@mail.com"
		);
	});

	it("surfaces the query error", async () => {
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "load failed" } })
		);

		const result = await listSchoolMembers("school-1");
		expect(result).toEqual({ success: false, error: "load failed" });
	});
});

// ─── listPendingSchoolInvites ───────────────────────────────────────────────

describe("listPendingSchoolInvites", () => {
	it("merges pending invites with invitee profiles", async () => {
		const invitesBuilder = makeQueryBuilder({
			data: [
				{
					id: "inv-1",
					user_id: "user-2",
					role: "staff",
					status: "pending",
					created_at: "t",
				},
			],
			error: null,
		});
		const profilesBuilder = makeQueryBuilder({
			data: [
				{
					id: "user-2",
					full_name: "Invited Person",
					avatar_url: null,
					email: "invited@mail.com",
				},
			],
			error: null,
		});
		mockFrom.mockImplementation((table: string) =>
			table === "profiles" ? profilesBuilder : invitesBuilder
		);

		const result = await listPendingSchoolInvites("school-1");

		expect(result.success).toBe(true);
		expect(result.success && result.data[0].profile?.full_name).toBe(
			"Invited Person"
		);
	});

	it("skips the profile fetch when there are no pending invites", async () => {
		mockFrom.mockReturnValue(makeQueryBuilder({ data: [], error: null }));

		const result = await listPendingSchoolInvites("school-1");
		expect(result).toEqual({ success: true, data: [] });
		expect(mockFrom).toHaveBeenCalledTimes(1);
	});
});
