import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "update", "eq"]) {
		builder[method] = vi.fn(() => builder);
	}
	builder.maybeSingle = vi.fn(() => Promise.resolve(result));
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: typeof result) => unknown
	) => Promise.resolve(result).then(onFulfilled);
	return builder;
}

const mockFrom = vi.hoisted(() => vi.fn());
const mockServerEnv = vi.hoisted(() => ({
	telegram: {
		botToken: "test-token" as string | undefined,
		botUsername: "abzarkankor_bot",
		webhookSecret: undefined as string | undefined,
	},
	cron: { secret: undefined as string | undefined },
}));

vi.mock("@/lib/supabase/server", () => ({
	createServiceRoleClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/env/server-env", () => ({
	get serverEnv() {
		return mockServerEnv;
	},
}));

const { POST } = await import("./route");

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/telegram/webhook", {
		method: "POST",
		headers: { "content-type": "application/json", ...headers },
		body: JSON.stringify(body),
	}) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
	mockFrom.mockReset();
	mockServerEnv.telegram.botToken = "test-token";
	mockServerEnv.telegram.webhookSecret = undefined;
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("Telegram webhook", () => {
	it("returns 503 when telegram is not configured", async () => {
		mockServerEnv.telegram.botToken = undefined;
		const response = await POST(makeRequest({}));
		expect(response.status).toBe(503);
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("returns 401 when the webhook secret header doesn't match", async () => {
		mockServerEnv.telegram.webhookSecret = "shh";
		const response = await POST(
			makeRequest(
				{ message: { text: "/start abc", chat: { id: 1 } } },
				{ "x-telegram-bot-api-secret-token": "wrong" }
			)
		);
		expect(response.status).toBe(401);
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("no-ops on non-/start messages", async () => {
		const response = await POST(
			makeRequest({ message: { text: "hello", chat: { id: 1 } } })
		);
		expect(response.status).toBe(200);
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("sends a hint when /start has no token", async () => {
		const response = await POST(
			makeRequest({ message: { text: "/start", chat: { id: 42 } } })
		);
		expect(response.status).toBe(200);
		expect(mockFrom).not.toHaveBeenCalled();
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining("/sendMessage"),
			expect.objectContaining({
				body: expect.stringContaining('"chat_id":42'),
			})
		);
	});

	it("links the chat id and marks the token used for a valid token", async () => {
		const tokenBuilder = makeQueryBuilder({
			data: {
				id: "token-1",
				user_id: "user-1",
				expires_at: new Date(Date.now() + 60_000).toISOString(),
				used_at: null,
			},
			error: null,
		});
		const profileUpdateBuilder = makeQueryBuilder({ data: null, error: null });
		const tokenUpdateBuilder = makeQueryBuilder({ data: null, error: null });

		// telegram_link_tokens is queried twice: once for select+maybeSingle,
		// once for the used_at update — return the select builder first, then
		// swap to a fresh update builder on the second call.
		let tokenCallCount = 0;
		mockFrom.mockImplementation((table: string) => {
			if (table === "profiles") return profileUpdateBuilder;
			tokenCallCount += 1;
			return tokenCallCount === 1 ? tokenBuilder : tokenUpdateBuilder;
		});

		const response = await POST(
			makeRequest({ message: { text: "/start valid-token", chat: { id: 42 } } })
		);

		expect(response.status).toBe(200);
		expect(tokenBuilder.eq).toHaveBeenCalledWith("token", "valid-token");
		expect(profileUpdateBuilder.update).toHaveBeenCalledWith(
			expect.objectContaining({ telegram_chat_id: 42 })
		);
		expect(profileUpdateBuilder.eq).toHaveBeenCalledWith("id", "user-1");
		expect(tokenUpdateBuilder.update).toHaveBeenCalledWith(
			expect.objectContaining({ used_at: expect.any(String) })
		);
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining("/sendMessage"),
			expect.objectContaining({
				body: expect.stringContaining("You're connected"),
			})
		);
	});

	it("rejects an unknown token without touching profiles", async () => {
		const tokenBuilder = makeQueryBuilder({ data: null, error: null });
		mockFrom.mockReturnValue(tokenBuilder);

		const response = await POST(
			makeRequest({ message: { text: "/start bogus", chat: { id: 42 } } })
		);

		expect(response.status).toBe(200);
		expect(mockFrom).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining("/sendMessage"),
			expect.objectContaining({
				body: expect.stringContaining("invalid or has expired"),
			})
		);
	});

	it("rejects an expired token", async () => {
		const tokenBuilder = makeQueryBuilder({
			data: {
				id: "token-1",
				user_id: "user-1",
				expires_at: new Date(Date.now() - 60_000).toISOString(),
				used_at: null,
			},
			error: null,
		});
		mockFrom.mockReturnValue(tokenBuilder);

		const response = await POST(
			makeRequest({ message: { text: "/start expired", chat: { id: 42 } } })
		);

		expect(response.status).toBe(200);
		expect(mockFrom).toHaveBeenCalledTimes(1);
	});

	it("rejects an already-used token", async () => {
		const tokenBuilder = makeQueryBuilder({
			data: {
				id: "token-1",
				user_id: "user-1",
				expires_at: new Date(Date.now() + 60_000).toISOString(),
				used_at: new Date().toISOString(),
			},
			error: null,
		});
		mockFrom.mockReturnValue(tokenBuilder);

		const response = await POST(
			makeRequest({ message: { text: "/start reused", chat: { id: 42 } } })
		);

		expect(response.status).toBe(200);
		expect(mockFrom).toHaveBeenCalledTimes(1);
	});
});
