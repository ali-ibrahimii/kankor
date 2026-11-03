"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAboutMotion } from "./about-motion";

export function AboutValuesSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();

	const values = [
		{
			icon: Heart,
			title: t("values.accessible.title"),
			desc: t("values.accessible.desc"),
			gradient: "from-rose-500 to-pink-500",
		},
		{
			icon: Target,
			title: t("values.learner.title"),
			desc: t("values.learner.desc"),
			gradient: "from-indigo-500 to-blue-500",
		},
		{
			icon: Sparkles,
			title: t("values.quality.title"),
			desc: t("values.quality.desc"),
			gradient: "from-amber-500 to-orange-500",
		},
	];

	return (
		<motion.section
			id="values"
			className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6 sm:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mb-14 text-center">
				<motion.span
					className="section-kicker mb-5"
					variants={aboutMotion.item}
				>
					<Heart className="h-4 w-4" /> {t("values.badge")}
				</motion.span>
				<motion.h2
					className="section-title text-center"
					variants={aboutMotion.item}
				>
					{t("values.title")}
				</motion.h2>
				<motion.p
					className="section-copy mx-auto text-center"
					variants={aboutMotion.item}
				>
					{t("values.subtitle")}
				</motion.p>
			</div>

			<motion.div
				className="grid gap-6 md:grid-cols-3"
				variants={aboutMotion.stagger}
				initial="hidden"
				whileInView="show"
				viewport={aboutMotion.viewport}
			>
				{values.map((value, i) => (
					<motion.article
						key={i}
						variants={aboutMotion.card}
						className="group soft-card card-hover relative overflow-hidden p-7 text-center"
					>
						<div
							className={cn(
								"absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-10",
								value.gradient
							)}
						/>
						<div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r opacity-80" />
						<div className="relative z-10">
							<div
								className={cn(
									"mx-auto flex size-14 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105",
									value.gradient
								)}
							>
								<value.icon className="size-6" />
							</div>
							<h3 className="mt-5 text-base font-extrabold tracking-tight text-foreground">
								{value.title}
							</h3>
							<p className="mx-auto mt-2.5 max-w-xs text-xs leading-6 text-muted-foreground">
								{value.desc}
							</p>
						</div>
					</motion.article>
				))}
			</motion.div>
		</motion.section>
	);
}
