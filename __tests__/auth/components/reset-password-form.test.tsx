import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../test-utils";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockResetPasswordAction = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({
	Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("@/app/[locale]/auth/reset-password/action", () => ({
	resetPasswordAction: mockResetPasswordAction,
}));

// ── Tests ────────────────────────────────────────────────────────────────────

import { ResetPasswordForm } from "@/app/[locale]/auth/reset-password/reset-password-form";

describe("ResetPasswordForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page title and both password fields", () => {
		renderWithIntl(<ResetPasswordForm />);
		expect(screen.getByText("Set New Password")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
		expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
	});

	it("renders the submit button", () => {
		renderWithIntl(<ResetPasswordForm />);
		expect(
			screen.getByRole("button", { name: /update password/i })
		).toBeInTheDocument();
	});

	it("blocks submission while passwords do not match", async () => {
		// The form disables the submit button on mismatch (instead of showing
		// an alert after submit), so submission can never fire.
		const user = userEvent.setup();
		renderWithIntl(<ResetPasswordForm />);

		await user.type(screen.getByLabelText("Password"), "Password1");
		await user.type(screen.getByLabelText("Confirm Password"), "Different1");

		const submit = screen.getByRole("button", { name: /update password/i });
		expect(submit).toBeDisabled();

		await user.click(submit);
		expect(mockResetPasswordAction).not.toHaveBeenCalled();
	});

	it("shows the success card after a successful password reset", async () => {
		mockResetPasswordAction.mockResolvedValueOnce({ error: null });

		const user = userEvent.setup();
		renderWithIntl(<ResetPasswordForm />);

		await user.type(screen.getByLabelText("Password"), "Password1");
		await user.type(screen.getByLabelText("Confirm Password"), "Password1");
		await user.click(screen.getByRole("button", { name: /update password/i }));

		await waitFor(() => {
			expect(screen.getByText(/password updated/i)).toBeInTheDocument();
		});
	});

	it("shows a destructive alert when the action fails", async () => {
		mockResetPasswordAction.mockResolvedValueOnce({
			error: "Auth session missing!",
		});

		const user = userEvent.setup();
		renderWithIntl(<ResetPasswordForm />);

		await user.type(screen.getByLabelText("Password"), "Password1");
		await user.type(screen.getByLabelText("Confirm Password"), "Password1");
		await user.click(screen.getByRole("button", { name: /update password/i }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Auth session missing!"
			);
		});
	});
});
