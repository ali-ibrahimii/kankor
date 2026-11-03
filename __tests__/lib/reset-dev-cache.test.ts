import { afterEach, describe, expect, it, vi } from "vitest";
import { resetDevCache } from "@/lib/pwa/reset-dev-cache";

describe("resetDevCache", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("unregisters service workers and drops their caches", async () => {
		const unregister = vi.fn().mockResolvedValue(true);
		const deleteCache = vi.fn().mockResolvedValue(true);

		vi.stubGlobal("navigator", {
			serviceWorker: {
				getRegistrations: vi
					.fn()
					.mockResolvedValue([{ unregister }, { unregister }]),
			},
		});
		vi.stubGlobal("caches", {
			keys: vi.fn().mockResolvedValue(["abzarkankor-v1"]),
			delete: deleteCache,
		});

		await resetDevCache();

		expect(unregister).toHaveBeenCalledTimes(2);
		expect(deleteCache).toHaveBeenCalledWith("abzarkankor-v1");
	});

	it("does nothing when service workers are unsupported", async () => {
		vi.stubGlobal("navigator", {});

		await expect(resetDevCache()).resolves.toBeUndefined();
	});
});
