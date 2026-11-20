"use client";

import { useTranslations } from "next-intl";

const CHIP_ITEMS = [
	{ key: "courses", href: "#school-courses" },
	{ key: "schoolBooks", href: "#school-books" },
	{ key: "generalBooks", href: "#general-books" },
	{ key: "decks", href: "#flashcards" },
	{ key: "kankorForms", href: "#kankor-forms" },
] as const;

/**
 * EduLe template category pill row — quick anchor navigation across the
 * home page shelves, styled like the template's course-category tabs.
 */
export function ShelfChips() {
	const t = useTranslations("landing.shelves");

	return (
		<div
			className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-700/10 bg-[#eef7f0] p-2.5 dark:border-white/10 dark:bg-white/5"
			data-testid="home-shelf-chips"
		>
			{CHIP_ITEMS.map(({ key, href }) => (
				<a
					key={key}
					href={href}
					className="inline-flex min-h-9 items-center rounded-full border border-emerald-700/20 bg-white px-4 text-[12px] font-bold text-emerald-900 transition hover:border-edule-green hover:bg-edule-green hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-emerald-200 dark:hover:border-edule-green dark:hover:bg-edule-green dark:hover:text-white"
				>
					{t(`${key}.title`)}
				</a>
			))}
		</div>
	);
}
