"use client";

import { motion } from "framer-motion";
import {
	Cloud,
	GraduationCap,
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
		},
		{
			icon: Cloud,
			title: t("features.sync.title"),
			desc: t("features.sync.desc"),
		},
		{
			icon: ShieldCheck,
			title: t("features.secure.title"),
			desc: t("features.secure.desc"),
		},
		{
			icon: Zap,
			title: t("features.fast.title"),
			desc: t("features.fast.desc"),
		},
		{
			icon: Library,
			title: t("features.library.title"),
			desc: t("features.library.desc"),
		},
		{
			icon: GraduationCap,
			title: t("features.certified.title"),
			desc: t("features.certified.desc"),
		},
	];

	return (
		<motion.section
			id="features"
			className="relative overflow-hidden py-24 lg:py-28"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_30%)]" />
			<div className="relative mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
				<motion.div
					className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-8 shadow-[0_22px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl"
					variants={aboutMotion.item}
				>
					<span className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700">
						<Zap className="h-4 w-4" /> {t("features.title")}
					</span>
					<h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
						{t("features.title")}
					</h2>
					<p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
						{t("features.subtitle")}
					</p>

					<div className="mt-10 grid gap-3 sm:grid-cols-2">
						{[
							{
								label: t("features.offline.title"),
								tone: "from-sky-500 to-cyan-500",
							},
							{
								label: t("features.sync.title"),
								tone: "from-indigo-500 to-blue-500",
							},
							{
								label: t("features.secure.title"),
								tone: "from-emerald-500 to-teal-500",
							},
							{
								label: t("features.fast.title"),
								tone: "from-amber-500 to-orange-500",
							},
						].map((chip) => (
							<div
								key={chip.label}
								className={cn(
									"rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700",
									"transition-transform duration-300 hover:-translate-y-0.5"
								)}
							>
								<span
									className={cn(
										"mr-3 inline-block size-2.5 rounded-full bg-linear-to-r",
										chip.tone
									)}
								/>
								{chip.label}
							</div>
						))}
					</div>
				</motion.div>

				<motion.div
					className="grid gap-5 sm:grid-cols-2"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{features.map((feature, i) => (
						<motion.article
							key={i}
							variants={aboutMotion.card}
							className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
						>
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_38%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
							<div className="relative z-10">
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10 transition-transform duration-300 group-hover:-translate-y-1">
									<feature.icon className="h-6 w-6" />
								</div>
								<h3 className="mt-5 text-lg font-bold tracking-tight text-slate-950">
									{feature.title}
								</h3>
								<p className="mt-2 text-sm leading-7 text-slate-500">
									{feature.desc}
								</p>
							</div>
						</motion.article>
					))}
				</motion.div>
			</div>
		</motion.section>
	);
}
