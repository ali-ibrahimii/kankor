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

type SchoolRecord = {
	id: string;
	name: string | null;
	admin_email: string | null;
	address: string | null;
	status: string;
};

function school(overrides: Partial<SchoolRecord> = {}): SchoolRecord {
	return {
		id: "s-1",
		name: "Kankor Academy",
		admin_email: "admin@school.com",
		address: "Kabul",
		status: "pending",
		...overrides,
	};
}

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/slack/webhook/school-created", {
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

describe("POST /api/slack/webhook/school-created", () => {
	it("posts a Slack notification for a pending school", async () => {
		const res = await POST(
			makeRequest({
				type: "INSERT",
				table: "schools",
				schema: "public",
				record: school(),
				old_record: null,
			})
		);

		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toMatchObject({ ok: true, sent: true });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("skips already-active schools", async () => {
		const res = await POST(
			makeRequest({
				type: "INSERT",
				table: "schools",
				schema: "public",
				record: school({ status: "active" }),
				old_record: null,
			})
		);

		await expect(res.json()).resolves.toMatchObject({
			skipped: "already-active",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("skips updates with no status change", async () => {
		const res = await POST(
			makeRequest({
				type: "UPDATE",
				table: "schools",
				schema: "public",
				record: school({ name: "Renamed" }),
				old_record: school({ name: "Original" }),
			})
		);

		await expect(res.json()).resolves.toMatchObject({
			skipped: "no-relevant-change",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("no-ops when Slack is not configured", async () => {
		mockServerEnv.slack.webhookUrl = undefined;
		const res = await POST(
			makeRequest({
				type: "INSERT",
				table: "schools",
				schema: "public",
				record: school(),
				old_record: null,
			})
		);

		await expect(res.json()).resolves.toMatchObject({
			skipped: "slack-not-configured",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
