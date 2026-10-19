import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		rpc: mockRpc,
	}),
}));

const { respondToInviteNotification } = await import("./respond-actions");

beforeEach(() => {
	mockRpc.mockReset();
});

describe("respondToInviteNotification", () => {
	it("routes classroom_invite through respond_to_classroom_request", async () => {
		mockRpc.mockResolvedValue({ data: {}, error: null });

		const result = await respondToInviteNotification(
			"classroom_invite",
			"req-1",
			true
		);

		expect(mockRpc).toHaveBeenCalledWith("respond_to_classroom_request", {
			p_request_id: "req-1",
			p_approve: true,
		});
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("routes classroom_join_request through the same RPC", async () => {
		mockRpc.mockResolvedValue({ data: {}, error: null });

		await respondToInviteNotification("classroom_join_request", "req-2", false);

		expect(mockRpc).toHaveBeenCalledWith("respond_to_classroom_request", {
			p_request_id: "req-2",
			p_approve: false,
		});
	});

	it("routes school_invite through respond_to_school_invite", async () => {
		mockRpc.mockResolvedValue({ data: {}, error: null });

		const result = await respondToInviteNotification(
			"school_invite",
			"invite-1",
			true
		);

		expect(mockRpc).toHaveBeenCalledWith("respond_to_school_invite", {
			p_invite_id: "invite-1",
			p_accept: true,
		});
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("rejects notification types that don't support a response", async () => {
		const result = await respondToInviteNotification(
			"course_completion",
			"whatever",
			true
		);
		expect(result).toEqual({
			success: false,
			error: "This notification doesn't support a response.",
		});
		expect(mockRpc).not.toHaveBeenCalled();
	});

	it("surfaces the RPC error", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "This request has already been responded to." },
		});

		const result = await respondToInviteNotification(
			"classroom_invite",
			"req-1",
			true
		);
		expect(result).toEqual({
			success: false,
			error: "This request has already been responded to.",
		});
	});
});
