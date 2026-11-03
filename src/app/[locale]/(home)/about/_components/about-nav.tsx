"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sections = [
	{ id: "story", key: "story" },
	{ id: "mission", key: "mission" },
	{ id: "features", key: "features" },
	{ id: "audience", key: "audience" },
	{ id: "values", key: "values" },
	{ id: "faq", key: "faq" },
	{ id: "demo", key: "video" },
	{ id: "team", key: "team" },
	{ id: "contact", key: "contact" },
] as const;

/**
 * Sticky in-page navigation for the About page. Highlights the section that is
 * currently in view so long-form content stays easy to scan.
 */
export function AboutNav() {
	const t = useTranslations("aboutUs.nav");
	const [active, setActive] = useState<string>(sections[0].id);

	useEffect(() => {
		const elements = sections
			.map((section) => document.getElementById(section.id))
			.filter((element): element is HTMLElement => Boolean(element));

		if (elements.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

				if (visible?.target.id) setActive(visible.target.id);
			},
			{ rootMargin: "-40% 0px -50% 0px", threshold: [0.05, 0.25, 0.5] }
		);

		for (const element of elements) observer.observe(element);

		return () => observer.disconnect();
	}, []);

	return (
		<nav
			aria-label={t("label")}
			className="sticky top-[58px] z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl lg:top-[72px]"
		>
			<div className="mx-auto flex max-w-[1160px] items-center gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
				<span className="me-1 hidden shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground sm:block">
					{t("label")}
				</span>

				{sections.map((section) => {
					const isActive = active === section.id;
					return (
						<a
							key={section.id}
							href={`#${section.id}`}
							aria-current={isActive ? "true" : undefined}
							className={cn(
								"shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors",
								isActive
									? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							)}
						>
							{t(section.key)}
						</a>
					);
				})}
			</div>
		</nav>
	);
}
