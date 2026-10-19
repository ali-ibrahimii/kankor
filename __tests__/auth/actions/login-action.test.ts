import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignInWithPassword = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { signInWithPassword: mockSignInWithPassword },
	}),
	// The post-login profile fetch (with school/agency memberships) runs on
	// the service-role client so RLS can't hide the row.
	createServiceRoleClient: vi.fn().mockReturnValue({ from: mockFrom }),
}));

import { loginAction } from "@/app/[locale]/auth/login/action";

/** Profile row returned by the post-login profile fetch. */
const PROFILE = {
	id: "user-id",
	role: "student",
	schoolMemberships: [],
	agencyMemberships: [],
};

describe("loginAction", () => {
	beforeEach(() => {
		mockSignInWithPassword.mockReset();
		mockFrom.mockReset();
		mockSingle.mockReset();
		mockSingle.mockResolvedValue({ data: PROFILE, error: null });
		mockFrom.mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({ single: mockSingle }),
			}),
		});
	});

	it("returns { error: null } and the profile on successful login", async () => {
		mockSignInWithPassword.mockResolvedValueOnce({
			data: { user: { id: "user-id" } },
			error: null,
		});

		const result = await loginAction({
			email: "user@example.com",
			password: "Password1",
		});

		expect(result).toEqual({ error: null, user: PROFILE });
		expect(mockFrom).toHaveBeenCalledWith("profiles");
	});

	it("returns the error message and code on failure", async () => {
		mockSignInWithPassword.mockResolvedValueOnce({
			data: { user: null },
			error: {
				message: "Invalid login credentials",
				code: "invalid_credentials",
			},
		});

		const result = await loginAction({
			email: "user@example.com",
			password: "wrong",
		});

		expect(result.error).toBe("Invalid login credentials");
		expect(result.code).toBe("invalid_credentials");
		expect(mockFrom).not.toHaveBeenCalled();
	});

	it("lowercases and trims the email before calling supabase", async () => {
		mockSignInWithPassword.mockResolvedValueOnce({
			data: { user: { id: "user-id" } },
			error: null,
		});

		await loginAction({ email: "  TEST@EXAMPLE.COM  ", password: "pass" });

		expect(mockSignInWithPassword).toHaveBeenCalledWith({
			email: "test@example.com",
			password: "pass",
		});
	});

	it("passes the password as-is (no transformation)", async () => {
		mockSignInWithPassword.mockResolvedValueOnce({
			data: { user: { id: "user-id" } },
			error: null,
		});

		await loginAction({ email: "user@example.com", password: "  My Pass  " });

		expect(mockSignInWithPassword).toHaveBeenCalledWith(
			expect.objectContaining({ password: "  My Pass  " })
		);
	});
});
