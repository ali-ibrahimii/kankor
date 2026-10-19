import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockServerEnv = vi.hoisted(() => ({
	slack: {
		channelId: "C123" as string | undefined,
		webhookUrl: "https://hooks.slack.com/services/test" as string | undefined,
		signingSecret: undefined as string | undefined,
		dbWebhookSecret: undefined as string | undefined,
	},
}));

vi.mock("@/lib/env/server-env", () => ({
	get serverEnv() {
		return mockServerEnv;
	},
}));

const { POST } = await import("./route");

type ProfileRecord = {
	id: string;
	role: string;
	instructor_status: string | null;
	full_name: string | null;
	email: string | null;
	phone: string | null;
};

function profile(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
	return {
		id: "p-1",
		role: "instructor",
		instructor_status: "pending",
		full_name: "Jane Teacher",
		email: "jane@example.com",
		phone: "+93700000000",
		...overrides,
	};
}

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/slack/webhook/instructor-signup", {
		method: "POST",
		headers: { "content-type": "application/json", ...headers },
		body: JSON.stringify(body),
	}) as unknown as Parameters<typeof POST>[0];
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	mockServerEnv.slack.webhookUrl = "https://hooks.slack.com/services/test";
	mockServerEnv.slack.signingSecret = undefined;
	mockServerEnv.slack.dbWebhookSecret = undefined;
	fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("POST /api/slack/webhook/instructor-signup", () => {
	it("posts a Slack notification for a pending instructor", async () => {
		const res = await POST(
			makeRequest({
				type: "INSERT",
				table: "profiles",
				schema: "public",
				record: profile(),
				old_record: null,
			})
		);

		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toMatchObject({ ok: true, sent: true });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://hooks.slack.com/services/test",
			expect.objectContaining({ method: "POST" })
		);
	});

	it("skips non-instructor profiles", async () => {
		const res = await POST(
			makeRequest({
				type: "INSERT",
				table: "profiles",
				schema: "public",
				record: profile({ role: "student" }),
				old_record: null,
			})
		);

		await expect(res.json()).resolves.toMatchObject({
			skipped: "not-instructor",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("skips already-active instructors", async () => {
		const res = await POST(
			makeRequest({
				type: "UPDATE",
				table: "profiles",
				schema: "public",
				record: profile({ instructor_status: "active" }),
				old_record: profile({ instructor_status: "pending" }),
			})
		);

		await expect(res.json()).resolves.toMatchObject({
			skipped: "already-active",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("skips updates with no relevant status change", async () => {
		const res = await POST(
			makeRequest({
				type: "UPDATE",
				table: "profiles",
				schema: "public",
				record: profile({ full_name: "New Name" }),
				old_record: profile({ full_name: "Old Name" }),
			})
		);

		await expect(res.json()).resolves.toMatchObject({
			skipped: "no-relevant-change",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("rejects requests with a bad webhook secret", async () => {
		mockServerEnv.slack.dbWebhookSecret = "expected";
		const res = await POST(
			makeRequest(
				{
					type: "INSERT",
					table: "profiles",
					schema: "public",
					record: profile(),
					old_record: null,
				},
				{ "x-webhook-secret": "wrong" }
			)
		);

		expect(res.status).toBe(401);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
