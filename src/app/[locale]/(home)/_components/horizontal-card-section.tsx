"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import type * as React from "react";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type HorizontalCardSectionProps = {
	id: string;
	title: string;
	subtitle?: string;
	viewMoreHref: string;
	viewMoreLabel: string;
	children: React.ReactNode;
	surface?: "default" | "tinted";
	/** EduLe template extras shown on the header row (search pill). */
	searchSlot?: React.ReactNode;
	/** EduLe template category chips rendered under the header. */
	chipsSlot?: React.ReactNode;
};

/**
 * Horizontal scrolling category shelf used on the public Home page.
 * EduLe green template skin: accent underline under the title, mint
 * "View More" pill, optional search pill + category chips.
 */
export function HorizontalCardSection({
	id,
	title,
	subtitle,
	viewMoreHref,
	viewMoreLabel,
	children,
	surface = "default",
	searchSlot,
	chipsSlot,
}: HorizontalCardSectionProps) {
	const locale = useLocale();
	const rtl = isRtl(locale);
	const Arrow = rtl ? ArrowLeft : ArrowRight;

	return (
		<section
			id={id}
			data-testid={`home-section-${id}`}
			className={cn(
				"home-shelf scroll-mt-24 py-8 sm:py-11",
				surface === "tinted" &&
					"border-y border-[#e8eeea] bg-[#faf6ee] dark:border-white/10 dark:bg-[#3b2621]/65"
			)}
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* EduLe Section Header + "دیدن بیشتر" pill + search */}
				<div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
					<div className="min-w-0 max-w-2xl">
						<h2 className="relative inline-block text-lg font-black tracking-tight text-[#3b2621] sm:text-2xl dark:text-slate-100">
							{title}

							<span
								aria-hidden="true"
								className="absolute -bottom-1.5 start-0 h-[3px] w-14 rounded-full bg-edule-green/80"
							/>
						</h2>

						{subtitle && (
							<p className="mt-2.5 text-xs leading-5.5 text-slate-500 sm:text-[13px] dark:text-slate-400">
								{subtitle}
							</p>
						)}
					</div>

					<div className="flex shrink-0 flex-wrap items-center gap-3">
						{searchSlot}

						<Link
							href={viewMoreHref}
							className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-800 transition hover:bg-edule-green hover:text-white dark:border-emerald-400/30 dark:bg-white/5 dark:text-emerald-300 dark:hover:bg-edule-green dark:hover:text-white"
						>
							<span>{viewMoreLabel}</span>

							<Arrow className="size-3.5" />
						</Link>
					</div>
				</div>

				{/* EduLe category chips */}
				{chipsSlot}

				{/* Horizontal Card Track */}
				<div
					data-testid={`home-row-${id}`}
					className={cn(
						id === "school-courses"
							? "course-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
							: "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-2 lg:px-2 [&::-webkit-scrollbar]:hidden"
					)}
				>
					{children}
				</div>
			</div>
		</section>
	);
}
