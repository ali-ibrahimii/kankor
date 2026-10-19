import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["insert", "update", "eq"]) {
		builder[method] = vi.fn(() => builder);
	}
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: typeof result) => unknown
	) => Promise.resolve(result).then(onFulfilled);
	return builder;
}

const mockGetUser = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockServerEnv = vi.hoisted(() => ({
	telegram: {
		botToken: "test-token",
		botUsername: "abzarkankor_bot",
		webhookSecret: undefined as string | undefined,
	},
	cron: { secret: undefined as string | undefined },
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { getUser: mockGetUser },
		from: mockFrom,
	}),
}));

vi.mock("@/lib/env/server-env", () => ({
	get serverEnv() {
		return mockServerEnv;
	},
}));

const { createTelegramLinkToken, disconnectTelegram } = await import(
	"./telegram-actions"
);

beforeEach(() => {
	mockGetUser.mockReset();
	mockFrom.mockReset();
	mockServerEnv.telegram.botUsername = "abzarkankor_bot";
});

// ─── createTelegramLinkToken ────────────────────────────────────────────────

describe("createTelegramLinkToken", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await createTelegramLinkToken();
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("fails when telegram is not configured", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockServerEnv.telegram.botUsername = undefined as unknown as string;

		const result = await createTelegramLinkToken();
		expect(result).toEqual({
			success: false,
			error: "Telegram is not configured",
		});
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("inserts a link token and returns a deep link to the bot", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		const builder = makeQueryBuilder({ data: null, error: null });
		mockFrom.mockReturnValue(builder);

		const result = await createTelegramLinkToken();

		expect(mockFrom).toHaveBeenCalledWith("telegram_link_tokens");
		expect(builder.insert).toHaveBeenCalledWith(
			expect.objectContaining({ user_id: "user-1" })
		);
		expect(result.success).toBe(true);
		expect(result.success && result.data.deepLink).toMatch(
			/^https:\/\/t\.me\/abzarkankor_bot\?start=/
		);
	});

	it("surfaces the insert error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "insert failed" } })
		);

		const result = await createTelegramLinkToken();
		expect(result).toEqual({ success: false, error: "insert failed" });
	});
});

// ─── disconnectTelegram ─────────────────────────────────────────────────────

describe("disconnectTelegram", () => {
	it("fails when unauthenticated", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null } });
		const result = await disconnectTelegram();
		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("clears the chat id and linked_at for the current user", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		const builder = makeQueryBuilder({ data: null, error: null });
		mockFrom.mockReturnValue(builder);

		const result = await disconnectTelegram();

		expect(mockFrom).toHaveBeenCalledWith("profiles");
		expect(builder.update).toHaveBeenCalledWith({
			telegram_chat_id: null,
			telegram_linked_at: null,
		});
		expect(builder.eq).toHaveBeenCalledWith("id", "user-1");
		expect(result).toEqual({ success: true, data: undefined });
	});

	it("surfaces the update error", async () => {
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFrom.mockReturnValue(
			makeQueryBuilder({ data: null, error: { message: "update failed" } })
		);

		const result = await disconnectTelegram();
		expect(result).toEqual({ success: false, error: "update failed" });
	});
});
