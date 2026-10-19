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

const { GET } = await import("./route");

function makeRequest(headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/cron/deliver-push-notifications", {
		headers,
	}) as unknown as Parameters<typeof GET>[0];
}

const AUTH_HEADER = { authorization: "Bearer test-secret" };

beforeEach(() => {
	mockFrom.mockReset();
	mockGetFirebaseAdminMessaging.mockReset();
	mockServerEnv.cron.secret = "test-secret";
});

describe("Push delivery cron", () => {
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

	it("short-circuits with zero counts when firebase admin is not configured", async () => {
		mockGetFirebaseAdminMessaging.mockReturnValue(null);
		const response = await GET(makeRequest(AUTH_HEADER));
		const body = await response.json();
		expect(body).toEqual({ processed: 0, delivered: 0, skipped: 0, pruned: 0 });
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("reports zero counts when there are no pending notifications", async () => {
		mockGetFirebaseAdminMessaging.mockReturnValue({
			sendEachForMulticast: vi.fn(),
		});
		mockFrom.mockReturnValueOnce(makeQueryBuilder({ data: [], error: null }));

		const response = await GET(makeRequest(AUTH_HEADER));
		const body = await response.json();
		expect(body).toEqual({ processed: 0, delivered: 0, skipped: 0, pruned: 0 });
	});

	it("delivers to users with tokens, skips users without, and prunes stale tokens", async () => {
		const sendEachForMulticast = vi.fn().mockResolvedValue({
			responses: [
				{ success: true },
				{
					success: false,
					error: { code: "messaging/registration-token-not-registered" },
				},
			],
		});
		mockGetFirebaseAdminMessaging.mockReturnValue({ sendEachForMulticast });

		const notificationsBuilder = makeQueryBuilder({
			data: [
				{ id: "n1", user_id: "with-tokens", title: "T1", message: "M1" },
				{ id: "n2", user_id: "no-tokens", title: "T2", message: null },
			],
			error: null,
		});
		const tokensBuilder = makeQueryBuilder({
			data: [
				{ token: "tok-good", user_id: "with-tokens" },
				{ token: "tok-stale", user_id: "with-tokens" },
			],
			error: null,
		});
		const pruneBuilder = makeQueryBuilder({ data: null, error: null });
		const notificationsUpdateBuilder = makeQueryBuilder({
			data: null,
			error: null,
		});

		// fcm_tokens is queried twice: once for the select, once for the
		// stale-token delete — swap to a fresh builder for the second call.
		let notificationsCall = 0;
		let fcmCall = 0;
		mockFrom.mockImplementation((table: string) => {
			if (table === "fcm_tokens") {
				fcmCall += 1;
				return fcmCall === 1 ? tokensBuilder : pruneBuilder;
			}
			notificationsCall += 1;
			return notificationsCall === 1
				? notificationsBuilder
				: notificationsUpdateBuilder;
		});

		const response = await GET(makeRequest(AUTH_HEADER));
		const body = await response.json();

		expect(body).toEqual({ processed: 2, delivered: 1, skipped: 1, pruned: 1 });
		expect(sendEachForMulticast).toHaveBeenCalledWith(
			expect.objectContaining({
				tokens: ["tok-good", "tok-stale"],
				notification: { title: "T1", body: "M1" },
			})
		);
		expect(pruneBuilder.delete).toHaveBeenCalled();
		expect(pruneBuilder.in).toHaveBeenCalledWith("token", ["tok-stale"]);
		expect(notificationsUpdateBuilder.update).toHaveBeenCalledWith(
			expect.objectContaining({ push_delivered_at: expect.any(String) })
		);
		expect(notificationsUpdateBuilder.in).toHaveBeenCalledWith("id", [
			"n1",
			"n2",
		]);
	});
});
