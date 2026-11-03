import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import enMessages from "@/messages/en.json";

const mockReplace = vi.hoisted(() => vi.fn());

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

function renderSwitcher() {
	return render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<LocaleSwitcher />
		</NextIntlClientProvider>
	);
}

describe("LocaleSwitcher", () => {
	beforeEach(() => {
		mockReplace.mockReset();
	});

	it("shows the active language on a compact trigger and marks the current option", () => {
		renderSwitcher();

		const trigger = screen.getByRole("button", { name: /Language: English/ });
		expect(trigger).toHaveAttribute("aria-expanded", "false");

		fireEvent.click(trigger);

		const listbox = screen.getByRole("listbox", { name: "Language" });
		expect(listbox).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "English" })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		expect(screen.getByRole("option", { name: "دری" })).toHaveAttribute(
			"aria-selected",
			"false"
		);
	});

	it("navigates to the selected locale and keeps the current path", () => {
		renderSwitcher();

		fireEvent.click(screen.getByRole("button", { name: /Language: English/ }));
		fireEvent.click(screen.getByRole("option", { name: "دری" }));

		expect(mockReplace).toHaveBeenCalledWith("/courses", { locale: "fa" });
	});
});
