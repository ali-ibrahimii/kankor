import { beforeEach, describe, expect, it, vi } from "vitest";

const mockResetPasswordForEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { resetPasswordForEmail: mockResetPasswordForEmail },
	}),
}));

vi.mock("@/lib/env/server-env", () => ({
	serverEnv: { app: { address: "http://localhost:3000" } },
}));

import { forgotPasswordAction } from "@/app/[locale]/auth/forgot-password/action";

describe("forgotPasswordAction", () => {
	beforeEach(() => {
		mockResetPasswordForEmail.mockReset();
	});

	it("returns { error: null } on success", async () => {
		mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

		const result = await forgotPasswordAction({ email: "user@example.com" });

		expect(result).toEqual({ error: null });
	});

	it("returns the error message on failure", async () => {
		mockResetPasswordForEmail.mockResolvedValueOnce({
			error: { message: "Rate limit exceeded" },
		});

		const result = await forgotPasswordAction({ email: "user@example.com" });

		expect(result.error).toBe("Rate limit exceeded");
	});

	it("lowercases and trims the email before calling supabase", async () => {
		mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

		await forgotPasswordAction({ email: "  USER@EXAMPLE.COM  " });

		expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
			"user@example.com",
			expect.any(Object)
		);
	});

	it("sets the redirectTo URL to include the reset-password path", async () => {
		mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

		await forgotPasswordAction({ email: "user@example.com" });

		expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
			"user@example.com",
			expect.objectContaining({
				redirectTo:
					"http://localhost:3000/api/auth/callback?next=/auth/reset-password",
			})
		);
	});
});
