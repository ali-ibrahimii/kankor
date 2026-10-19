import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../../src/components/blocks/sidebar/app-sidebar";
import type { MenuGroup } from "../../src/components/blocks/sidebar/types";
import { SidebarProvider } from "../../src/components/ui/sidebar";
import en from "../../src/messages/en.json";

// Mock matchMedia
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

// Dynamic mock pathname and searchParams
let mockPathname = "/";
let mockSearchParamsVal = "";

vi.mock("@/i18n/navigation", () => ({
	usePathname: () => mockPathname,
	Link: ({ href, children, ...props }: any) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("next-intl", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next-intl")>();
	return {
		...actual,
		useLocale: () => "en",
	};
});

vi.mock("next/navigation", () => {
	return {
		useSearchParams: () => {
			return new URLSearchParams(mockSearchParamsVal);
		},
	};
});

// Mock UI DropdownMenu to render inline always for clean unit testing of active states
vi.mock("@/components/ui/dropdown-menu", () => {
	return {
		DropdownMenu: ({ children }: any) => (
			<div data-testid="dropdown-menu">{children}</div>
		),
		DropdownMenuTrigger: ({ children }: any) => (
			<div data-testid="dropdown-menu-trigger">{children}</div>
		),
		DropdownMenuContent: ({ children }: any) => (
			<div data-testid="dropdown-menu-content">{children}</div>
		),
		DropdownMenuItem: ({ children, className, asChild, ...props }: any) => (
			<div role="menuitem" className={className} {...props}>
				{children}
			</div>
		),
	};
});

const mockMenus: MenuGroup[] = [
	{
		order: 1,
		label: "Group Title",
		menus: [
			{
				label: "My Courses",
				href: "/d/instructor/courses",
				type: "dropdown",
				icon: <span>ParentIcon</span>,
				menus: [
					{
						label: "Published",
						href: "/d/instructor/courses?status=published",
					},
					{ label: "Drafts", href: "/d/instructor/courses?status=draft" },
					{ label: "Archived", href: "/d/instructor/courses?status=archived" },
				],
			},
		],
	},
];

function renderSidebar() {
	return render(
		<NextIntlClientProvider locale="en" messages={en}>
			<SidebarProvider>
				<AppSidebar menus={mockMenus} />
			</SidebarProvider>
		</NextIntlClientProvider>
	);
}

describe("AppSidebar - DropdownMenuParent Active Selection States with Query Parameters", () => {
	it("correctly identifies active state based on search query params", () => {
		// Mock being on the 'Published' tab
		mockPathname = "/d/instructor/courses";
		mockSearchParamsVal = "status=published";

		renderSidebar();

		// Parent should be active
		const parentButton = screen.getByRole("button", { name: /My Courses/i });
		expect(parentButton).toHaveAttribute("data-active", "true");

		const publishedItem = screen.getByRole("menuitem", { name: /Published/i });
		const draftsItem = screen.getByRole("menuitem", { name: /Drafts/i });
		const archivedItem = screen.getByRole("menuitem", { name: /Archived/i });

		// Exactly 'Published' should be selected
		expect(publishedItem.className).toContain("bg-accent");
		expect(publishedItem.className).toContain("text-accent-foreground");

		// Sibling items ('Drafts', 'Archived') should NOT be selected
		expect(draftsItem.className).not.toContain("bg-accent");
		expect(draftsItem.className).not.toContain("text-accent-foreground");
		expect(archivedItem.className).not.toContain("bg-accent");
		expect(archivedItem.className).not.toContain("text-accent-foreground");
	});
});
