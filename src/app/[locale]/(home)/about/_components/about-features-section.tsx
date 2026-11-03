"use client";

import { motion } from "framer-motion";
import {
	BadgeCheck,
	Cloud,
	Globe2,
	GraduationCap,
	Languages,
	Library,
	ShieldCheck,
	WifiOff,
	Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAboutMotion } from "./about-motion";

export function AboutFeaturesSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();

	const features = [
		{
			icon: WifiOff,
			title: t("features.offline.title"),
			desc: t("features.offline.desc"),
			tone: "bg-[#e1f6ec] text-[#258263] dark:bg-emerald-400/15 dark:text-emerald-200",
		},
		{
			icon: Cloud,
			title: t("features.sync.title"),
			desc: t("features.sync.desc"),
			tone: "bg-[#eee8ff] text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200",
		},
		{
			icon: ShieldCheck,
			title: t("features.secure.title"),
			desc: t("features.secure.desc"),
			tone: "bg-[#e6f1ff] text-[#3a79c2] dark:bg-sky-400/15 dark:text-sky-200",
		},
		{
			icon: Zap,
			title: t("features.fast.title"),
			desc: t("features.fast.desc"),
			tone: "bg-[#ffeddf] text-[#c87949] dark:bg-amber-400/15 dark:text-amber-200",
		},
		{
			icon: Library,
			title: t("features.library.title"),
			desc: t("features.library.desc"),
			tone: "bg-[#e1f6ec] text-[#258263] dark:bg-emerald-400/15 dark:text-emerald-200",
		},
		{
			icon: GraduationCap,
			title: t("features.certified.title"),
			desc: t("features.certified.desc"),
			tone: "bg-[#eee8ff] text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200",
		},
	];

	const specs = [
		{ icon: Globe2, key: "platforms" },
		{ icon: Languages, key: "languages" },
		{ icon: WifiOff, key: "offline" },
		{ icon: BadgeCheck, key: "price" },
	] as const;

	return (
		<motion.section
			id="features"
			className="relative overflow-hidden py-20 sm:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(106,75,212,0.07),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,130,99,0.07),transparent_30%)]"
			/>

			<div className="relative mx-auto grid max-w-[1160px] gap-6 px-4 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-8">
				<motion.div
					className="soft-card p-6 sm:p-8 lg:sticky lg:top-28"
					variants={aboutMotion.item}
				>
					<span className="section-kicker">
						<Zap className="size-3.5" />

						{t("features.badge")}
					</span>

					<h2 className="mt-4 text-2xl font-black leading-[1.5] tracking-tight text-foreground sm:text-3xl">
						{t("features.title")}
					</h2>

					<p className="mt-3 text-sm leading-7 text-muted-foreground">
						{t("features.subtitle")}
					</p>

					<div className="mt-7 grid gap-2.5 sm:grid-cols-2">
						{specs.map(({ icon: Icon, key }) => (
							<div
								key={key}
								className="rounded-2xl border border-border/70 bg-muted/40 px-3.5 py-3"
							>
								<span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
									<Icon className="size-3" />

									{t(`features.specs.${key}.label`)}
								</span>

								<p className="mt-1 text-[11px] font-extrabold text-foreground">
									{t(`features.specs.${key}.value`)}
								</p>
							</div>
						))}
					</div>
				</motion.div>

				<motion.div
					className="grid gap-4 sm:grid-cols-2"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{features.map((feature) => (
						<motion.article
							key={feature.title}
							variants={aboutMotion.card}
							className="group soft-card card-hover flex flex-col p-5"
						>
							<span
								className={cn(
									"flex size-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-translate-y-0.5",
									feature.tone
								)}
							>
								<feature.icon className="size-5" />
							</span>

							<h3 className="mt-4 text-sm font-extrabold text-foreground">
								{feature.title}
							</h3>

							<p className="mt-1.5 text-[11px] leading-6 text-muted-foreground">
								{feature.desc}
							</p>
						</motion.article>
					))}
				</motion.div>
			</div>
		</motion.section>
	);
}
