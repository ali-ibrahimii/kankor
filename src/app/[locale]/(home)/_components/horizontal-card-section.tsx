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
};

/**
 * Horizontal scrolling category shelf used on the public Home page.
 * Keeps a clean header with only the "View More" ("دیدن بیشتر") link and
 * smooth native horizontal scroll without cluttering arrow buttons.
 */
export function HorizontalCardSection({
	id,
	title,
	subtitle,
	viewMoreHref,
	viewMoreLabel,
	children,
	surface = "default",
}: HorizontalCardSectionProps) {
	const locale = useLocale();
	const rtl = isRtl(locale);
	const Arrow = rtl ? ArrowLeft : ArrowRight;

	return (
		<section
			id={id}
			data-testid={`home-section-${id}`}
			className={cn(
				"scroll-mt-24 py-8 sm:py-11",
				surface === "tinted" &&
					"border-y border-[#e9eaf2] bg-white/75 dark:border-white/10 dark:bg-[#1b2438]/65"
			)}
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* Clean Section Header + Single "دیدن بیشتر" Link */}
				<div className="mb-5 flex items-end justify-between gap-4">
					<div className="min-w-0 max-w-2xl">
						<h2 className="text-lg font-black tracking-tight text-[#19243b] sm:text-2xl dark:text-slate-100">
							{title}
						</h2>

						{subtitle && (
							<p className="mt-1 text-xs leading-5.5 text-slate-500 sm:text-[13px] dark:text-slate-400">
								{subtitle}
							</p>
						)}
					</div>

					<Link
						href={viewMoreHref}
						className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary/8 px-3.5 py-2 text-xs font-extrabold text-primary transition hover:bg-primary hover:text-primary-foreground"
					>
						<span>{viewMoreLabel}</span>
						<Arrow className="size-3.5" />
					</Link>
				</div>

				{/* Horizontal Card Track */}
				<div
					data-testid={`home-row-${id}`}
					className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-2 lg:px-2 [&::-webkit-scrollbar]:hidden"
				>
					{children}
				</div>
			</div>
		</section>
	);
}
