"use client";

import { motion } from "framer-motion";
import { BookOpen, Building2, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { ABOUT_TONES, useAboutMotion } from "./about-motion";

export function AboutStatsSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();

	const stats = [
		{
			key: "students",
			label: t("stats.students"),
			value: t("stats.value.students"),
			icon: Users,
			tint: ABOUT_TONES.violet.icon,
		},
		{
			key: "courses",
			label: t("stats.courses"),
			value: t("stats.value.courses"),
			icon: BookOpen,
			tint: ABOUT_TONES.mint.icon,
		},
		{
			key: "schools",
			label: t("stats.schools"),
			value: t("stats.value.schools"),
			icon: Building2,
			tint: ABOUT_TONES.sky.icon,
		},
		{
			key: "rating",
			label: t("stats.rating"),
			value: t("stats.value.rating"),
			icon: Star,
			tint: ABOUT_TONES.peach.icon,
		},
	] as const;

	return (
		<section
			id="stats"
			className="mx-auto max-w-[1320px] px-4 pt-4 pb-6 sm:px-6 sm:pt-5 sm:pb-8 lg:px-8"
		>
			<motion.dl
				className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
				variants={aboutMotion.stagger}
				initial="hidden"
				whileInView="show"
				viewport={aboutMotion.viewport}
			>
				{stats.map(({ key, label, value, icon: Icon, tint }) => (
					<motion.div
						key={key}
						variants={aboutMotion.item}
						className="soft-card flex items-center gap-3.5 border-[#e6e9f4] bg-white px-4 py-4 sm:gap-4 sm:px-5 sm:py-5 dark:border-white/10 dark:bg-[#1b2438]"
					>
						<div
							className={`flex size-11 shrink-0 items-center justify-center rounded-2xl sm:size-12 ${tint}`}
						>
							<Icon className="size-5" />
						</div>

						<div className="min-w-0">
							<dd className="text-xl font-black tracking-tight text-[#19243b] sm:text-2xl dark:text-slate-100">
								{value}
							</dd>
							<dt className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
								{label}
							</dt>
						</div>
					</motion.div>
				))}
			</motion.dl>
		</section>
	);
}
