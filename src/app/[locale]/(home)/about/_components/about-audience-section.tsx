"use client";

import { motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	Check,
	GraduationCap,
	School,
	Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import { ABOUT_TONES, useAboutMotion } from "./about-motion";

export function AboutAudienceSection() {
	const t = useTranslations("aboutUs");
	const locale = useLocale();
	const aboutMotion = useAboutMotion();
	const Arrow = isRtl(locale as Locale) ? ArrowLeft : ArrowRight;

	const groups = [
		{
			key: "students",
			icon: GraduationCap,
			title: t("audience.students.title"),
			desc: t("audience.students.desc"),
			points: [
				t("audience.students.point1"),
				t("audience.students.point2"),
				t("audience.students.point3"),
			],
			cta: t("audience.students.cta"),
			href: routes.auth.signup.page({ type: "student" }),
			tone: ABOUT_TONES.violet,
		},
		{
			key: "instructors",
			icon: School,
			title: t("audience.instructors.title"),
			desc: t("audience.instructors.desc"),
			points: [
				t("audience.instructors.point1"),
				t("audience.instructors.point2"),
				t("audience.instructors.point3"),
			],
			cta: t("audience.instructors.cta"),
			href: routes.auth.signup.page({ type: "instructor" }),
			tone: ABOUT_TONES.mint,
		},
		{
			key: "schools",
			icon: Building2,
			title: t("audience.schools.title"),
			desc: t("audience.schools.desc"),
			points: [
				t("audience.schools.point1"),
				t("audience.schools.point2"),
				t("audience.schools.point3"),
			],
			cta: t("audience.schools.cta"),
			href: routes.auth.signup.page({ type: "school" }),
			tone: ABOUT_TONES.sky,
		},
	] as const;

	return (
		<motion.section
			id="audience"
			className="scroll-mt-32 py-16 sm:py-20 lg:scroll-mt-36 lg:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* Header matching landing role cards section */}
				<div className="mx-auto max-w-2xl text-center">
					<span className="section-kicker">
						<Users className="size-3.5" />
						{t("audience.badge")}
					</span>
					<h2 className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-[#19243b] sm:text-3xl lg:text-4xl dark:text-slate-100">
						{t("audience.title")}
					</h2>
					<p className="mt-3 text-sm leading-8 text-slate-500 sm:text-base dark:text-slate-400">
						{t("audience.subtitle")}
					</p>
				</div>

				{/* 3 Role Path Cards */}
				<motion.div
					className="mt-11 grid gap-5 lg:grid-cols-3 lg:gap-6"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{groups.map(
						({ key, icon: Icon, title, desc, points, cta, href, tone }) => (
							<motion.article
								key={key}
								variants={aboutMotion.card}
								className="soft-card card-hover group relative flex flex-col overflow-hidden border-[#e5e8f3] bg-white p-7 sm:p-8 dark:border-white/10 dark:bg-[#1b2438]"
							>
								<div
									aria-hidden="true"
									className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${tone.bar} opacity-75 transition-opacity group-hover:opacity-100`}
								/>

								<div
									className={`flex size-14 items-center justify-center rounded-[20px] ${tone.icon}`}
								>
									<Icon className="size-6" />
								</div>

								<h3 className="mt-6 text-xl font-extrabold text-[#19243b] dark:text-slate-100">
									{title}
								</h3>

								<p className="mt-2.5 text-sm leading-7 text-slate-500 dark:text-slate-400">
									{desc}
								</p>

								<ul className="mt-6 flex-1 space-y-2.5 border-t border-slate-100 pt-5 dark:border-white/[.08]">
									{points.map((point) => (
										<li
											key={point}
											className="flex items-start gap-2.5 text-xs font-semibold leading-6 text-[#19243b] sm:text-sm dark:text-slate-200"
										>
											<Check className="mt-1 size-4 shrink-0 text-[#258263] dark:text-emerald-400" />
											<span>{point}</span>
										</li>
									))}
								</ul>

								<Link
									href={href}
									className="mt-7 inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3.5 text-xs font-bold text-[#19243b] transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary sm:text-sm dark:border-white/12 dark:text-slate-100 dark:hover:border-violet-400/50 dark:hover:bg-violet-400/10 dark:hover:text-violet-200"
								>
									<span>{cta}</span>
									<Arrow className="size-4" />
								</Link>
							</motion.article>
						)
					)}
				</motion.div>
			</div>
		</motion.section>
	);
}
