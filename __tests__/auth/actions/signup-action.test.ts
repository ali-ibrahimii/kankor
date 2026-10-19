import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignUp = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { signUp: mockSignUp },
		from: vi.fn().mockReturnValue({ insert: mockInsert }),
	}),
	createServiceRoleClient: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({ insert: mockInsert }),
	}),
}));

vi.mock("@/lib/env/server-env", () => ({
	serverEnv: { app: { address: "http://localhost:3000" } },
}));

import { signupAction } from "@/app/[locale]/auth/signup/action";
import type { SignUpFormValues } from "@/app/[locale]/auth/signup/signup-schema";

const base: SignUpFormValues = {
	fullName: "John Doe",
	email: "john@example.com",
	password: "Password1",
	confirmPassword: "Password1",
	locale: "en",
	type: "student",
};

describe("signupAction", () => {
	beforeEach(() => {
		mockSignUp.mockReset();
		mockInsert.mockReset();
	});

	it("returns a password mismatch error without calling supabase", async () => {
		const result = await signupAction({
			...base,
			confirmPassword: "Different1",
		});

		expect(result.error).toBe("validation.passwordMismatch");
		expect(mockSignUp).not.toHaveBeenCalled();
	});

	it("returns { error: null } on successful student signup", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});

		const result = await signupAction(base);

		expect(result).toEqual({ error: null });
	});

	it("returns error code when supabase auth fails", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: {
				message: "User already registered",
				code: "user_already_exists",
			},
			data: { user: null },
		});

		const result = await signupAction(base);

		expect(result.error).toBe("User already registered");
		expect(result.code).toBe("common.user_already_exists");
	});

	it("creates a school record after successful school signup", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});
		mockInsert.mockResolvedValueOnce({ error: null });

		const result = await signupAction({
			...base,
			type: "school",
			schoolName: "Test Academy",
			schoolAddress: "Kabul, Afghanistan",
		});

		expect(mockInsert).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Test Academy",
				address: "Kabul, Afghanistan",
				user_id: "u1",
				admin_email: "john@example.com",
			})
		);
		expect(result).toEqual({ error: null });
	});

	it("returns an error when school record creation fails", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});
		mockInsert.mockResolvedValueOnce({
			error: { message: "Duplicate entry", code: "23505" },
		});

		const result = await signupAction({
			...base,
			type: "school",
			schoolName: "Test Academy",
			schoolAddress: "Kabul",
		});

		expect(result.error).toBe("Duplicate entry");
		expect(result.code).toBe("common.23505");
	});

	it("assigns student role for school account type", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});
		mockInsert.mockResolvedValueOnce({ error: null });

		await signupAction({ ...base, type: "school" });

		expect(mockSignUp).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.objectContaining({
					data: expect.objectContaining({ role: "student" }),
				}),
			})
		);
	});

	it("assigns instructor role for instructor account type", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});

		await signupAction({ ...base, type: "instructor" });

		expect(mockSignUp).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.objectContaining({
					data: expect.objectContaining({ role: "instructor" }),
				}),
			})
		);
	});

	it("lowercases and trims email before calling supabase", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});

		await signupAction({ ...base, email: "  JOHN@EXAMPLE.COM  " });

		expect(mockSignUp).toHaveBeenCalledWith(
			expect.objectContaining({ email: "john@example.com" })
		);
	});

	it("does not create school record for student type", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});

		await signupAction(base);

		expect(mockInsert).not.toHaveBeenCalled();
	});
});
