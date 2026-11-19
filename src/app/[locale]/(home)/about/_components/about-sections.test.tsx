import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fa from "@/messages/fa.json";
import { AboutAudienceSection } from "./about-audience-section";
import { AboutFaqSection } from "./about-faq-section";
import { AboutHeroSection } from "./about-hero-section";
import { AboutStorySection } from "./about-story-section";
import { AboutTeamSection } from "./about-team-section";
import { AboutVideoSection } from "./about-videoDemo-section";

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

	it("renders hero CTA, demo anchor, and certificate verification preview", () => {
		renderFa(<AboutHeroSection isRtl />);

		expect(screen.getByText(fa.aboutUs.hero.badge)).toBeTruthy();
		expect(
			screen.getByRole("link", { name: fa.aboutUs.hero.cta.primary })
		).toHaveAttribute("href", "/courses");
		expect(
			screen.getByRole("link", { name: fa.aboutUs.hero.cta.secondary })
		).toHaveAttribute("href", "#demo");
		expect(screen.getByRole("progressbar")).toHaveAttribute(
			"aria-valuenow",
			"76"
		);
	});

	it("renders the story timeline from translations", () => {
		renderFa(<AboutStorySection />);

		expect(screen.getByText(fa.aboutUs.story.title)).toBeTruthy();
		for (const item of fa.aboutUs.story.items) {
			expect(screen.getByText(item.title)).toBeTruthy();
			expect(screen.getByText(item.year)).toBeTruthy();
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

	it("renders all team members safely and toggles full bio on demand", () => {
		renderFa(<AboutTeamSection />);

		for (const member of fa.aboutUs.team.members) {
			expect(screen.getByText(member.name)).toBeTruthy();
			expect(screen.getByText(member.role)).toBeTruthy();
		}

		// Legacy non-existent /img/team/4.jpg falls back to monogram instead of broken img
		const fourth = fa.aboutUs.team.members[3];
		expect(screen.queryByRole("img", { name: fourth.name })).toBeNull();

		const first = fa.aboutUs.team.members[0];
		const toggle = screen.getByRole("button", { name: first.name });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByText(first.fullBio)).toBeTruthy();
	});

	it("opens and closes the demo video player", () => {
		renderFa(
			<AboutVideoSection videoId="2REnqD3JLtQ" thumbnailUrl="/og-image.png" />
		);

		fireEvent.click(
			screen.getByRole("button", { name: fa.aboutUs.video.playButton })
		);
		expect(screen.getByTitle(fa.aboutUs.video.title)).toBeTruthy();

		fireEvent.click(
			screen.getByRole("button", { name: fa.aboutUs.video.closeButton })
		);
		expect(screen.queryByTitle(fa.aboutUs.video.title)).toBeNull();
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
