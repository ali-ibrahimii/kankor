"use client";

import { motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	Award,
	BadgeCheck,
	BookOpen,
	Flame,
	GraduationCap,
	Sparkles,
	WifiOff,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { useAboutMotion } from "./about-motion";

export function AboutHeroSection({ isRtl }: { isRtl: boolean }) {
	const t = useTranslations("aboutUs");
	const tApp = useTranslations("app");
	const aboutMotion = useAboutMotion();
	const Arrow = isRtl ? ArrowLeft : ArrowRight;

	const highlights = [
		{ key: "offline", icon: WifiOff },
		{ key: "sync", icon: Sparkles },
		{ key: "certified", icon: Award },
	] as const;

	return (
		<section className="relative overflow-hidden bg-[#0b1222] text-white">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(124,229,209,0.22),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(137,100,255,0.4),transparent_42%),radial-gradient(circle_at_50%_120%,rgba(106,75,212,0.28),transparent_48%)]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-[.14] [background-image:radial-gradient(rgba(255,255,255,.65)_.7px,transparent_.7px)] [background-size:24px_24px]"
			/>

			<div className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-5 pb-28 pt-14 sm:px-6 sm:pb-32 sm:pt-18 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,.92fr)] lg:gap-16 lg:px-8 lg:pb-36 lg:pt-24">
				<motion.div
					variants={aboutMotion.stagger}
					initial="hidden"
					animate="show"
				>
					<motion.span
						variants={aboutMotion.item}
						className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-2 text-xs font-bold text-white/80 backdrop-blur-sm"
					>
						<GraduationCap className="size-3.5 text-[#b7f486]" />

						{t("hero.badge")}

						<span className="mx-0.5 size-1 rounded-full bg-[#b7f486]" />

						<span className="text-white/55">{t("nav.label")}</span>
					</motion.span>

					<motion.h1
						variants={aboutMotion.item}
						className="mt-6 max-w-[640px] text-[2.1rem] font-black leading-[1.45] tracking-tight sm:text-[3rem] lg:text-[3.35rem]"
					>
						{t("hero.title")}
					</motion.h1>

					<motion.p
						variants={aboutMotion.item}
						className="mt-5 max-w-[560px] text-sm leading-8 text-white/65 sm:text-base sm:leading-9"
					>
						{t("hero.subtitle")}
					</motion.p>

					<motion.div
						variants={aboutMotion.item}
						className="mt-8 flex flex-col gap-3 sm:flex-row"
					>
						<Link
							href={routes.courses.page()}
							className="button-primary bg-[#b7f486] text-[#17233a] shadow-black/20 hover:bg-[#c9f8a2] hover:shadow-primary/25"
						>
							<Sparkles className="size-4" />

							{t("hero.cta.primary")}

							<Arrow className="size-4" />
						</Link>

						<Link
							href="#demo"
							className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.07] px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/[.16]"
						>
							{t("hero.cta.secondary")}
						</Link>
					</motion.div>

					<motion.div
						variants={aboutMotion.item}
						className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-semibold text-white/65"
					>
						{highlights.map(({ key, icon: Icon }) => (
							<span key={key} className="inline-flex items-center gap-2">
								<span className="flex size-5 items-center justify-center rounded-full bg-[#b7f486]/15 text-[#b7f486]">
									<Icon className="size-3" />
								</span>

								{t(`features.${key}.title`)}
							</span>
						))}
					</motion.div>
				</motion.div>

				{/* Product preview — mirrors the real dashboard, no images needed */}
				<motion.div
					variants={aboutMotion.card}
					initial="hidden"
					animate="show"
					className="relative mx-auto w-full max-w-[430px] lg:max-w-[460px]"
				>
					<div
						aria-hidden="true"
						className="absolute -top-6 -end-4 size-32 rounded-full bg-violet-500/30 blur-3xl"
					/>

					<div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[#0f182c]/90 shadow-[0_40px_80px_-32px_rgba(0,0,0,.8)] backdrop-blur-xl">
						<div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
							<span className="flex items-center gap-2 text-[11px] font-bold text-white/70">
								<span className="flex size-6 items-center justify-center rounded-lg bg-[#b7f486]/15 text-[#b7f486]">
									<BookOpen className="size-3.5" />
								</span>

								{t("hero.panel.eyebrow")}
							</span>

							<span className="flex items-center gap-1.5 rounded-full bg-[#b7f486]/12 px-2.5 py-1 text-[10px] font-bold text-[#b7f486]">
								<Flame className="size-3" />

								{t("hero.panel.streakValue")}
							</span>
						</div>

						<div className="px-5 py-5">
							<div className="flex items-end justify-between gap-3">
								<p className="text-sm font-extrabold text-white">
									{t("hero.panel.title")}
								</p>

								<span className="text-lg font-black text-[#b7f486]">
									{t("hero.panel.progressValue")}
								</span>
							</div>

							<div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
								<motion.div
									className="h-full rounded-full bg-gradient-to-r from-[#b7f486] to-[#7ce5d1]"
									initial={{ width: 0 }}
									animate={{ width: "76%" }}
									transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
								/>
							</div>

							<div className="mt-5 flex items-center justify-between text-[11px]">
								<span className="font-semibold text-white/70">
									{t("hero.panel.progressLabel")}
								</span>

								<span className="text-white/45">
									{t("hero.panel.progressValue")}
								</span>
							</div>

							<div className="mt-4 grid grid-cols-2 gap-2.5">
								<div className="rounded-2xl border border-white/10 bg-white/[.05] p-3">
									<p className="text-[10px] text-white/45">
										{t("hero.panel.lesson")}
									</p>

									<p className="mt-1 text-sm font-extrabold">
										{t("hero.panel.lessonValue")}
									</p>
								</div>

								<div className="rounded-2xl border border-white/10 bg-white/[.05] p-3">
									<p className="text-[10px] text-white/45">
										{t("hero.panel.quiz")}
									</p>

									<p className="mt-1 text-sm font-extrabold">
										{t("hero.panel.quizValue")}
									</p>
								</div>
							</div>
						</div>

						<div className="mx-5 mb-5 flex items-start gap-3 rounded-2xl border border-[#b7f486]/20 bg-[#b7f486]/[.07] p-3.5">
							<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#b7f486]/15 text-[#b7f486]">
								<Award className="size-4" />
							</span>

							<div className="min-w-0">
								<p className="text-[11px] font-extrabold text-white">
									{t("hero.panel.certificate")}
								</p>

								<p className="mt-1 text-[10px] leading-5 text-white/50">
									{t("hero.panel.certificateDesc")}
								</p>
							</div>
						</div>
					</div>

					<div className="absolute -bottom-5 -start-3 flex items-center gap-2 rounded-2xl border border-white/15 bg-[#26324b]/95 px-3.5 py-2.5 text-[10px] font-bold shadow-xl backdrop-blur sm:-start-5">
						<span className="rounded-lg bg-[#b7f486]/15 p-1.5 text-[#b7f486]">
							<BadgeCheck className="size-3.5" />
						</span>

						{t("hero.panel.verified")}
					</div>

					<div className="absolute -top-4 -start-2 hidden items-center gap-2 rounded-2xl border border-white/15 bg-[#26324b]/95 px-3.5 py-2.5 text-[10px] font-bold shadow-xl backdrop-blur sm:flex">
						<span className="rounded-lg bg-violet-400/15 p-1.5 text-violet-200">
							<Sparkles className="size-3.5" />
						</span>

						{tApp("name")}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
