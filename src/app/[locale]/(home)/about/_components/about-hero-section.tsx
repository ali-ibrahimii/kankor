"use client";

import { motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	Award,
	BookOpen,
	Check,
	CheckCircle2,
	Flame,
	GraduationCap,
	Play,
	Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { useAboutMotion } from "./about-motion";

interface AboutHeroSectionProps {
	isRtl: boolean;
}

export function AboutHeroSection({ isRtl }: AboutHeroSectionProps) {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();
	const Arrow = isRtl ? ArrowLeft : ArrowRight;

	const trustPills = [
		t("features.offline.title"),
		t("features.sync.title"),
		t("features.certified.title"),
	];

	return (
		<section className="mx-auto max-w-[1320px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
			<div className="relative isolate overflow-hidden rounded-[26px] border border-white/10 bg-[#0f1a2c] bg-[radial-gradient(circle_at_6%_112%,rgba(94,207,173,.22),transparent_36%),radial-gradient(circle_at_88%_-10%,rgba(137,100,255,.36),transparent_42%),linear-gradient(125deg,#0f1a2c_4%,#16223a_58%,#20223f_100%)] px-5 py-8 text-white shadow-[0_34px_80px_-46px_rgba(14,19,49,.7)] sm:rounded-[34px] sm:px-10 sm:py-12 lg:px-14 lg:py-16">
				{/* Subtle micro-dot grid matching landing hero */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,.13)_0.7px,transparent_0.7px)] bg-size-[24px_24px]"
				/>
				{/* Soft architectural corner ring */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute -end-20 -bottom-28 -z-10 size-80 rounded-full border-[44px] border-white/[.03]"
				/>

				<div className="grid items-center gap-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
					{/* Narrative Column */}
					<motion.div
						variants={aboutMotion.stagger}
						initial="hidden"
						animate="show"
					>
						<motion.div
							variants={aboutMotion.item}
							className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur"
						>
							<GraduationCap className="size-4 text-[#b7f486]" />
							<span>{t("hero.badge")}</span>
						</motion.div>

						<motion.h1
							variants={aboutMotion.item}
							className="mt-5 text-[1.95rem] font-black leading-[1.38] tracking-tight text-white sm:text-[2.7rem] lg:text-[3.15rem]"
						>
							{t.rich("hero.title", {
								accent: (chunks) => (
									<span className="bg-linear-to-l from-[#b7f486] via-[#7ce5d1] to-[#b8a4ff] bg-clip-text text-transparent">
										{chunks}
									</span>
								),
							})}
						</motion.h1>

						<motion.p
							variants={aboutMotion.item}
							className="mt-4 max-w-xl text-sm leading-8 text-white/75 sm:text-base"
						>
							{t("hero.description")}
						</motion.p>

						<motion.p
							variants={aboutMotion.item}
							className="mt-2.5 max-w-xl text-xs leading-7 text-white/55 sm:text-sm"
						>
							{t("hero.subtitle")}
						</motion.p>

						<motion.div
							variants={aboutMotion.item}
							className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
						>
							<Link
								href={routes.courses.page()}
								className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#b7f486] px-6 py-3 text-sm font-extrabold text-[#17233a] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#c9f8a2]"
							>
								<span>{t("hero.cta.primary")}</span>
								<Arrow className="size-4" />
							</Link>

							<a
								href="#demo"
								className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.06] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-white/35 hover:bg-white/[.12]"
							>
								<Play className="size-4 fill-current text-[#b7f486]" />
								<span>{t("hero.cta.secondary")}</span>
							</a>
						</motion.div>

						<motion.ul
							variants={aboutMotion.item}
							className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/70"
						>
							{trustPills.map((pill) => (
								<li key={pill} className="inline-flex items-center gap-1.5">
									<span className="inline-flex size-4 items-center justify-center rounded-full bg-[#b7f486]/15 text-[#b7f486]">
										<Check className="size-2.5 stroke-[3]" />
									</span>
									<span>{pill}</span>
								</li>
							))}
						</motion.ul>
					</motion.div>

					{/* Live Product Learning Window */}
					<motion.div
						variants={aboutMotion.card}
						initial="hidden"
						animate="show"
						className="relative mx-auto w-full max-w-[490px] lg:max-w-none"
					>
						<div className="hero-window overflow-hidden">
							{/* Window Top Bar */}
							<div className="hero-window-top">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center gap-1.5" aria-hidden="true">
										<span className="size-2.5 rounded-full bg-white/20" />
										<span className="size-2.5 rounded-full bg-white/20" />
										<span className="size-2.5 rounded-full bg-[#b7f486]/70" />
									</div>
									<span className="text-[11px] font-semibold text-white/55">
										{t("hero.panel.eyebrow")}
									</span>
								</div>

								<div className="inline-flex items-center gap-1.5 rounded-full border border-[#b7f486]/25 bg-[#b7f486]/12 px-2.5 py-1 text-[11px] font-bold text-[#b7f486]">
									<Flame className="size-3.5 fill-current" />
									<span>{t("hero.panel.streakValue")}</span>
								</div>
							</div>

							{/* Window Body */}
							<div className="p-5 sm:p-6">
								<div className="flex items-center justify-between gap-3">
									<p className="text-base font-extrabold text-white sm:text-lg">
										{t("hero.panel.title")}
									</p>
									<span className="text-[11px] font-medium text-white/45">
										{t("hero.panel.streak")}
									</span>
								</div>

								{/* Subject Progress Card */}
								<div className="mt-4 rounded-2xl border border-white/10 bg-white/[.045] p-4">
									<div className="flex items-center justify-between text-xs sm:text-sm">
										<span className="font-semibold text-white/85">
											{t("hero.panel.progressLabel")}
										</span>
										<span className="font-black text-[#b7f486]">
											{t("hero.panel.progressValue")}
										</span>
									</div>
									<div
										className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10"
										role="progressbar"
										aria-valuenow={76}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label={t("hero.panel.progressLabel")}
									>
										<motion.div
											className="h-full rounded-full bg-linear-to-r from-[#b7f486] via-[#7ce5d1] to-[#a58cff]"
											initial={{ width: aboutMotion.reduceMotion ? "76%" : 0 }}
											animate={{ width: "76%" }}
											transition={{
												duration: aboutMotion.reduceMotion ? 0 : 0.95,
												delay: aboutMotion.reduceMotion ? 0 : 0.2,
												ease: [0.22, 1, 0.36, 1],
											}}
										/>
									</div>
								</div>

								{/* Metric Pair */}
								<div className="mt-3 grid grid-cols-2 gap-3">
									<div className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
										<div className="flex items-center gap-2 text-white/60">
											<span className="flex size-7 items-center justify-center rounded-lg bg-[#a58cff]/20 text-[#c9bcff]">
												<BookOpen className="size-3.5" />
											</span>
											<span className="truncate text-[11px] font-medium">
												{t("hero.panel.lesson")}
											</span>
										</div>
										<p className="mt-2.5 text-lg font-black text-white">
											{t("hero.panel.lessonValue")}
										</p>
									</div>

									<div className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
										<div className="flex items-center gap-2 text-white/60">
											<span className="flex size-7 items-center justify-center rounded-lg bg-[#7ce5d1]/20 text-[#7ce5d1]">
												<Trophy className="size-3.5" />
											</span>
											<span className="truncate text-[11px] font-medium">
												{t("hero.panel.quiz")}
											</span>
										</div>
										<p className="mt-2.5 text-lg font-black text-white">
											{t("hero.panel.quizValue")}
										</p>
									</div>
								</div>

								{/* Verified Certificate Strip */}
								<Link
									href={routes.verify.page()}
									className="group mt-3 flex items-center gap-3.5 rounded-2xl border border-[#b7f486]/20 bg-[#b7f486]/[.07] p-3.5 transition hover:border-[#b7f486]/40 hover:bg-[#b7f486]/[.11]"
								>
									<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#b7f486] text-[#17233a] shadow-sm">
										<Award className="size-5" />
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-xs font-extrabold text-white sm:text-sm">
											{t("hero.panel.certificate")}
										</p>
										<p className="mt-0.5 truncate text-[11px] text-white/60">
											{t("hero.panel.certificateDesc")}
										</p>
									</div>
									<span className="hidden shrink-0 items-center gap-1 rounded-full border border-[#b7f486]/30 bg-[#b7f486]/12 px-2.5 py-1 text-[10px] font-bold text-[#b7f486] sm:inline-flex">
										<CheckCircle2 className="size-3" />
										{t("hero.panel.verified")}
									</span>
								</Link>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
