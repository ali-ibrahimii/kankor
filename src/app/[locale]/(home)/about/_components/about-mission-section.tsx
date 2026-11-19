"use client";

import { motion } from "framer-motion";
import { Award, Check, Globe2, Target, WifiOff } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ABOUT_TONES, useAboutMotion } from "./about-motion";

export function AboutMissionSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();
	const rawPoints = t.raw("mission.points");
	const points: string[] = Array.isArray(rawPoints) ? rawPoints : [];

	const highlights = [
		{
			icon: WifiOff,
			label: t("features.specs.offline.label"),
			value: t("features.specs.offline.value"),
			tint: ABOUT_TONES.mint.icon,
		},
		{
			icon: Globe2,
			label: t("features.specs.languages.label"),
			value: t("features.specs.languages.value"),
			tint: ABOUT_TONES.violet.icon,
		},
		{
			icon: Award,
			label: t("hero.panel.certificate"),
			value: t("hero.panel.verified"),
			tint: ABOUT_TONES.sky.icon,
		},
	] as const;

	return (
		<motion.section
			id="mission"
			className="scroll-mt-32 border-y border-[#e9eaf2] bg-white/75 py-16 sm:py-20 lg:scroll-mt-36 lg:py-24 dark:border-white/10 dark:bg-[#1b2438]/60"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto grid max-w-[1320px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-16 lg:px-8">
				{/* Editorial Lavender-Framed Showcase Card (matching home offline section) */}
				<motion.div
					variants={aboutMotion.card}
					className="relative mx-auto w-full max-w-[490px] lg:max-w-none"
				>
					<div className="relative rounded-[30px] bg-[#ebe5ff] p-4 shadow-[0_28px_70px_-42px_rgba(65,45,140,.35)] sm:p-5 dark:bg-[#232b48]">
						{/* Signature Mint Floating Corner Badge */}
						<div
							aria-hidden="true"
							className="absolute -end-2.5 -top-2.5 z-10 flex size-12 items-center justify-center rounded-2xl bg-[#b7f486] text-[#17233a] shadow-lg shadow-black/10 sm:size-14"
						>
							<Target className="size-6" />
						</div>

						{/* Student Portrait */}
						<div className="relative aspect-[4/3.3] overflow-hidden rounded-[22px] bg-[#141f35]">
							<Image
								src="/images/hero/hero-student.jpg"
								alt={t("mission.title")}
								fill
								sizes="(max-width: 1024px) 100vw, 480px"
								className="object-cover object-[50%_20%]"
							/>
							<div
								aria-hidden="true"
								className="absolute inset-0 bg-linear-to-t from-[#0f1a2c]/70 via-transparent to-transparent"
							/>
							<div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2">
								<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0f1a2c]/75 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
									<span className="size-2 rounded-full bg-[#b7f486]" />
									{t("features.specs.platforms.value")}
								</span>
								<span className="rounded-full bg-[#b7f486] px-3 py-1 text-[11px] font-extrabold text-[#17233a]">
									{t("features.specs.price.value")}
								</span>
							</div>
						</div>

						{/* Compact Pillar Strip */}
						<div className="mt-3.5 grid gap-2.5 rounded-[22px] bg-white p-3.5 shadow-sm sm:grid-cols-3 dark:bg-[#161f33]">
							{highlights.map(({ icon: Icon, label, value, tint }) => (
								<div
									key={label}
									className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 p-2.5 sm:flex-col sm:items-start sm:gap-2 dark:bg-white/[.04]"
								>
									<span
										className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${tint}`}
									>
										<Icon className="size-4" />
									</span>
									<div className="min-w-0">
										<p className="truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">
											{label}
										</p>
										<p className="truncate text-xs font-extrabold text-[#19243b] dark:text-slate-100">
											{value}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</motion.div>

				{/* Mission Copy & Checklist */}
				<motion.div
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					<motion.div variants={aboutMotion.item}>
						<span className="section-kicker">
							<Target className="size-3.5" />
							{t("mission.badge")}
						</span>
					</motion.div>

					<motion.h2
						variants={aboutMotion.item}
						className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-[#19243b] sm:text-3xl lg:text-4xl dark:text-slate-100"
					>
						{t("mission.title")}
					</motion.h2>

					<motion.p
						variants={aboutMotion.item}
						className="mt-4 text-sm leading-8 text-slate-600 sm:text-base dark:text-slate-300"
					>
						{t("mission.body")}
					</motion.p>

					{points.length > 0 && (
						<motion.ul
							className="mt-7 space-y-3"
							variants={aboutMotion.stagger}
						>
							{points.map((point) => (
								<motion.li
									key={point}
									variants={aboutMotion.item}
									className="flex items-start gap-3.5 rounded-2xl border border-[#e7eaf4] bg-[#f9faff] px-4 py-3.5 text-sm font-semibold leading-7 text-[#19243b] dark:border-white/10 dark:bg-[#141b2c]/80 dark:text-slate-100"
								>
									<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e1f6ec] text-[#258263] dark:bg-emerald-400/15 dark:text-emerald-300">
										<Check className="size-3.5 stroke-[2.75]" />
									</span>
									<span>{point}</span>
								</motion.li>
							))}
						</motion.ul>
					)}
				</motion.div>
			</div>
		</motion.section>
	);
}
