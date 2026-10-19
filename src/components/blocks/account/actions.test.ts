import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockDeleteUser = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: {
			getUser: mockGetUser,
			updateUser: mockUpdateUser,
			signOut: mockSignOut,
		},
		from: mockFrom,
	}),
	createServiceRoleClient: vi.fn().mockReturnValue({
		auth: {
			admin: {
				deleteUser: mockDeleteUser,
			},
		},
	}),
}));

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
}));

const {
	updateProfileAction,
	updatePasswordAction,
	updateEmailAction,
	deleteAccountAction,
} = await import("./actions");

beforeEach(() => {
	vi.clearAllMocks();
});

describe("Account Actions", () => {
	describe("updateProfileAction", () => {
		it("returns unauthenticated if user is not logged in", async () => {
			mockGetUser.mockResolvedValueOnce({ data: { user: null } });
			const result = await updateProfileAction({ fullName: "New Name" });
			expect(result).toEqual({ success: false, error: "Unauthenticated" });
		});

		it("updates profile and revalidates path on success", async () => {
			mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });
			const mockEq = vi.fn().mockResolvedValueOnce({ error: null });
			const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
			mockFrom.mockReturnValueOnce({ update: mockUpdate });

			const result = await updateProfileAction({
				fullName: "Test User",
				bio: "Bio text",
			});

			expect(mockFrom).toHaveBeenCalledWith("profiles");
			expect(mockUpdate).toHaveBeenCalledWith({
				full_name: "Test User",
				bio: "Bio text",
			});
			expect(mockEq).toHaveBeenCalledWith("id", "user-123");
			expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
			expect(result).toEqual({ success: true, error: null });
		});
	});

	describe("updatePasswordAction", () => {
		it("rejects short password", async () => {
			const result = await updatePasswordAction({ password: "123" });
			expect(result).toEqual({
				success: false,
				error: "Password must be at least 6 characters long.",
			});
		});

		it("calls updateUser on valid password", async () => {
			mockUpdateUser.mockResolvedValueOnce({ error: null });
			const result = await updatePasswordAction({ password: "newPassword123" });
			expect(mockUpdateUser).toHaveBeenCalledWith({
				password: "newPassword123",
			});
			expect(result).toEqual({ success: true, error: null });
		});
	});

	describe("updateEmailAction", () => {
		it("rejects invalid email format", async () => {
			const result = await updateEmailAction({ email: "invalid-email" });
			expect(result).toEqual({
				success: false,
				error: "Invalid email address.",
			});
		});

		it("calls updateUser on valid email", async () => {
			mockUpdateUser.mockResolvedValueOnce({ error: null });
			const result = await updateEmailAction({ email: "test@example.com" });
			expect(mockUpdateUser).toHaveBeenCalledWith({
				email: "test@example.com",
			});
			expect(result).toEqual({ success: true, error: null });
		});
	});

	describe("deleteAccountAction", () => {
		it("deletes user via admin client and signs out", async () => {
			mockGetUser.mockResolvedValueOnce({
				data: { user: { id: "user-to-delete" } },
			});
			mockDeleteUser.mockResolvedValueOnce({ error: null });
			mockSignOut.mockResolvedValueOnce({ error: null });

			const result = await deleteAccountAction();

			expect(mockDeleteUser).toHaveBeenCalledWith("user-to-delete");
			expect(mockSignOut).toHaveBeenCalled();
			expect(result).toEqual({ success: true, error: null });
		});
	});
});
