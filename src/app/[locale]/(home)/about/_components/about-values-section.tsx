"use client";

import { motion } from "framer-motion";
import { Compass, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ABOUT_TONES, useAboutMotion } from "./about-motion";

export function AboutValuesSection() {
	const t = useTranslations("aboutUs");
	const locale = useLocale();
	const aboutMotion = useAboutMotion();

	const numberFormatter = new Intl.NumberFormat(locale, {
		minimumIntegerDigits: 2,
	});

	const values = [
		{
			key: "accessible",
			icon: Compass,
			title: t("values.accessible.title"),
			desc: t("values.accessible.desc"),
			tone: ABOUT_TONES.mint,
		},
		{
			key: "learner",
			icon: Heart,
			title: t("values.learner.title"),
			desc: t("values.learner.desc"),
			tone: ABOUT_TONES.violet,
		},
		{
			key: "quality",
			icon: ShieldCheck,
			title: t("values.quality.title"),
			desc: t("values.quality.desc"),
			tone: ABOUT_TONES.sky,
		},
	] as const;

	return (
		<motion.section
			id="values"
			className="scroll-mt-32 py-16 sm:py-20 lg:scroll-mt-36 lg:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="mx-auto max-w-2xl text-center">
					<span className="section-kicker">
						<Sparkles className="size-3.5" />
						{t("values.badge")}
					</span>
					<h2 className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-[#19243b] sm:text-3xl lg:text-4xl dark:text-slate-100">
						{t("values.title")}
					</h2>
					<p className="mt-3 text-sm leading-8 text-slate-500 sm:text-base dark:text-slate-400">
						{t("values.subtitle")}
					</p>
				</div>

				{/* 3 Principle Cards */}
				<motion.div
					className="mt-11 grid gap-5 md:grid-cols-3 lg:gap-6"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{values.map(({ key, icon: Icon, title, desc, tone }, idx) => (
						<motion.article
							key={key}
							variants={aboutMotion.card}
							className="soft-card card-hover group relative overflow-hidden border-[#e5e8f3] bg-white p-7 sm:p-8 dark:border-white/10 dark:bg-[#1b2438]"
						>
							<div
								aria-hidden="true"
								className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${tone.bar} opacity-80 transition-opacity group-hover:opacity-100`}
							/>

							<div className="flex items-start justify-between gap-4">
								<div
									className={`flex size-14 shrink-0 items-center justify-center rounded-[20px] ${tone.icon}`}
								>
									<Icon className="size-6" />
								</div>
								<span
									aria-hidden="true"
									className="text-2xl font-black tracking-tight text-slate-200 transition-colors group-hover:text-primary/25 dark:text-white/10 dark:group-hover:text-primary/35"
								>
									{numberFormatter.format(idx + 1)}
								</span>
							</div>

							<h3 className="mt-6 text-xl font-extrabold text-[#19243b] dark:text-slate-100">
								{title}
							</h3>

							<p className="mt-2.5 text-sm leading-8 text-slate-500 dark:text-slate-400">
								{desc}
							</p>
						</motion.article>
					))}
				</motion.div>
			</div>
		</motion.section>
	);
}
