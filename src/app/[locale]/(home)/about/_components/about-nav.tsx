"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SECTIONS = [
	{ id: "story", key: "story" },
	{ id: "mission", key: "mission" },
	{ id: "values", key: "values" },
	{ id: "features", key: "features" },
	{ id: "audience", key: "audience" },
	{ id: "demo", key: "video" },
	{ id: "team", key: "team" },
	{ id: "faq", key: "faq" },
	{ id: "contact", key: "contact" },
] as const;

export function AboutNav() {
	const t = useTranslations("aboutUs.nav");
	const [active, setActive] = useState<string>("story");
	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
			(el): el is HTMLElement => el !== null
		);
		if (elements.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible[0]) {
					setActive(visible[0].target.id);
				}
			},
			{
				rootMargin: "-140px 0px -55% 0px",
				threshold: [0, 0.2],
			}
		);

		for (const el of elements) observer.observe(el);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const container = listRef.current;
		if (!container) return;
		const activeLink = container.querySelector<HTMLAnchorElement>(
			`[data-section-id="${active}"]`
		);
		if (!activeLink || typeof container.scrollBy !== "function") return;
		const containerRect = container.getBoundingClientRect();
		const linkRect = activeLink.getBoundingClientRect();
		const delta =
			linkRect.left -
			containerRect.left -
			containerRect.width / 2 +
			linkRect.width / 2;
		container.scrollBy({ left: delta, behavior: "smooth" });
	}, [active]);

	return (
		<nav
			aria-label={t("label")}
			className="sticky top-[58px] z-30 border-y border-[#faf6ee] bg-[#faf6ee]/88 backdrop-blur-xl lg:top-[72px] dark:border-white/10 dark:bg-[#251c19]/88"
		>
			<div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
				<span className="hidden shrink-0 items-center gap-2 pe-3 border-e border-[#e8eeea] text-[11px] font-bold text-slate-400 md:inline-flex dark:border-white/10 dark:text-slate-500">
					<span className="size-1.5 rounded-full bg-primary" />
					{t("label")}
				</span>

				<ul
					ref={listRef}
					className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				>
					{SECTIONS.map((section) => {
						const isActive = active === section.id;
						return (
							<li key={section.id} className="shrink-0">
								<a
									href={`#${section.id}`}
									data-section-id={section.id}
									onClick={() => setActive(section.id)}
									aria-current={isActive ? "location" : undefined}
									className={cn(
										"inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
										isActive
											? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
											: "text-slate-600 hover:bg-primary/6 hover:text-[#3b2621] dark:text-slate-400 dark:hover:bg-white/[.06] dark:hover:text-slate-100"
									)}
								>
									{t(section.key)}
								</a>
							</li>
						);
					})}
				</ul>
			</div>
		</nav>
	);
}
