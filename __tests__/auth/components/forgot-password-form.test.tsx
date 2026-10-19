import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../test-utils";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockForgotPasswordAction = vi.hoisted(() => vi.fn());
const mockGetSearchParam = vi.hoisted(() => vi.fn().mockReturnValue(null));

vi.mock("@/lib/env/client-env", () => ({
	clientEnv: {
		app: {
			address: "http://localhost:3000",
		},
		supabase: {
			url: "http://localhost:54321",
			publishableKey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
		},
	},
}));

vi.mock("next/navigation", () => ({
	useSearchParams: () => ({ get: mockGetSearchParam }),
}));

vi.mock("@/i18n/navigation", () => ({
	Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("@/app/[locale]/auth/forgot-password/action", () => ({
	forgotPasswordAction: mockForgotPasswordAction,
}));

// ── Tests ────────────────────────────────────────────────────────────────────

import { ForgotPasswordForm } from "@/app/[locale]/auth/forgot-password/forgot-password-form";

describe("ForgotPasswordForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetSearchParam.mockReturnValue(null);
	});

	it("pre-fills the email field from search parameters", () => {
		mockGetSearchParam.mockReturnValueOnce("test@example.com");
		renderWithIntl(<ForgotPasswordForm />);
		expect(screen.getByLabelText("Email Address")).toHaveValue(
			"test@example.com"
		);
	});

	it("renders the page title and email field", () => {
		const { container } = renderWithIntl(<ForgotPasswordForm />);
		// CardTitle renders as a div (not a heading); the submit button also says "Reset Password"
		// so scope the title check to the [data-slot="card-title"] element.
		expect(
			container.querySelector('[data-slot="card-title"]')
		).toHaveTextContent(/reset password/i);
		expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
	});

	it("renders the submit button", () => {
		renderWithIntl(<ForgotPasswordForm />);
		expect(
			screen.getByRole("button", { name: /reset password/i })
		).toBeInTheDocument();
	});

	it("renders a link back to the login page", () => {
		renderWithIntl(<ForgotPasswordForm />);
		expect(screen.getByRole("link", { name: /go back/i })).toHaveAttribute(
			"href",
			"/auth/login"
		);
	});

	it("shows the success card after submitting a valid email", async () => {
		mockForgotPasswordAction.mockResolvedValueOnce({ error: null });

		const user = userEvent.setup();
		renderWithIntl(<ForgotPasswordForm />);

		await user.type(screen.getByLabelText("Email Address"), "user@example.com");
		await user.click(screen.getByRole("button", { name: /reset password/i }));

		await waitFor(() => {
			expect(screen.getByText(/check your email/i)).toBeInTheDocument();
		});
	});

	it("shows a destructive alert when the action fails", async () => {
		mockForgotPasswordAction.mockResolvedValueOnce({
			error: "Rate limit exceeded",
		});

		const user = userEvent.setup();
		renderWithIntl(<ForgotPasswordForm />);

		await user.type(screen.getByLabelText("Email Address"), "user@example.com");
		await user.click(screen.getByRole("button", { name: /reset password/i }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Rate limit exceeded"
			);
		});
	});
});
