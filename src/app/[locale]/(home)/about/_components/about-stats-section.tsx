"use client";

import { motion } from "framer-motion";
import { BookOpen, Building, Globe2, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAboutMotion } from "./about-motion";

export function AboutStatsSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();

	const stats = [
		{
			value: t("stats.value.students"),
			label: t("stats.students"),
			icon: Users,
		},
		{
			value: t("stats.value.courses"),
			label: t("stats.courses"),
			icon: BookOpen,
		},
		{
			value: t("stats.value.schools"),
			label: t("stats.schools"),
			icon: Building,
		},
		{ value: t("stats.value.rating"), label: t("stats.rating"), icon: Star },
	];

	return (
		<motion.section
			id="stats"
			className="relative z-20 -mt-10 mx-auto w-full max-w-6xl px-6"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
				<motion.div
					className="grid grid-cols-2 gap-0 md:grid-cols-4"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{stats.map((s, i) => (
						<motion.div
							key={i}
							variants={aboutMotion.item}
							className={cn(
								"group relative flex flex-col items-center px-4 py-8 sm:px-6",
								i < stats.length - 1 &&
									"border-e border-slate-100 rtl:border-s rtl:border-e-0"
							)}
						>
							<div className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-sky-200 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
							<div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15 transition-transform duration-300 group-hover:-translate-y-0.5">
								<s.icon className="h-5 w-5" />
							</div>
							<div className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
								{s.value}
							</div>
							<div className="mt-1 max-w-44 text-center text-sm font-medium leading-6 text-slate-500">
								{s.label}
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</motion.section>
	);
}
