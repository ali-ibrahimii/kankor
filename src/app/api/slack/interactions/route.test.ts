import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeQueryBuilder(result: { error: unknown }) {
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["update", "eq"]) {
		builder[method] = vi.fn(() => builder);
	}
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: typeof result) => unknown
	) => Promise.resolve(result).then(onFulfilled);
	return builder;
}

const mockFrom = vi.hoisted(() => vi.fn());
const mockServerEnv = vi.hoisted(() => ({
	slack: {
		channelId: "C123" as string | undefined,
		webhookUrl: "https://hooks.slack.com/services/test" as string | undefined,
		signingSecret: undefined as string | undefined,
		dbWebhookSecret: undefined as string | undefined,
	},
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

function makeInteraction(payload: unknown) {
	const body = new URLSearchParams({
		payload: JSON.stringify(payload),
	}).toString();
	return new Request("http://localhost/api/slack/interactions", {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body,
	}) as unknown as Parameters<typeof POST>[0];
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	mockFrom.mockReset();
	mockServerEnv.slack.signingSecret = undefined;
	fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("POST /api/slack/interactions", () => {
	it("approves a school and updates the message", async () => {
		const builder = makeQueryBuilder({ error: null });
		mockFrom.mockReturnValue(builder);

		const res = await POST(
			makeInteraction({
				type: "block_actions",
				user: { id: "U1", username: "admin" },
				response_url: "https://hooks.slack.com/actions/response",
				message: { text: "New school", blocks: [] },
				actions: [{ action_id: "approve_school", value: "s-1" }],
			})
		);

		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toMatchObject({ ok: true });
		expect(mockFrom).toHaveBeenCalledWith("schools");
		expect(builder.update).toHaveBeenCalledWith({ status: "active" });
		expect(builder.eq).toHaveBeenCalledWith("id", "s-1");
		expect(fetchMock).toHaveBeenCalledWith(
			"https://hooks.slack.com/actions/response",
			expect.objectContaining({ method: "POST" })
		);
	});

	it("approves an instructor", async () => {
		const builder = makeQueryBuilder({ error: null });
		mockFrom.mockReturnValue(builder);

		const res = await POST(
			makeInteraction({
				type: "block_actions",
				user: { id: "U1" },
				response_url: "https://hooks.slack.com/actions/response",
				message: { text: "New instructor", blocks: [] },
				actions: [{ action_id: "approve_instructor", value: "p-1" }],
			})
		);

		expect(res.status).toBe(200);
		expect(mockFrom).toHaveBeenCalledWith("profiles");
		expect(builder.update).toHaveBeenCalledWith({
			instructor_status: "active",
		});
		expect(builder.eq).toHaveBeenCalledWith("id", "p-1");
	});

	it("returns 500 when the update fails", async () => {
		mockFrom.mockReturnValue(makeQueryBuilder({ error: { message: "boom" } }));

		const res = await POST(
			makeInteraction({
				type: "block_actions",
				user: { id: "U1" },
				actions: [{ action_id: "approve_school", value: "s-1" }],
			})
		);

		expect(res.status).toBe(500);
	});

	it("rejects requests with an invalid Slack signature", async () => {
		mockServerEnv.slack.signingSecret = "secret";
		const res = await POST(
			makeInteraction({
				type: "block_actions",
				actions: [{ action_id: "approve_school", value: "s-1" }],
			})
		);

		expect(res.status).toBe(401);
		expect(mockFrom).not.toHaveBeenCalled();
	});
});
