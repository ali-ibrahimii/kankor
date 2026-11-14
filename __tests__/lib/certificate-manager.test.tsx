import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import faMessages from "@/messages/fa.json";

const mocks = vi.hoisted(() => ({
	getCourseCertificateAdmin: vi.fn(),
	setCourseCertificateEnabled: vi.fn(),
	setCertificateRevoked: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock("@/lib/certificates/actions", () => ({
	getCourseCertificateAdmin: mocks.getCourseCertificateAdmin,
	setCourseCertificateEnabled: mocks.setCourseCertificateEnabled,
	setCertificateRevoked: mocks.setCertificateRevoked,
}));

vi.mock("sonner", () => ({
	toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import { CertificateManager } from "@/components/blocks/course/certificate-manager";

const withIntl = (node: ReactNode) => (
	<NextIntlClientProvider locale="fa" messages={faMessages}>
		{node}
	</NextIntlClientProvider>
);

const READY_STATE = {
	success: true as const,
	data: {
		enabled: true,
		certificates: [
			{
				id: "cert-1",
				userFullName: "حسین احمدی",
				issuedAt: "2026-11-01T00:00:00.000Z",
				verificationCode: "ABCDEF1234567890",
				revokedAt: null,
			},
			{
				id: "cert-2",
				userFullName: "Sara Noori",
				issuedAt: "2026-11-02T00:00:00.000Z",
				verificationCode: "1234567890ABCDEF",
				revokedAt: "2026-11-05T00:00:00.000Z",
			},
		],
	},
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("CertificateManager — per-course certificate control", () => {
	it("renders the toggle state and the issued certificates", async () => {
		mocks.getCourseCertificateAdmin.mockResolvedValue(READY_STATE);
		render(withIntl(<CertificateManager courseId="course-1" />));

		await screen.findByText("حسین احمدی");
		expect(screen.getByRole("switch")).toBeChecked();
		expect(screen.getByText("ABCDEF1234567890")).toBeTruthy();
		expect(screen.getByText("Sara Noori")).toBeTruthy();
		// Revoked row offers restore, active row offers revoke.
		expect(screen.getAllByRole("button", { name: /لغو/ }).length).toBe(1);
		expect(screen.getAllByRole("button", { name: /بازگردانی/ }).length).toBe(1);
	});

	it("toggles certificate issuance and confirms with a localized toast", async () => {
		mocks.getCourseCertificateAdmin.mockResolvedValue(READY_STATE);
		mocks.setCourseCertificateEnabled.mockResolvedValue({
			success: true,
			data: { enabled: false },
		});
		render(withIntl(<CertificateManager courseId="course-1" />));
		await screen.findByText("حسین احمدی");

		fireEvent.click(screen.getByRole("switch"));
		await waitFor(() =>
			expect(mocks.setCourseCertificateEnabled).toHaveBeenCalledWith({
				courseId: "course-1",
				enabled: false,
			})
		);
		await waitFor(() =>
			expect(mocks.toastSuccess).toHaveBeenCalledWith(
				faMessages.certificates.manage.disabledToast
			)
		);
	});

	it("shows a localized error (never raw server text) when the toggle fails", async () => {
		mocks.getCourseCertificateAdmin.mockResolvedValue(READY_STATE);
		mocks.setCourseCertificateEnabled.mockResolvedValue({
			success: false,
			error: "duplicate key value violates unique constraint",
		});
		render(withIntl(<CertificateManager courseId="course-1" />));
		await screen.findByText("حسین احمدی");

		fireEvent.click(screen.getByRole("switch"));
		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				faMessages.certificates.manage.saveFailed
			)
		);
		expect(mocks.toastError.mock.calls.flat().join(" ")).not.toMatch(
			/duplicate key|unique constraint/
		);
	});

	it("revokes a certificate through the action", async () => {
		mocks.getCourseCertificateAdmin.mockResolvedValue(READY_STATE);
		mocks.setCertificateRevoked.mockResolvedValue({
			success: true,
			data: { revoked: true },
		});
		render(withIntl(<CertificateManager courseId="course-1" />));
		await screen.findByText("حسین احمدی");

		fireEvent.click(
			screen.getAllByRole("button", { name: /لغو/ })[0] as HTMLElement
		);
		await waitFor(() =>
			expect(mocks.setCertificateRevoked).toHaveBeenCalledWith({
				certificateId: "cert-1",
				revoked: true,
			})
		);
	});

	it("shows a localized load error with retry", async () => {
		mocks.getCourseCertificateAdmin.mockResolvedValue({
			success: false,
			error: "database",
		});
		render(withIntl(<CertificateManager courseId="course-1" />));

		await screen.findByText(faMessages.certificates.manage.loadError);
		mocks.getCourseCertificateAdmin.mockResolvedValue(READY_STATE);
		fireEvent.click(
			screen.getByRole("button", {
				name: faMessages.certificates.manage.retry,
			})
		);
		await screen.findByText("حسین احمدی");
	});
});
