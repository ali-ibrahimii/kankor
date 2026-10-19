import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { LibraryForm } from "../../src/components/blocks/libraries/library-form";
import en from "../../src/messages/en.json";

// Mock Supabase client
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

describe("LibraryForm", () => {
	it("renders title field and save button", () => {
		renderWithProviders(<LibraryForm onSubmit={async () => {}} />);
		expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
	});
});
