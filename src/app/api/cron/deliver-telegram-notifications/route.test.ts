import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "update", "is", "in", "order", "limit"]) {
		builder[method] = vi.fn(() => builder);
	}
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: typeof result) => unknown
	) => Promise.resolve(result).then(onFulfilled);
	return builder;
}

const mockFrom = vi.hoisted(() => vi.fn());
const mockServerEnv = vi.hoisted(() => ({
	telegram: { botToken: "test-token" as string | undefined },
	cron: { secret: "test-secret" as string | undefined },
}));

vi.mock("@/lib/supabase/server", () => ({
	createServiceRoleClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/env/server-env", () => ({
	get serverEnv() {
		return mockServerEnv;
	},
}));

const { GET } = await import("./route");

function makeRequest(headers: Record<string, string> = {}) {
	return new Request(
		"http://localhost/api/cron/deliver-telegram-notifications",
		{ headers }
	) as unknown as Parameters<typeof GET>[0];
}

const AUTH_HEADER = { authorization: "Bearer test-secret" };

beforeEach(() => {
	mockFrom.mockReset();
	mockServerEnv.cron.secret = "test-secret";
	mockServerEnv.telegram.botToken = "test-token";
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("Telegram delivery cron", () => {
	it("returns 503 when cron is not configured", async () => {
		mockServerEnv.cron.secret = undefined;
		const response = await GET(makeRequest(AUTH_HEADER));
		expect(response.status).toBe(503);
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("returns 401 without a matching bearer token", async () => {
		const response = await GET(makeRequest({ authorization: "Bearer wrong" }));
		expect(response.status).toBe(401);
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("short-circuits with zero counts when telegram is not configured", async () => {
		mockServerEnv.telegram.botToken = undefined;
		const response = await GET(makeRequest(AUTH_HEADER));
		const body = await response.json();
		expect(body).toEqual({ processed: 0, delivered: 0, skipped: 0 });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("reports zero counts when there are no pending notifications", async () => {
		mockFrom.mockReturnValueOnce(makeQueryBuilder({ data: [], error: null }));

		const response = await GET(makeRequest(AUTH_HEADER));
		const body = await response.json();
		expect(body).toEqual({ processed: 0, delivered: 0, skipped: 0 });
	});

	it("delivers to linked users, skips unlinked users, and marks all processed", async () => {
		const notificationsBuilder = makeQueryBuilder({
			data: [
				{ id: "n1", user_id: "linked-user", title: "T1", message: "M1" },
				{ id: "n2", user_id: "unlinked-user", title: "T2", message: null },
			],
			error: null,
		});
		const profilesBuilder = makeQueryBuilder({
			data: [
				{ id: "linked-user", telegram_chat_id: 111 },
				{ id: "unlinked-user", telegram_chat_id: null },
			],
			error: null,
		});
		const updateBuilder = makeQueryBuilder({ data: null, error: null });

		let call = 0;
		mockFrom.mockImplementation((table: string) => {
			call += 1;
			if (table === "profiles") return profilesBuilder;
			// first notifications call = select pending, second = the update
			return call === 1 ? notificationsBuilder : updateBuilder;
		});

		const response = await GET(makeRequest(AUTH_HEADER));
		const body = await response.json();

		expect(body).toEqual({ processed: 2, delivered: 1, skipped: 1 });
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining("/sendMessage"),
			expect.objectContaining({
				body: expect.stringContaining('"chat_id":111'),
			})
		);
		expect(updateBuilder.update).toHaveBeenCalledWith(
			expect.objectContaining({ telegram_delivered_at: expect.any(String) })
		);
		expect(updateBuilder.in).toHaveBeenCalledWith("id", ["n1", "n2"]);
	});

	it("still marks a notification processed when the Telegram send fails", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

		const notificationsBuilder = makeQueryBuilder({
			data: [{ id: "n1", user_id: "linked-user", title: "T1", message: null }],
			error: null,
		});
		const profilesBuilder = makeQueryBuilder({
			data: [{ id: "linked-user", telegram_chat_id: 111 }],
			error: null,
		});
		const updateBuilder = makeQueryBuilder({ data: null, error: null });

		let call = 0;
		mockFrom.mockImplementation((table: string) => {
			call += 1;
			if (table === "profiles") return profilesBuilder;
			return call === 1 ? notificationsBuilder : updateBuilder;
		});

		const response = await GET(makeRequest(AUTH_HEADER));
		const body = await response.json();

		expect(body).toEqual({ processed: 1, delivered: 0, skipped: 0 });
		expect(updateBuilder.in).toHaveBeenCalledWith("id", ["n1"]);
	});
});
