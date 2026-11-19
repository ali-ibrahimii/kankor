"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, HelpCircle, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { Locale } from "@/i18n";
import { isRtl } from "@/i18n/routing";
import { ABOUT_TONES, useAboutMotion } from "./about-motion";

interface FaqItem {
	question: string;
	answer: string;
}

export function AboutFaqSection() {
	const t = useTranslations("aboutUs");
	const locale = useLocale();
	const aboutMotion = useAboutMotion();
	const Arrow = isRtl(locale as Locale) ? ArrowLeft : ArrowRight;

	const raw = t.raw("faq.items");
	const items: FaqItem[] = Array.isArray(raw) ? raw : [];

	if (items.length === 0) return null;

	const numberFormatter = new Intl.NumberFormat(locale, {
		minimumIntegerDigits: 2,
	});

	return (
		<motion.section
			id="faq"
			className="scroll-mt-32 border-y border-[#e9eaf2] bg-white/75 py-16 sm:py-20 lg:scroll-mt-36 lg:py-24 dark:border-white/10 dark:bg-[#1b2438]/60"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto grid max-w-[1320px] items-start gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14 lg:px-8">
				{/* Sticky Header & Support Card */}
				<div className="lg:sticky lg:top-36">
					<span className="section-kicker">
						<HelpCircle className="size-3.5" />
						{t("faq.badge")}
					</span>
					<h2 className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-[#19243b] sm:text-3xl lg:text-4xl dark:text-slate-100">
						{t("faq.title")}
					</h2>
					<p className="mt-3 text-sm leading-8 text-slate-500 sm:text-base dark:text-slate-400">
						{t("faq.subtitle")}
					</p>

					<div className="soft-card mt-7 border-[#e5e8f3] bg-white p-6 dark:border-white/10 dark:bg-[#161f33]">
						<div className="flex items-start gap-3.5">
							<span
								className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${ABOUT_TONES.violet.icon}`}
							>
								<MessageCircle className="size-5" />
							</span>
							<div className="min-w-0">
								<p className="text-sm font-extrabold text-[#19243b] sm:text-base dark:text-slate-100">
									{t("faq.moreTitle")}
								</p>
								<p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
									{t("contact.responseTime")}
								</p>
							</div>
						</div>

						<a
							href="#contact"
							className="button-primary mt-5 w-full justify-between px-5 py-3 text-xs sm:text-sm"
						>
							<span>{t("faq.moreCta")}</span>
							<Arrow className="size-4" />
						</a>
					</div>
				</div>

				{/* Accordion Panel */}
				<Accordion
					type="single"
					collapsible
					className="soft-card divide-y divide-slate-100 overflow-hidden border-[#e5e8f3] bg-white px-5 sm:px-7 dark:divide-white/[.08] dark:border-white/10 dark:bg-[#161f33]"
				>
					{items.map((item, idx) => (
						<AccordionItem
							key={item.question}
							value={`faq-${idx}`}
							className="border-0"
						>
							<AccordionTrigger className="gap-3.5 py-5 text-start text-sm font-extrabold leading-7 text-[#19243b] hover:no-underline hover:text-primary sm:py-6 sm:text-base dark:text-slate-100 dark:hover:text-violet-300">
								<span className="flex min-w-0 items-center gap-3.5">
									<span
										aria-hidden="true"
										className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f3f0ff] text-[11px] font-black text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200"
									>
										{numberFormatter.format(idx + 1)}
									</span>
									<span>{item.question}</span>
								</span>
							</AccordionTrigger>
							<AccordionContent className="ps-10 pb-6 text-sm leading-8 text-slate-600 dark:text-slate-300">
								{item.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</motion.section>
	);
}
