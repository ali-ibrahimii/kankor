import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = { id: string } | null;

const mocks = vi.hoisted(() => {
	const state = {
		rpcResult: { data: true, error: null } as {
			data: boolean | null;
			error: unknown;
		},
		insertResult: { error: null, status: 201, statusText: "Created" } as {
			error: unknown;
			status: number;
			statusText: string;
		},
		recoverResult: { data: { id: "asset-1" }, error: null, status: 200 } as {
			data: Row;
			error: unknown;
			status: number;
		},
		uploadUrl: "https://r2.example/upload",
		deletedIds: [] as string[],
	};

	const chain = (result: () => unknown, onDelete?: () => void) => {
		const c: Record<string, (...args: unknown[]) => unknown> = {};
		for (const m of ["select", "eq", "insert", "update", "order", "limit"]) {
			c[m] = () => c;
		}
		c.delete = () => {
			onDelete?.();
			return c;
		};
		c.maybeSingle = async () => result();
		c.single = async () => result();
		return c;
	};

	const supabase = {
		auth: {
			getUser: async () => ({ data: { user: { id: "user-1" } } }),
		},
		rpc: async () => state.rpcResult,
		from: (_table: string) => ({
			insert: () => ({
				then: (
					resolve: (value: unknown) => unknown,
					reject?: (reason: unknown) => unknown
				) => Promise.resolve(state.insertResult).then(resolve, reject),
			}),
			select: () => chain(() => state.recoverResult),
			delete: () =>
				chain(
					() => ({ error: null }),
					() => state.deletedIds.push("deleted")
				),
		}),
	};

	return { state, supabase };
});

vi.mock("@/lib/env/server-env", () => ({
	serverEnv: {
		r2: {
			accountId: "acc",
			accessKeyId: "key",
			secretAccessKey: "secret",
			bucketName: "bucket",
			endpoint: undefined,
		},
	},
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => mocks.supabase,
}));

vi.mock("@/lib/r2/presign", () => ({
	createUploadUrl: async () => mocks.state.uploadUrl,
	deleteObject: async () => undefined,
	headObject: async () => ({ size: 1, contentType: "image/png" }),
	listBucketObjects: async () => [],
}));

import { requestImageUpload } from "@/lib/r2/image-actions";

const input = {
	scope: "course" as const,
	ownerId: "course-1",
	filename: "cover.png",
	mimeType: "image/png",
	sizeBytes: 1024,
};

beforeEach(() => {
	vi.clearAllMocks();
	mocks.state.rpcResult = { data: true, error: null };
	mocks.state.insertResult = {
		error: null,
		status: 201,
		statusText: "Created",
	};
	mocks.state.recoverResult = {
		data: { id: "asset-1" },
		error: null,
		status: 200,
	};
	mocks.state.deletedIds = [];
	vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("requestImageUpload", () => {
	it("returns an upload slot when the record insert succeeds", async () => {
		const result = await requestImageUpload(input);
		expect(result).toEqual({
			success: true,
			data: {
				assetId: "asset-1",
				uploadUrl: mocks.state.uploadUrl,
				storageKey: expect.any(String),
			},
		});
	});

	it("proceeds when the insert reports an error but the row exists", async () => {
		// Unique violation from a stale pending record with the same key: the
		// row is the upload slot, so the upload must continue.
		mocks.state.insertResult = {
			error: {
				message:
					'duplicate key value violates unique constraint "image_assets_storage_key_key"',
				code: "23505",
			},
			status: 409,
			statusText: "Conflict",
		};

		const result = await requestImageUpload(input);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.assetId).toBe("asset-1");
	});

	it("reports upload_record_failed with normalized cause and HTTP status", async () => {
		// Gateway-style error bodies carry `msg`, not `message`.
		mocks.state.insertResult = {
			error: { msg: "JWT expired", code: 401 },
			status: 401,
			statusText: "Unauthorized",
		};
		mocks.state.recoverResult = { data: null, error: null, status: 200 };

		const result = await requestImageUpload(input);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("upload_record_failed");
			expect(result.error).toContain("JWT expired");
			expect(result.error).toContain("(401)");
			expect(result.error).toContain("HTTP 401");
		}
		expect(console.error).toHaveBeenCalled();
	});

	it("renders message-less error bodies instead of 'undefined'", async () => {
		mocks.state.insertResult = {
			error: { error: "forbidden by policy" },
			status: 403,
			statusText: "Forbidden",
		};
		mocks.state.recoverResult = { data: null, error: null, status: 200 };

		const result = await requestImageUpload(input);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("forbidden by policy");
			expect(result.error).not.toContain("undefined");
		}
	});

	it("does not let an empty insert error mask the lookup error", async () => {
		mocks.state.insertResult = {
			error: {},
			status: 404,
			statusText: "Not Found",
		};
		mocks.state.recoverResult = {
			data: null,
			error: {
				code: "42P01",
				message: 'relation "public.image_assets" does not exist',
			},
			status: 404,
		};

		const result = await requestImageUpload(input);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain(
				'relation "public.image_assets" does not exist'
			);
			expect(result.error).toContain("42P01");
			expect(result.error).not.toContain("{}");
		}
	});

	it("reports upload_record_failed when insert and lookup both stay empty", async () => {
		mocks.state.insertResult = {
			error: null,
			status: 201,
			statusText: "Created",
		};
		mocks.state.recoverResult = { data: null, error: null, status: 200 };

		const result = await requestImageUpload(input);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("upload_record_failed");
			expect(result.error).toContain("no row and no error");
		}
	});

	it("denies via not_authorized when the permission check answers false", async () => {
		mocks.state.rpcResult = { data: false, error: null };

		const result = await requestImageUpload(input);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("not_authorized");
	});

	it("reports permission_check_failed when the permission RPC errors", async () => {
		mocks.state.rpcResult = { data: null, error: { message: "boom" } };

		const result = await requestImageUpload(input);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("permission_check_failed");
	});
});
