"use client";

import { motion } from "framer-motion";
import { BookOpen, Building, Star, Users } from "lucide-react";
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
			tint: "bg-[#eee8ff] text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200",
		},
		{
			value: t("stats.value.courses"),
			label: t("stats.courses"),
			icon: BookOpen,
			tint: "bg-[#e1f6ec] text-[#258263] dark:bg-emerald-400/15 dark:text-emerald-200",
		},
		{
			value: t("stats.value.schools"),
			label: t("stats.schools"),
			icon: Building,
			tint: "bg-[#e6f1ff] text-[#3a79c2] dark:bg-sky-400/15 dark:text-sky-200",
		},
		{
			value: t("stats.value.rating"),
			label: t("stats.rating"),
			icon: Star,
			tint: "bg-[#ffeddf] text-[#c87949] dark:bg-amber-400/15 dark:text-amber-200",
		},
	];

	return (
		<motion.section
			id="stats"
			className="relative z-20 mx-auto -mt-14 w-full max-w-[1160px] px-4 sm:-mt-16 sm:px-6"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="overflow-hidden rounded-[26px] border border-border/70 bg-card/95 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl">
				<motion.div
					className="grid grid-cols-2 gap-0 md:grid-cols-4"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{stats.map((s, i) => (
						<motion.div
							key={s.label}
							variants={aboutMotion.item}
							className={cn(
								"group relative flex items-center gap-3 px-4 py-6 sm:px-6 sm:py-7",
								"border-border/60",
								i < stats.length - 1 && "md:border-e",
								i % 2 === 0 && "max-md:border-e",
								i < 2 && "max-md:border-b"
							)}
						>
							<span
								className={cn(
									"flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-translate-y-0.5",
									s.tint
								)}
							>
								<s.icon className="size-5" />
							</span>

							<div className="min-w-0">
								<p className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
									{s.value}
								</p>

								<p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
									{s.label}
								</p>
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</motion.section>
	);
}
