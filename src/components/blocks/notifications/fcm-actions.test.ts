import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["upsert", "delete", "eq"]) {
		builder[method] = vi.fn(() => builder);
	}
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: typeof result) => unknown
	) => Promise.resolve(result).then(onFulfilled);
	return builder;
}

const mockGetUser = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { getUser: mockGetUser },
		from: mockFrom,
	}),
}));

const { registerFcmToken, unregisterFcmToken } = await import("./fcm-actions");

beforeEach(() => {
	mockGetUser.mockReset();
	mockFrom.mockReset();
});

// ─── registerFcmToken ───────────────────────────────────────────────────────

describe("registerFcmToken", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await registerFcmToken("token-1");
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("upserts the token for the current user, keyed on the token itself", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		const builder = makeQueryBuilder({ data: null, error: null });
		mockFrom.mockReturnValue(builder);

		const result = await registerFcmToken("token-1", "Mozilla/5.0");

		expect(mockFrom).toHaveBeenCalledWith("fcm_tokens");
		expect(builder.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				user_id: "user-1",
				token: "token-1",
				user_agent: "Mozilla/5.0",
			}),
			{ onConflict: "token" }
		);
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("surfaces the upsert error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "upsert failed" } })
		);

		const result = await registerFcmToken("token-1");
		expect(result).toEqual({ success: false, error: "upsert failed" });
	});
});

// ─── unregisterFcmToken ─────────────────────────────────────────────────────

describe("unregisterFcmToken", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await unregisterFcmToken("token-1");
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("deletes the token scoped to the current user", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		const builder = makeQueryBuilder({ data: null, error: null });
		mockFrom.mockReturnValue(builder);

		const result = await unregisterFcmToken("token-1");

		expect(builder.eq).toHaveBeenCalledWith("token", "token-1");
		expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("surfaces the delete error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "delete failed" } })
		);

		const result = await unregisterFcmToken("token-1");
		expect(result).toEqual({ success: false, error: "delete failed" });
	});
});
