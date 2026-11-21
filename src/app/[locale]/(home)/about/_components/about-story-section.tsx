"use client";

import { motion } from "framer-motion";
import {
	Compass,
	GraduationCap,
	Lightbulb,
	Smartphone,
	Users2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ABOUT_TONE_CYCLE, ABOUT_TONES, useAboutMotion } from "./about-motion";

interface StoryItem {
	year: string;
	title: string;
	description: string;
}

const MILESTONE_ICONS = [Lightbulb, Smartphone, GraduationCap, Users2] as const;

export function AboutStorySection() {
	const t = useTranslations("aboutUs");
	const locale = useLocale();
	const aboutMotion = useAboutMotion();
	const raw = t.raw("story.items");
	const items: StoryItem[] = Array.isArray(raw) ? raw : [];

	if (items.length === 0) return null;

	const numberFormatter = new Intl.NumberFormat(locale, {
		minimumIntegerDigits: 2,
	});

	return (
		<motion.section
			id="story"
			className="scroll-mt-32 py-16 sm:py-20 lg:scroll-mt-36 lg:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="max-w-2xl">
					<span className="section-kicker">
						<Compass className="size-3.5" />
						{t("story.badge")}
					</span>
					<h2 className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-[#3b2621] sm:text-3xl lg:text-4xl dark:text-slate-100">
						{t("story.title")}
					</h2>
					<p className="mt-3 text-sm leading-8 text-slate-500 sm:text-base dark:text-slate-400">
						{t("story.subtitle")}
					</p>
				</div>

				{/* Connected 4-Milestone Timeline */}
				<div className="relative mt-11 sm:mt-14">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-10 top-[52px] hidden h-px bg-linear-to-r from-[#02656b]/25 via-[#02656b]/25 to-[#dc7030]/25 lg:block dark:from-violet-400/20 dark:via-emerald-400/20 dark:to-amber-400/20"
					/>

					<motion.ol
						className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
						variants={aboutMotion.stagger}
						initial="hidden"
						whileInView="show"
						viewport={aboutMotion.viewport}
					>
						{items.map((item, idx) => {
							const Icon = MILESTONE_ICONS[idx % MILESTONE_ICONS.length];
							const tone =
								ABOUT_TONES[ABOUT_TONE_CYCLE[idx % ABOUT_TONE_CYCLE.length]];

							return (
								<motion.li
									key={`${item.year}-${item.title}`}
									variants={aboutMotion.card}
									className="soft-card card-hover group relative flex flex-col overflow-hidden border-[#e8eeea] bg-white p-6 sm:p-7 dark:border-white/10 dark:bg-[#3b2621]"
								>
									{/* Top Accent Strip */}
									<div
										aria-hidden="true"
										className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${tone.bar} opacity-75 transition-opacity group-hover:opacity-100`}
									/>

									<div className="flex items-center justify-between gap-3">
										<div
											className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}
										>
											<Icon className="size-5" />
										</div>

										<span
											className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${tone.badge}`}
										>
											<span
												aria-hidden="true"
												className={`size-1.5 rounded-full ${tone.dot}`}
											/>
											{item.year}
										</span>
									</div>

									<h3 className="mt-6 text-lg font-extrabold leading-snug text-[#3b2621] dark:text-slate-100">
										{item.title}
									</h3>

									<p className="mt-2.5 flex-1 text-sm leading-7 text-slate-500 dark:text-slate-400">
										{item.description}
									</p>

									<div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-[11px] font-bold text-slate-400 dark:border-white/[.07] dark:text-slate-500">
										<span>{numberFormatter.format(idx + 1)}</span>
										<span className="h-1 w-8 rounded-full bg-slate-100 transition-colors group-hover:bg-primary/25 dark:bg-white/10 dark:group-hover:bg-primary/40" />
									</div>
								</motion.li>
							);
						})}
					</motion.ol>
				</div>
			</div>
		</motion.section>
	);
}
