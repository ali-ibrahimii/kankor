import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarBrand } from "@/components/blocks/sidebar/sidebar-brand";
import { SidebarProvider } from "@/components/ui/sidebar";

// SidebarProvider reads the mobile breakpoint through matchMedia.
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

// SidebarBrand must stay a client component: the sidebar's Slot-based `asChild`
// cannot clone children authored by a Server Component (they cross the RSC
// boundary as lazy references and the Slot throws "Slot failed to slot onto its
// children"). This test locks the anchor markup and its link target in place.
vi.mock("@/i18n/navigation", () => ({
	Link: ({ href, children, ...props }: React.ComponentProps<"a">) => (
		<a href={href as string} {...props}>
			{children}
		</a>
	),
}));

function renderBrand(props: React.ComponentProps<typeof SidebarBrand>) {
	return render(
		<SidebarProvider>
			<SidebarBrand {...props} />
		</SidebarProvider>
	);
}

describe("SidebarBrand", () => {
	it("renders a single anchor with the sidebar button styling", () => {
		renderBrand({ name: "Abzar Kankor", subtitle: "Student" });

		const link = screen.getByRole("link", { name: /Abzar Kankor/ });
		expect(link.tagName).toBe("A");
		expect(link).toHaveAttribute("href", "/");
		expect(link).toHaveAttribute("data-slot", "sidebar-menu-button");
		expect(link).toHaveAttribute("data-size", "lg");
		expect(link.className).toContain("rounded-2xl");
		expect(screen.getByText("Student")).toBeInTheDocument();
	});

	it("honours a custom dashboard root", () => {
		renderBrand({ name: "Abzar Kankor", href: "/fa/demo?role=admin" });

		expect(screen.getByRole("link")).toHaveAttribute(
			"href",
			"/fa/demo?role=admin"
		);
	});
});
