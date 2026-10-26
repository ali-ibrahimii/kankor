import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fa from "@/messages/fa.json";
import { AboutAudienceSection } from "./about-audience-section";
import { AboutFaqSection } from "./about-faq-section";
import { AboutStorySection } from "./about-story-section";

vi.mock("@/i18n/navigation", () => ({
	Link: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
	usePathname: () => "/about",
	useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function renderFa(ui: ReactNode) {
	return render(
		<NextIntlClientProvider locale="fa" messages={fa}>
			{ui}
		</NextIntlClientProvider>
	);
}

describe("About page sections", () => {
	beforeEach(() => {
		if (typeof globalThis.IntersectionObserver === "undefined") {
			globalThis.IntersectionObserver = class IntersectionObserver {
				observe() {}
				unobserve() {}
				disconnect() {}
			} as unknown as typeof IntersectionObserver;
		}
	});

	it("renders the story timeline from translations", () => {
		renderFa(<AboutStorySection />);

		expect(screen.getByText(fa.aboutUs.story.title)).toBeTruthy();
		for (const item of fa.aboutUs.story.items) {
			expect(screen.getByText(item.title)).toBeTruthy();
		}
	});

	it("links each audience card to the matching signup flow", () => {
		renderFa(<AboutAudienceSection />);

		expect(
			screen.getByRole("link", { name: fa.aboutUs.audience.students.cta })
		).toHaveAttribute("href", "/auth/signup?type=student");
		expect(
			screen.getByRole("link", { name: fa.aboutUs.audience.instructors.cta })
		).toHaveAttribute("href", "/auth/signup?type=instructor");
		expect(
			screen.getByRole("link", { name: fa.aboutUs.audience.schools.cta })
		).toHaveAttribute("href", "/auth/signup?type=school");
	});

	it("renders every FAQ question and expands the answer on demand", () => {
		renderFa(<AboutFaqSection />);

		expect(screen.getByText(fa.aboutUs.faq.title)).toBeTruthy();
		expect(
			screen.getAllByRole("button", { name: /ابزار کانکور چیست/ }).length
		).toBeGreaterThan(0);

		fireEvent.click(screen.getByRole("button", { name: /ابزار کانکور چیست/ }));

		expect(screen.getByText(fa.aboutUs.faq.items[0].answer)).toBeTruthy();
	});
});
