import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of [
		"select",
		"update",
		"delete",
		"is",
		"in",
		"order",
		"limit",
	]) {
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
const mockGetFirebaseAdminMessaging = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createServiceRoleClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/env/server-env", () => ({
	get serverEnv() {
		return mockServerEnv;
	},
}));

vi.mock("@/lib/firebase/admin", () => ({
	getFirebaseAdminMessaging: mockGetFirebaseAdminMessaging,
}));

const { POST } = await import("./route");

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/webhooks/notification-created", {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	}) as unknown as Parameters<typeof POST>[0];
}

const AUTH_HEADER = { authorization: "Bearer test-secret" };
const PAYLOAD = {
	type: "INSERT",
	table: "notifications",
	schema: "public",
	record: { id: "n1", user_id: "u1", title: "T1", message: "M1" },
	old_record: null,
};

beforeEach(() => {
	mockFrom.mockReset();
	mockGetFirebaseAdminMessaging.mockReset();
	mockServerEnv.cron.secret = "test-secret";
	mockServerEnv.telegram.botToken = "test-token";
	mockGetFirebaseAdminMessaging.mockReturnValue(null);
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
	);
});

describe("notification-created webhook", () => {
	it("returns 503 when not configured", async () => {
		mockServerEnv.cron.secret = undefined;
		const response = await POST(makeRequest(PAYLOAD, AUTH_HEADER));
		expect(response.status).toBe(503);
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("returns 401 without a matching bearer token", async () => {
		const response = await POST(
			makeRequest(PAYLOAD, { authorization: "Bearer wrong" })
		);
		expect(response.status).toBe(401);
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("returns 400 for a payload missing required record fields", async () => {
		const response = await POST(
			makeRequest({ ...PAYLOAD, record: { id: "n1" } }, AUTH_HEADER)
		);
		expect(response.status).toBe(400);
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("delivers telegram for the single record when linked, skips push when firebase is unconfigured", async () => {
		const profilesBuilder = makeQueryBuilder({
			data: [{ id: "u1", telegram_chat_id: 111 }],
			error: null,
		});
		const updateBuilder = makeQueryBuilder({ data: null, error: null });

		let call = 0;
		mockFrom.mockImplementation((table: string) => {
			call += 1;
			if (table === "profiles") return profilesBuilder;
			return updateBuilder;
		});

		const response = await POST(makeRequest(PAYLOAD, AUTH_HEADER));
		const body = await response.json();

		expect(body).toEqual({
			telegram: { processed: 1, delivered: 1, skipped: 0 },
			push: { processed: 0, delivered: 0, skipped: 0, pruned: 0 },
		});
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(call).toBeGreaterThan(0);
	});

	it("delivers both channels when telegram and firebase are configured", async () => {
		const sendEachForMulticast = vi.fn().mockResolvedValue({
			responses: [{ success: true }],
		});
		mockGetFirebaseAdminMessaging.mockReturnValue({ sendEachForMulticast });

		const profilesBuilder = makeQueryBuilder({
			data: [{ id: "u1", telegram_chat_id: 111 }],
			error: null,
		});
		const tokensBuilder = makeQueryBuilder({
			data: [{ token: "tok-1", user_id: "u1" }],
			error: null,
		});
		const genericBuilder = makeQueryBuilder({ data: null, error: null });

		mockFrom.mockImplementation((table: string) => {
			if (table === "profiles") return profilesBuilder;
			if (table === "fcm_tokens") return tokensBuilder;
			return genericBuilder;
		});

		const response = await POST(makeRequest(PAYLOAD, AUTH_HEADER));
		const body = await response.json();

		expect(body).toEqual({
			telegram: { processed: 1, delivered: 1, skipped: 0 },
			push: { processed: 1, delivered: 1, skipped: 0, pruned: 0 },
		});
	});
});
