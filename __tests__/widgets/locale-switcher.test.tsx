import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import enMessages from "@/messages/en.json";

const mockReplace = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-breakpoint", () => ({
	useResponsive: () => "group",
}));

vi.mock("@/i18n/navigation", () => ({
	usePathname: () => "/courses",
	useRouter: () => ({ replace: mockReplace }),
	Link: ({ href, children }: { href: string; children: ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("@/providers/auth.provider", () => ({
	useIsAuthenticated: () => false,
}));

import { LocaleSwitcher } from "@/components/widgets/locale-switcher";

describe("LocaleSwitcher", () => {
	it("renders an accessible segmented language control and navigates to the selected locale", () => {
		render(
			<NextIntlClientProvider locale="en" messages={enMessages}>
				<LocaleSwitcher type="group" responsive={false} />
			</NextIntlClientProvider>
		);

		expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);

		fireEvent.click(screen.getByRole("button", { name: "دری" }));
		expect(mockReplace).toHaveBeenCalledWith("/courses", { locale: "fa" });
	});
});
