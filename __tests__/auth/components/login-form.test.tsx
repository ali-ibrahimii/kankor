import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../test-utils";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockRouterPush = vi.hoisted(() => vi.fn());
const mockRouterRefresh = vi.hoisted(() => vi.fn());
const mockLoginAction = vi.hoisted(() => vi.fn());
const mockGetCurrentUser = vi.hoisted(() =>
	vi
		.fn()
		.mockResolvedValue({ id: "u1", role: "student", schoolMemberships: [] })
);
const mockGetSearchParam = vi.hoisted(() => vi.fn().mockReturnValue(null));
const mockSignInWithOAuth = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockGetDashboardPath = vi.hoisted(() => vi.fn().mockReturnValue("/en/d"));

vi.mock("@/lib/auth/auth.util", () => ({
	getDashboardPath: mockGetDashboardPath,
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
	useSearchParams: () => ({ get: mockGetSearchParam }),
}));

vi.mock("@/lib/auth/session", () => ({
	getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/i18n/navigation", () => ({
	Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		auth: { signInWithOAuth: mockSignInWithOAuth },
	}),
}));

vi.mock("@/lib/env/client-env", () => ({
	clientEnv: {
		app: {
			address: "http://localhost:3000",
		},
	},
}));

vi.mock("@/app/[locale]/auth/login/action", () => ({
	loginAction: mockLoginAction,
}));

// ── Tests ────────────────────────────────────────────────────────────────────

import { LoginForm } from "@/app/[locale]/auth/login/login-form";

describe("LoginForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetSearchParam.mockReturnValue(null);
	});

	it("renders the email and password fields", () => {
		renderWithIntl(<LoginForm />);
		expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
	});

	it("renders the Google sign-in button", () => {
		renderWithIntl(<LoginForm />);
		expect(
			screen.getByRole("button", { name: /continue with google/i })
		).toBeInTheDocument();
	});

	it("renders the submit button", () => {
		renderWithIntl(<LoginForm />);
		expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
	});

	it("renders a link to the forgot-password page", () => {
		renderWithIntl(<LoginForm />);
		const link = screen.getByRole("link", { name: /forgot password/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/auth/forgot-password");
	});

	it("includes the email in the forgot-password link if entered", async () => {
		const user = userEvent.setup();
		renderWithIntl(<LoginForm />);

		const emailInput = screen.getByLabelText("Email Address");
		await user.type(emailInput, "test@example.com");

		const link = screen.getByRole("link", { name: /forgot password/i });
		expect(link).toHaveAttribute(
			"href",
			"/auth/forgot-password?email=test%40example.com"
		);
	});

	it("renders a link to the signup page", () => {
		renderWithIntl(<LoginForm />);
		const link = screen.getByRole("link", { name: /register/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/auth/signup");
	});

	it("shows a destructive alert when loginAction returns an error", async () => {
		mockLoginAction.mockResolvedValueOnce({
			error: "Invalid login credentials",
			code: "invalid_credentials",
		});

		const user = userEvent.setup();
		renderWithIntl(<LoginForm />);

		await user.type(screen.getByLabelText("Email Address"), "user@example.com");
		await user.type(screen.getByLabelText("Password"), "wrongpass");
		await user.click(screen.getByRole("button", { name: /^login$/i }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Invalid login credentials"
			);
		});
	});

	it("routes by the returned profile's role on successful login", async () => {
		// loginAction returns the profile (incl. school/agency memberships) so
		// the client can resolve the role dashboard via getDashboardPath — the
		// path-per-role mapping itself is unit-tested in
		// __tests__/agencies/auth-util.test.ts. The actual navigation is a full
		// page load (window.location), which jsdom cannot observe.
		const profile = {
			id: "u1",
			role: "student",
			schoolMemberships: [],
			agencyMemberships: [
				{ agency_id: "agency-1", role: "staff", status: "active" },
			],
		};
		mockLoginAction.mockResolvedValueOnce({ error: null, user: profile });

		const user = userEvent.setup();
		renderWithIntl(<LoginForm />);

		await user.type(screen.getByLabelText("Email Address"), "user@example.com");
		await user.type(screen.getByLabelText("Password"), "Password1");
		await user.click(screen.getByRole("button", { name: /^login$/i }));

		await waitFor(
			() => {
				expect(mockGetDashboardPath).toHaveBeenCalledWith(profile, "en");
			},
			{ timeout: 5000 }
		);
	});

	it("calls loginAction with the typed credentials", async () => {
		mockLoginAction.mockResolvedValueOnce({ error: null });

		const user = userEvent.setup();
		renderWithIntl(<LoginForm />);

		await user.type(screen.getByLabelText("Email Address"), "test@example.com");
		await user.type(screen.getByLabelText("Password"), "Password1");
		await user.click(screen.getByRole("button", { name: /^login$/i }));

		await waitFor(() => {
			expect(mockLoginAction).toHaveBeenCalledWith({
				email: "test@example.com",
				password: "Password1",
			});
		});
	});

	it("calls signInWithOAuth with default redirect URL when 'next' param is absent", async () => {
		mockGetSearchParam.mockReturnValue(null);
		const user = userEvent.setup();
		renderWithIntl(<LoginForm />);

		await user.click(
			screen.getByRole("button", { name: /continue with google/i })
		);

		await waitFor(() => {
			expect(mockSignInWithOAuth).toHaveBeenCalledWith({
				provider: "google",
				options: {
					redirectTo: "http://localhost:3000/api/auth/callback",
				},
			});
		});
	});

	it("calls signInWithOAuth with redirect URL containing 'next' param when present", async () => {
		mockGetSearchParam.mockReturnValue("/courses/slug-123");
		const user = userEvent.setup();
		renderWithIntl(<LoginForm />);

		await user.click(
			screen.getByRole("button", { name: /continue with google/i })
		);

		await waitFor(() => {
			expect(mockSignInWithOAuth).toHaveBeenCalledWith({
				provider: "google",
				options: {
					redirectTo:
						"http://localhost:3000/api/auth/callback?next=%2Fcourses%2Fslug-123",
				},
			});
		});
	});
});
