import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// A deployment without Supabase credentials (the public site / demo) must not
// instantiate a browser Supabase client or hit the network, and the provider
// must settle on "unauthenticated" instead of hanging in "loading".
const createClient = vi.hoisted(() =>
	vi.fn(() => {
		throw new Error("createClient must not run without credentials");
	})
);

vi.mock("@/lib/env/client-env", () => ({ isSupabaseConfigured: false }));
vi.mock("@/lib/supabase/client", () => ({ createClient }));
vi.mock("@/lib/auth/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next-intl", () => ({ useLocale: () => "fa" }));

import { AuthProvider, useAuth } from "@/providers/auth.provider";

function Probe() {
	const auth = useAuth();
	return (
		<span data-testid="state">
			{auth.isLoading ? "loading" : auth.isAuthenticated ? "in" : "out"}
		</span>
	);
}

describe("AuthProvider without Supabase credentials", () => {
	it("does not create a Supabase client", () => {
		render(
			<AuthProvider>
				<Probe />
			</AuthProvider>
		);

		expect(createClient).not.toHaveBeenCalled();
	});

	it("settles on unauthenticated without a session check", async () => {
		render(
			<AuthProvider>
				<Probe />
			</AuthProvider>
		);

		await waitFor(() =>
			expect(screen.getByTestId("state")).toHaveTextContent("out")
		);
		expect(screen.getByTestId("state")).not.toHaveTextContent("loading");
	});

	it("exposes a locale-prefixed fallback dashboard path", async () => {
		function PathProbe() {
			return <span data-testid="path">{useAuth().dashboardPath}</span>;
		}

		render(
			<AuthProvider>
				<PathProbe />
			</AuthProvider>
		);

		expect(screen.getByTestId("path")).toHaveTextContent("/fa");
	});
});
