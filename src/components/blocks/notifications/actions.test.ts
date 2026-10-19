import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────
// Chainable query-builder mock: every method except the terminal one returns
// `this`, and the terminal call resolves with the given { data, error }.

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["update", "select", "eq"]) {
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

// Import after the mocks so the module under test picks them up.
const { markNotificationRead, markAllNotificationsRead } = await import(
	"./actions"
);

beforeEach(() => {
	mockGetUser.mockReset();
	mockFrom.mockReset();
});

// ─── markNotificationRead ───────────────────────────────────────────────────

describe("markNotificationRead", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await markNotificationRead("notif-1");
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("marks the given notification as read for the current user", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		const builder = makeQueryBuilder({ data: null, error: null });
		mockFrom.mockReturnValue(builder);

		const result = await markNotificationRead("notif-1");

		expect(mockFrom).toHaveBeenCalledWith("notifications");
		expect(builder.update).toHaveBeenCalledWith(
			expect.objectContaining({ is_read: true })
		);
		expect(builder.eq).toHaveBeenCalledWith("id", "notif-1");
		expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("surfaces the update error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "update failed" } })
		);

		const result = await markNotificationRead("notif-1");
		expect(result).toEqual({ success: false, error: "update failed" });
	});
});

// ─── markAllNotificationsRead ───────────────────────────────────────────────

describe("markAllNotificationsRead", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await markAllNotificationsRead();
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("marks every unread notification as read for the current user", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		const builder = makeQueryBuilder({ data: null, error: null });
		mockFrom.mockReturnValue(builder);

		const result = await markAllNotificationsRead();

		expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
		expect(builder.eq).toHaveBeenCalledWith("is_read", false);
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("surfaces the update error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "update failed" } })
		);

		const result = await markAllNotificationsRead();
		expect(result).toEqual({ success: false, error: "update failed" });
	});
});
