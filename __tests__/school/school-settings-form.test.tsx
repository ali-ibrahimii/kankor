import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SchoolSettingsForm } from "@/components/blocks/school/school-settings-form";
import en from "@/messages/en.json";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockUpdateSchoolSettings = vi.hoisted(() => vi.fn());
vi.mock("@/components/blocks/school/school-settings-actions", () => ({
	updateSchoolSettings: mockUpdateSchoolSettings,
}));

const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({
	toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		from: () => ({
			select: () => ({
				order: () =>
					Promise.resolve({
						data: [{ id: "p1", name: "Kabul" }],
						error: null,
					}),
			}),
		}),
	}),
}));

function renderForm() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<NextIntlClientProvider locale="en" messages={en}>
			<QueryClientProvider client={queryClient}>
				<SchoolSettingsForm
					schoolId="school-1"
					initialValues={{
						name: "Naderia High School",
						address: "District 4, Kabul",
						provinceId: "p1",
						adminEmail: "admin@school.edu",
					}}
				/>
			</QueryClientProvider>
		</NextIntlClientProvider>
	);
}

beforeEach(() => {
	mockUpdateSchoolSettings.mockReset();
	mockToastSuccess.mockReset();
	mockToastError.mockReset();
	vi.spyOn(console, "error").mockImplementation(() => {});
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("SchoolSettingsForm", () => {
	it("saves the school settings through the server action", async () => {
		mockUpdateSchoolSettings.mockResolvedValue({
			success: true,
			data: undefined,
		});
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() =>
			expect(mockUpdateSchoolSettings).toHaveBeenCalledWith(
				"school-1",
				expect.objectContaining({
					name: "Naderia High School",
					provinceId: "p1",
				})
			)
		);
		expect(mockToastSuccess).toHaveBeenCalledWith(
			en.schoolSettings.saveSuccess
		);
	});

	it("shows a localized error toast — never the raw server error", async () => {
		mockUpdateSchoolSettings.mockResolvedValue({
			success: false,
			error: "permission denied for table schools",
		});
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1));
		// The toast carries the localized message…
		expect(mockToastError).toHaveBeenCalledWith(en.schoolSettings.saveError);
		// …and never leaks the raw English server error.
		expect(mockToastError.mock.calls[0].join(" ")).not.toMatch(
			/permission denied/i
		);
	});
});
