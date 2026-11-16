import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignUp = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockHasServiceRoleKey = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { signUp: mockSignUp },
	}),
	createServiceRoleClient: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({
			insert: mockInsert,
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					maybeSingle: mockMaybeSingle,
				}),
			}),
		}),
	}),
	hasServiceRoleKey: mockHasServiceRoleKey,
}));

vi.mock("@/lib/env/server-env", () => ({
	serverEnv: { app: { address: "http://localhost:3000" } },
}));

// The in-memory rate limiter would block the 11th+ signup of this suite
// (same IP + email); unit tests are not testing the limiter itself.
vi.mock("@/lib/security/action-guard", () => ({
	guardServerAction: vi.fn().mockResolvedValue({ ok: true }),
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
		mockMaybeSingle.mockReset();
		mockHasServiceRoleKey.mockReset();
		mockHasServiceRoleKey.mockReturnValue(true);
		mockMaybeSingle.mockResolvedValue({ data: null, error: null });
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
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

	it("passes school signup metadata for the DB provisioning trigger", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});
		mockInsert.mockResolvedValueOnce({ error: null });

		await signupAction({
			...base,
			type: "school",
			schoolName: "Test Academy",
			schoolAddress: "Kabul",
			provinceId: "prov-1",
		});

		expect(mockSignUp).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.objectContaining({
					data: expect.objectContaining({
						signup_type: "school",
						school_name: "Test Academy",
						school_address: "Kabul",
						province_id: "prov-1",
					}),
				}),
			})
		);
	});

	it("skips the repair insert when the DB trigger already created the school", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});
		mockMaybeSingle.mockResolvedValueOnce({ data: { id: "s1" }, error: null });

		const result = await signupAction({ ...base, type: "school" });

		expect(mockInsert).not.toHaveBeenCalled();
		expect(result).toEqual({ error: null });
	});

	it("relies on the DB trigger when no real service-role key is configured", async () => {
		mockHasServiceRoleKey.mockReturnValue(false);
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});

		const result = await signupAction({ ...base, type: "school" });

		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockMaybeSingle).not.toHaveBeenCalled();
		expect(result).toEqual({ error: null });
		expect(console.warn).toHaveBeenCalled();
	});

	it("returns a localized failure code when school creation fails", async () => {
		mockSignUp.mockResolvedValueOnce({
			error: null,
			data: { user: { id: "u1" } },
		});
		mockInsert.mockResolvedValueOnce({
			error: { message: "permission denied for table schools", code: "42501" },
		});

		const result = await signupAction({
			...base,
			type: "school",
			schoolName: "Test Academy",
			schoolAddress: "Kabul",
		});

		// The user-facing code is a localized key, never the raw server text.
		expect(result.code).toBe("common.schoolCreationFailed");
		expect(result.error).toBe("common.schoolCreationFailed");
		// The raw error + a 42501 hint stay in the console.
		expect(console.error).toHaveBeenCalledWith(
			"[signup] school record creation failed:",
			expect.objectContaining({ code: "42501" })
		);
		expect(
			JSON.stringify((console.error as ReturnType<typeof vi.fn>).mock.calls)
		).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
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
