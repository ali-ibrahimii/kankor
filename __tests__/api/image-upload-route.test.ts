import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	user: { id: "user-1" } as { id: string } | null,
	asset: {
		storage_key: "courses/c1/cover/uuid-cover.png",
		mime_type: "image/png",
		status: "pending",
		uploaded_by: "user-1",
	} as {
		storage_key: string;
		mime_type: string;
		status: string;
		uploaded_by: string;
	} | null,
	putObject: vi.fn(),
}));

vi.mock("@/lib/r2/client", () => ({
	isR2Configured: () => true,
}));

vi.mock("@/lib/r2/presign", () => ({
	putObject: mocks.putObject,
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => ({
		auth: {
			getUser: async () => ({ data: { user: mocks.user } }),
		},
		from: () => ({
			select: () => ({
				eq: () => ({
					maybeSingle: async () => ({ data: mocks.asset }),
				}),
			}),
		}),
	}),
}));

import { POST } from "@/app/api/image-upload/route";

const buildForm = (file?: File | string, assetId: string = "asset-1") => {
	const form = new FormData();
	form.append(
		"file",
		file ?? new File(["binary"], "cover.png", { type: "image/png" })
	);
	form.append("assetId", assetId);
	return form;
};

const call = (form: FormData) =>
	POST(
		new Request("http://localhost/api/image-upload", {
			method: "POST",
			body: form,
		})
	);

beforeEach(() => {
	vi.clearAllMocks();
	mocks.user = { id: "user-1" };
	mocks.asset = {
		storage_key: "courses/c1/cover/uuid-cover.png",
		mime_type: "image/png",
		status: "pending",
		uploaded_by: "user-1",
	};
	vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("POST /api/image-upload", () => {
	it("stores the file under the pending row's storage key", async () => {
		const res = await call(buildForm());
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
		expect(mocks.putObject).toHaveBeenCalledTimes(1);
		const [key, body, mime] = mocks.putObject.mock.calls[0] as [
			string,
			{ byteLength: number },
			string,
		];
		expect(key).toBe("courses/c1/cover/uuid-cover.png");
		expect(mime).toBe("image/png");
		expect(body.byteLength).toBeGreaterThan(0);
	});

	it("rejects unauthenticated requests", async () => {
		mocks.user = null;
		const res = await call(buildForm());
		expect(res.status).toBe(401);
		expect(mocks.putObject).not.toHaveBeenCalled();
	});

	it("rejects rows that belong to another user", async () => {
		if (mocks.asset) mocks.asset.uploaded_by = "someone-else";
		const res = await call(buildForm());
		expect(res.status).toBe(403);
		expect(mocks.putObject).not.toHaveBeenCalled();
	});

	it("rejects when there is no pending row for the asset id", async () => {
		mocks.asset = null;
		const res = await call(buildForm());
		expect(res.status).toBe(403);
		expect(mocks.putObject).not.toHaveBeenCalled();
	});

	it("rejects when the row is not pending anymore", async () => {
		if (mocks.asset) mocks.asset.status = "ready";
		const res = await call(buildForm());
		expect(res.status).toBe(403);
		expect(mocks.putObject).not.toHaveBeenCalled();
	});

	it("rejects malformed requests", async () => {
		const res = await call(buildForm("not-a-file"));
		expect(res.status).toBe(400);
		expect(mocks.putObject).not.toHaveBeenCalled();
	});

	it("reports storage failures without leaking details", async () => {
		mocks.putObject.mockRejectedValueOnce(new Error("R2 exploded"));
		const res = await call(buildForm());
		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({ error: "Upload failed." });
		expect(console.error).toHaveBeenCalled();
	});
});
