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
			className="mx-auto max-w-6xl px-6 py-24 lg:py-28"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mb-14 text-center">
				<motion.span
					className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-sm font-semibold text-rose-700"
					variants={aboutMotion.item}
				>
					<Heart className="h-4 w-4" /> {t("values.title")}
				</motion.span>
				<motion.h2
					className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl"
					variants={aboutMotion.item}
				>
					{t("values.title")}
				</motion.h2>
				<motion.p
					className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 md:text-lg"
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
						className="group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
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
									"mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-linear-to-br text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105",
									value.gradient
								)}
							>
								<value.icon className="h-7 w-7" />
							</div>
							<h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">
								{value.title}
							</h3>
							<p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-slate-500">
								{value.desc}
							</p>
						</div>
					</motion.article>
				))}
			</motion.div>
		</motion.section>
	);
}
