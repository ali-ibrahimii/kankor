"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { clientEnv } from "@/lib/env/client-env";
import { ABOUT_TONES, useAboutMotion } from "./about-motion";

const SOCIAL_PROFILES = [
	{
		name: "Twitter / X",
		url: "https://twitter.com/abzarkonkur",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="currentColor"
				className="size-4"
				aria-hidden="true"
			>
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
			</svg>
		),
	},
	{
		name: "Instagram",
		url: "https://instagram.com/abzarkonkur",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="size-4"
				aria-hidden="true"
			>
				<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
				<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
				<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
			</svg>
		),
	},
	{
		name: "Facebook",
		url: "https://facebook.com/abzarkonkur",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="currentColor"
				className="size-4"
				aria-hidden="true"
			>
				<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
			</svg>
		),
	},
] as const;

export function AboutContactSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();

	const contactEmail = clientEnv.app.email;
	const contactPhone = "+93 700 123 456";

	const contactItems = [
		{
			id: "email",
			icon: Mail,
			label: t("contact.email"),
			value: contactEmail,
			href: `mailto:${contactEmail}`,
			ltr: true,
			tone: ABOUT_TONES.violet,
		},
		{
			id: "phone",
			icon: Phone,
			label: t("contact.phone"),
			value: contactPhone,
			href: "tel:+93700123456",
			ltr: true,
			tone: ABOUT_TONES.mint,
		},
		{
			id: "address",
			icon: MapPin,
			label: t("contact.address"),
			value: t("contact.addressValue"),
			href: null,
			ltr: false,
			tone: ABOUT_TONES.sky,
		},
		{
			id: "hours",
			icon: Clock,
			label: t("contact.hours"),
			value: t("contact.hoursValue"),
			href: null,
			ltr: false,
			tone: ABOUT_TONES.peach,
		},
	] as const;

	return (
		<motion.section
			id="contact"
			className="scroll-mt-32 py-16 sm:py-20 lg:scroll-mt-36 lg:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mx-auto max-w-2xl text-center">
					<span className="section-kicker">
						<Send className="size-3.5" />
						{t("contact.badge")}
					</span>
					<h2 className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-[#3b2621] sm:text-3xl lg:text-4xl dark:text-slate-100">
						{t("contact.title")}
					</h2>
					<p className="mt-3 text-sm leading-8 text-slate-500 sm:text-base dark:text-slate-400">
						{t("contact.subtitle")}
					</p>
				</div>

				{/* 4 Contact Cards */}
				<motion.div
					className="mt-11 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{contactItems.map(
						({ id, icon: Icon, label, value, href, ltr, tone }) => {
							const body = (
								<>
									<div
										aria-hidden="true"
										className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${tone.bar} opacity-75 transition-opacity group-hover:opacity-100`}
									/>
									<div className="flex items-start justify-between gap-3">
										<div
											className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}
										>
											<Icon className="size-5" />
										</div>
										{href && (
											<span className="flex size-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition group-hover:bg-primary/8 group-hover:text-primary dark:bg-white/[.05] dark:text-slate-500 dark:group-hover:text-violet-200">
												<ArrowUpRight className="size-4 rtl:-scale-x-100" />
											</span>
										)}
									</div>

									<p className="mt-5 text-xs font-semibold text-slate-400 dark:text-slate-500">
										{label}
									</p>
									<p
										dir={ltr ? "ltr" : undefined}
										className={`mt-1.5 break-words text-sm font-extrabold leading-7 text-[#3b2621] dark:text-slate-100 ${ltr ? "text-start" : ""}`}
									>
										{value}
									</p>
								</>
							);

							return href ? (
								<motion.a
									key={id}
									href={href}
									variants={aboutMotion.card}
									className="soft-card card-hover group relative flex flex-col overflow-hidden border-[#e8eeea] bg-white p-6 dark:border-white/10 dark:bg-[#3b2621]"
								>
									{body}
								</motion.a>
							) : (
								<motion.div
									key={id}
									variants={aboutMotion.card}
									className="soft-card group relative flex flex-col overflow-hidden border-[#e8eeea] bg-white p-6 dark:border-white/10 dark:bg-[#3b2621]"
								>
									{body}
								</motion.div>
							);
						}
					)}
				</motion.div>

				{/* Social Community & Response Time Strip */}
				<motion.div
					variants={aboutMotion.card}
					className="soft-card mt-5 flex flex-col justify-between gap-6 border-[#e8eeea] bg-white p-6 sm:p-8 lg:flex-row lg:items-center dark:border-white/10 dark:bg-[#3b2621]"
				>
					<div>
						<div className="inline-flex items-center gap-2 rounded-full border border-[#e8eeea] bg-[#faf6ee] px-3 py-1 text-xs font-bold text-[#02656b] dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200">
							<span className="size-2 rounded-full bg-[#02656b] dark:bg-emerald-400" />
							{t("contact.responseTime")}
						</div>
						<h3 className="mt-3 text-lg font-extrabold text-[#3b2621] sm:text-xl dark:text-slate-100">
							{t("contact.socialTitle")}
						</h3>
						<p className="mt-1 text-xs leading-7 text-slate-500 sm:text-sm dark:text-slate-400">
							{t("contact.socialSubtitle")}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2.5">
						{SOCIAL_PROFILES.map((social) => (
							<a
								key={social.name}
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={social.name}
								className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-bold text-[#3b2621] transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/6 hover:text-primary dark:border-white/10 dark:bg-white/[.04] dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:bg-violet-400/10 dark:hover:text-violet-200"
							>
								{social.icon}
								<span>{social.name}</span>
							</a>
						))}
					</div>
				</motion.div>
			</div>
		</motion.section>
	);
}
