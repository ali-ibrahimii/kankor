import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { SchoolHeaderClient } from "../../src/components/blocks/school/school-header-client";
import { SidebarProvider } from "../../src/components/ui/sidebar";
import en from "../../src/messages/en.json";

vi.stubGlobal(
	"matchMedia",
	vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}))
);

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		from: () => ({
			select: () => ({
				eq: () => Promise.resolve({ data: [], error: null }),
			}),
		}),
	}),
}));

vi.mock("@/i18n/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
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
			<QueryClientProvider client={queryClient}>
				<SidebarProvider>{ui}</SidebarProvider>
			</QueryClientProvider>
		</NextIntlClientProvider>
	);
}

describe("SchoolHeaderClient", () => {
	it("renders sidebar switcher trigger button", () => {
		renderWithProviders(
			<SchoolHeaderClient schoolId="test-id" userId="user-id" locale="en" />
		);
		expect(screen.getByRole("button")).toBeInTheDocument();
	});
});
