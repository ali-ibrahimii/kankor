import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { GradeForm } from "../../src/components/blocks/grades/grade-form";
import en from "../../src/messages/en.json";

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		from: () => ({
			select: () => ({
				order: () => Promise.resolve({ data: [], error: null }),
			}),
		}),
	}),
}));

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

function renderWithProviders(ui: React.ReactElement) {
	return render(
		<NextIntlClientProvider locale="en" messages={en}>
			<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
		</NextIntlClientProvider>
	);
}

describe("GradeForm", () => {
	it("renders grade form elements", () => {
		renderWithProviders(<GradeForm onSubmit={async () => {}} />);
		expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/ordering/i)).toBeInTheDocument();
	});
});
