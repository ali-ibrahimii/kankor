import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdateUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { updateUser: mockUpdateUser },
	}),
}));

import { resetPasswordAction } from "@/app/[locale]/auth/reset-password/action";

describe("resetPasswordAction", () => {
	beforeEach(() => {
		mockUpdateUser.mockReset();
	});

	it("returns { error: null } on success", async () => {
		mockUpdateUser.mockResolvedValueOnce({ error: null });

		const result = await resetPasswordAction({ password: "NewPassword1" });

		expect(result).toEqual({ error: null });
	});

	it("returns the error message on failure", async () => {
		mockUpdateUser.mockResolvedValueOnce({
			error: { message: "Auth session missing!" },
		});

		const result = await resetPasswordAction({ password: "NewPassword1" });

		expect(result.error).toBe("Auth session missing!");
	});

	it("calls supabase updateUser with the given password", async () => {
		mockUpdateUser.mockResolvedValueOnce({ error: null });

		await resetPasswordAction({ password: "MyNewPass1" });

		expect(mockUpdateUser).toHaveBeenCalledWith({ password: "MyNewPass1" });
	});
});
