import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../test-utils";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSignupAction = vi.hoisted(() => vi.fn());

vi.mock("next-intl", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next-intl")>();
	return {
		...actual,
		useLocale: () => "en",
	};
});

vi.mock("@/i18n/navigation", () => ({
	Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("@/app/[locale]/auth/signup/action", () => ({
	signupAction: mockSignupAction,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...actual,
		useQuery: () => ({
			data: [
				{ value: "prov-1", label: "Kabul" },
				{ value: "prov-2", label: "Herat" },
			],
			isLoading: false,
		}),
	};
});

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({}),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

import { SignupForm } from "@/app/[locale]/auth/signup/signup-form";

describe("SignupForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("student type (default)", () => {
		it("renders the student signup title", () => {
			renderWithIntl(<SignupForm type="student" />);
			expect(screen.getByText(/create your account/i)).toBeInTheDocument();
		});

		it("renders full name, email, password, and confirm password fields", () => {
			renderWithIntl(<SignupForm type="student" />);
			expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
			expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
			expect(screen.getByLabelText("Password")).toBeInTheDocument();
			expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
		});

		it("does not render school-specific fields", () => {
			renderWithIntl(<SignupForm type="student" />);
			expect(screen.queryByLabelText("School Name")).not.toBeInTheDocument();
			expect(screen.queryByLabelText("School Address")).not.toBeInTheDocument();
		});

		it("renders a link back to login", () => {
			renderWithIntl(<SignupForm type="student" />);
			expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
				"href",
				"/auth/login"
			);
		});
	});

	describe("instructor type", () => {
		it("renders the instructor signup title", () => {
			renderWithIntl(<SignupForm type="instructor" />);
			expect(screen.getByText(/register as instructor/i)).toBeInTheDocument();
		});

		it("does not render school-specific fields", () => {
			renderWithIntl(<SignupForm type="instructor" />);
			expect(screen.queryByLabelText("School Name")).not.toBeInTheDocument();
		});
	});

	describe("school type", () => {
		it("renders the school signup title", () => {
			renderWithIntl(<SignupForm type="school" />);
			expect(screen.getByText(/register your school/i)).toBeInTheDocument();
		});

		it("renders school name and address fields", () => {
			renderWithIntl(<SignupForm type="school" />);
			expect(screen.getByLabelText("School Name")).toBeInTheDocument();
			expect(screen.getByLabelText("School Address")).toBeInTheDocument();
		});
	});

	describe("form submission", () => {
		it("shows the success card after a successful student signup", async () => {
			mockSignupAction.mockResolvedValueOnce({ error: null });

			const user = userEvent.setup();
			renderWithIntl(<SignupForm type="student" />);

			await user.type(screen.getByLabelText("Full Name"), "John Doe");
			await user.type(
				screen.getByLabelText("Email Address"),
				"john@example.com"
			);
			await user.type(screen.getByLabelText("Password"), "Password1");
			await user.type(screen.getByLabelText("Confirm Password"), "Password1");
			await user.click(screen.getByRole("button", { name: /create account/i }));

			await waitFor(() => {
				expect(screen.getByText(/check your email/i)).toBeInTheDocument();
			});
		});

		it("shows a destructive alert when signup fails", async () => {
			mockSignupAction.mockResolvedValueOnce({
				error: "User already registered",
				code: "common.user_already_exists",
			});

			const user = userEvent.setup();
			renderWithIntl(<SignupForm type="student" />);

			await user.type(screen.getByLabelText("Full Name"), "John Doe");
			await user.type(
				screen.getByLabelText("Email Address"),
				"john@example.com"
			);
			await user.type(screen.getByLabelText("Password"), "Password1");
			await user.type(screen.getByLabelText("Confirm Password"), "Password1");
			await user.click(screen.getByRole("button", { name: /create account/i }));

			await waitFor(() => {
				expect(screen.getByRole("alert")).toBeInTheDocument();
			});
		});
	});
});
