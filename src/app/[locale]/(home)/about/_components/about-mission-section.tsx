"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAboutMotion } from "./about-motion";

export function AboutMissionSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();
	const missionPoints = (t.raw("mission.points") as string[]) ?? [];

	return (
		<motion.section
			id="mission"
			className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6 sm:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="grid items-center gap-10 rounded-[30px] border border-border/70 bg-card p-6 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.35)] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
				<motion.div
					className="relative hidden justify-center lg:flex h-full"
					variants={aboutMotion.item}
				>
					<div className="relative h-88 w-88">
						<div className="absolute inset-0 rounded-full border border-dashed border-sky-200/90" />
						<div className="absolute inset-8 rounded-full border border-dashed border-indigo-200/80" />
						<div className="absolute inset-16 rounded-full border border-slate-200/90 bg-[radial-gradient(circle,rgba(14,165,233,0.10),transparent_70%)]" />
						<div className="absolute inset-0 m-auto flex size-28 items-center justify-center rounded-[1.5rem] bg-linear-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-[0_18px_50px_rgba(37,99,235,0.35)]">
							<Target className="h-11 w-11" />
						</div>
						<div className="absolute inset-s-1/2 top-2 size-4 -translate-x-1/2 rounded-full bg-sky-400 shadow-lg shadow-sky-300/50" />
						<div className="absolute bottom-10 inset-s-4 size-3 rounded-full bg-indigo-400 shadow-lg shadow-indigo-300/40" />
						<div className="absolute bottom-10 inset-e-4 size-3.5 rounded-full bg-fuchsia-400 shadow-lg shadow-fuchsia-300/40" />
						<div className="absolute inset-e-0 top-1/2 size-3 -translate-y-1/2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-300/40" />
					</div>
				</motion.div>

				<div>
					<motion.span
						className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-1.5 text-xs font-bold text-primary"
						variants={aboutMotion.item}
					>
						<Target className="h-4 w-4" /> {t("mission.badge")}
					</motion.span>
					<motion.h2
						className="text-2xl font-black leading-[1.5] tracking-tight text-foreground sm:text-3xl lg:text-4xl"
						variants={aboutMotion.item}
					>
						{t("mission.title")}
					</motion.h2>
					<motion.p
						className="mt-5 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base"
						variants={aboutMotion.item}
					>
						{t("mission.body")}
					</motion.p>
					<motion.ul className="mt-8 space-y-4" variants={aboutMotion.stagger}>
						{missionPoints.map((point, i) => (
							<motion.li
								key={i}
								className="flex items-start gap-3"
								variants={aboutMotion.item}
							>
								<div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100/80">
									<CheckCircle2 className="h-4 w-4" />
								</div>
								<span className="text-sm font-medium leading-7 text-foreground/80">
									{point}
								</span>
							</motion.li>
						))}
					</motion.ul>
				</div>
			</div>
		</motion.section>
	);
}
