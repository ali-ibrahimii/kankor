"use client";

import { motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	Check,
	GraduationCap,
	School,
	Users2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAboutMotion } from "./about-motion";

type Role = "students" | "instructors" | "schools";

const roles: {
	key: Role;
	signupType: string;
	icon: typeof GraduationCap;
	accent: string;
	ring: string;
}[] = [
	{
		key: "students",
		signupType: "student",
		icon: GraduationCap,
		accent:
			"bg-[#eee8ff] text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200",
		ring: "group-hover:ring-violet-300/60 dark:group-hover:ring-violet-400/40",
	},
	{
		key: "instructors",
		signupType: "instructor",
		icon: BookOpen,
		accent:
			"bg-[#e1f6ec] text-[#258263] dark:bg-emerald-400/15 dark:text-emerald-200",
		ring: "group-hover:ring-emerald-300/60 dark:group-hover:ring-emerald-400/40",
	},
	{
		key: "schools",
		signupType: "school",
		icon: School,
		accent: "bg-[#e6f1ff] text-[#3a79c2] dark:bg-sky-400/15 dark:text-sky-200",
		ring: "group-hover:ring-sky-300/60 dark:group-hover:ring-sky-400/40",
	},
];

export function AboutAudienceSection() {
	const t = useTranslations("aboutUs");
	const locale = useLocale();
	const aboutMotion = useAboutMotion();
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	return (
		<motion.section
			id="audience"
			className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6 sm:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto max-w-2xl text-center">
				<span className="section-kicker">
					<Users2 className="size-3.5" />

					{t("audience.badge")}
				</span>

				<h2 className="section-title text-center">{t("audience.title")}</h2>

				<p className="section-copy mx-auto text-center">
					{t("audience.subtitle")}
				</p>
			</div>

			<motion.div
				variants={aboutMotion.stagger}
				initial="hidden"
				whileInView="show"
				viewport={aboutMotion.viewport}
				className="mt-12 grid gap-5 lg:grid-cols-3"
			>
				{roles.map(({ key, signupType, icon: Icon, accent, ring }) => (
					<motion.article
						key={key}
						variants={aboutMotion.card}
						className={cn(
							"group soft-card relative flex flex-col p-6 ring-1 ring-transparent transition duration-300 hover:-translate-y-1 sm:p-7",
							ring
						)}
					>
						<span
							className={cn(
								"flex size-12 items-center justify-center rounded-2xl",
								accent
							)}
						>
							<Icon className="size-6" />
						</span>

						<h3 className="mt-5 text-lg font-extrabold text-foreground">
							{t(`audience.${key}.title`)}
						</h3>

						<p className="mt-2.5 text-xs leading-7 text-muted-foreground">
							{t(`audience.${key}.desc`)}
						</p>

						<ul className="mt-5 space-y-2.5">
							{(["point1", "point2", "point3"] as const).map((point) => (
								<li
									key={point}
									className="flex items-start gap-2 text-[11px] font-semibold text-foreground/80"
								>
									<span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
										<Check className="size-2.5" strokeWidth={3.5} />
									</span>

									{t(`audience.${key}.${point}`)}
								</li>
							))}
						</ul>

						<Link
							href={routes.auth.signup.page({ type: signupType })}
							className="mt-6 inline-flex items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3 text-xs font-bold text-foreground transition hover:border-primary/35 hover:bg-primary/5"
						>
							{t(`audience.${key}.cta`)}

							<Arrow className="size-4" />
						</Link>
					</motion.article>
				))}
			</motion.div>
		</motion.section>
	);
}
