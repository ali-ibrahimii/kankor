"use client";

import { motion } from "framer-motion";
import {
	Award,
	BookOpen,
	Globe2,
	ShieldCheck,
	Sparkles,
	WifiOff,
	Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ABOUT_TONES, useAboutMotion } from "./about-motion";

export function AboutFeaturesSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();

	const features = [
		{
			key: "offline",
			icon: WifiOff,
			title: t("features.offline.title"),
			desc: t("features.offline.desc"),
			tint: ABOUT_TONES.mint.icon,
		},
		{
			key: "sync",
			icon: Globe2,
			title: t("features.sync.title"),
			desc: t("features.sync.desc"),
			tint: ABOUT_TONES.sky.icon,
		},
		{
			key: "secure",
			icon: ShieldCheck,
			title: t("features.secure.title"),
			desc: t("features.secure.desc"),
			tint: ABOUT_TONES.violet.icon,
		},
		{
			key: "fast",
			icon: Zap,
			title: t("features.fast.title"),
			desc: t("features.fast.desc"),
			tint: ABOUT_TONES.peach.icon,
		},
		{
			key: "library",
			icon: BookOpen,
			title: t("features.library.title"),
			desc: t("features.library.desc"),
			tint: ABOUT_TONES.violet.icon,
		},
		{
			key: "certified",
			icon: Award,
			title: t("features.certified.title"),
			desc: t("features.certified.desc"),
			tint: ABOUT_TONES.mint.icon,
		},
	] as const;

	const specs = [
		{
			key: "platforms",
			label: t("features.specs.platforms.label"),
			value: t("features.specs.platforms.value"),
		},
		{
			key: "languages",
			label: t("features.specs.languages.label"),
			value: t("features.specs.languages.value"),
		},
		{
			key: "offline",
			label: t("features.specs.offline.label"),
			value: t("features.specs.offline.value"),
		},
		{
			key: "price",
			label: t("features.specs.price.label"),
			value: t("features.specs.price.value"),
		},
	] as const;

	return (
		<motion.section
			id="features"
			className="scroll-mt-32 border-y border-[#faf6ee] bg-white/75 py-16 sm:py-20 lg:scroll-mt-36 lg:py-24 dark:border-white/10 dark:bg-[#3b2621]/60"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto grid max-w-[1320px] items-start gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-12 lg:px-8">
				{/* Sticky Deep-Navy Specs Summary Panel */}
				<div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#251c19] bg-[radial-gradient(circle_at_10%_110%,rgba(94,207,173,.2),transparent_42%),radial-gradient(circle_at_90%_-10%,rgba(137,100,255,.34),transparent_46%),linear-gradient(135deg,#251c19_0%,#3b2621_60%,#3b2621_100%)] p-6 text-white shadow-[0_28px_68px_-40px_rgba(14,19,49,.65)] sm:p-8 lg:sticky lg:top-36">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,.11)_0.7px,transparent_0.7px)] bg-size-[22px_22px]"
					/>

					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3.5 py-1.5 text-xs font-bold text-[#afa5a6]">
						<Sparkles className="size-3.5" />
						{t("features.badge")}
					</span>

					<h2 className="mt-5 text-2xl font-black leading-[1.45] tracking-tight text-white sm:text-3xl">
						{t("features.title")}
					</h2>

					<p className="mt-3 text-sm leading-8 text-white/65">
						{t("features.subtitle")}
					</p>

					<dl className="mt-7 grid grid-cols-2 gap-3">
						{specs.map((spec) => (
							<div
								key={spec.key}
								className="rounded-2xl border border-white/10 bg-white/[.055] p-3.5 backdrop-blur-sm"
							>
								<dt className="text-[11px] font-medium text-white/50">
									{spec.label}
								</dt>
								<dd className="mt-1.5 text-xs font-extrabold leading-snug text-white sm:text-sm">
									{spec.value}
								</dd>
							</div>
						))}
					</dl>
				</div>

				{/* 6 Capability Bento Cards */}
				<motion.div
					className="grid gap-4 sm:grid-cols-2 sm:gap-5"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{features.map(({ key, icon: Icon, title, desc, tint }) => (
						<motion.article
							key={key}
							variants={aboutMotion.card}
							className="soft-card card-hover border-[#e8eeea] bg-white p-6 sm:p-7 dark:border-white/10 dark:bg-[#3b2621]"
						>
							<div
								className={`flex size-12 items-center justify-center rounded-2xl ${tint}`}
							>
								<Icon className="size-5" />
							</div>

							<h3 className="mt-5 text-base font-extrabold text-[#3b2621] sm:text-lg dark:text-slate-100">
								{title}
							</h3>

							<p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
								{desc}
							</p>
						</motion.article>
					))}
				</motion.div>
			</div>
		</motion.section>
	);
}
