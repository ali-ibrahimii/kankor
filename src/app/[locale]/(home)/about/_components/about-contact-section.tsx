"use client";

// src/app/[locale]/(home)/about/_components/about-contact-section.tsx

import { motion } from "framer-motion";
import {
	ArrowUpRight,
	Clock,
	Mail,
	MapPin,
	MessageCircle,
	Phone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	FacebookIcon,
	InstagramIcon,
	TwitterIcon,
} from "@/components/blocks/navbar/icons/social-icons";
import {
	DotsBackground,
	GridBackground,
} from "@/components/global-background/background-variants";
import { clientEnv } from "@/lib/env/client-env";
import { cn } from "@/lib/utils";

type ContactInfo = {
	icon: React.ReactNode;
	label: string;
	value: string;
	href?: string;
	color: string;
};

type SocialLink = {
	platform: string;
	url: string;
	icon: React.ReactNode;
};

export function AboutContactSection() {
	const t = useTranslations("aboutUs");

	const contactInfo: ContactInfo[] = [
		{
			icon: <Mail className="h-6 w-6" />,
			label: t("contact.email"),
			value: clientEnv.app.email,
			href: `mailto:${clientEnv.app.email}`,
			color: "from-blue-500/20 to-cyan-500/20",
		},
		{
			icon: <Phone className="h-6 w-6" />,
			label: t("contact.phone"),
			value: "+93 700 123 456",
			href: "tel:+93700123456",
			color: "from-emerald-500/20 to-green-500/20",
		},
		{
			icon: <MapPin className="h-6 w-6" />,
			label: t("contact.address"),
			value: t("contact.addressValue"),
			color: "from-fuchsia-500/20 to-pink-500/20",
		},
		{
			icon: <Clock className="h-6 w-6" />,
			label: t("contact.hours"),
			value: t("contact.hoursValue"),
			color: "from-amber-500/20 to-orange-500/20",
		},
	];

	const socialLinks: SocialLink[] = [
		{
			platform: "Twitter",
			url: "https://twitter.com/abzarkonkur",
			icon: <TwitterIcon className="h-5 w-5" />,
		},
		{
			platform: "Instagram",
			url: "https://instagram.com/abzarkonkur",
			icon: <InstagramIcon className="h-5 w-5" />,
		},
		{
			platform: "Facebook",
			url: "https://facebook.com/abzarkonkur",
			icon: <FacebookIcon className="h-5 w-5" />,
		},
	];

	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 30 },
		show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
	};

	return (
		<section
			id="contact"
			className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 text-white lg:py-28"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div className="absolute -top-40 -end-40 size-96 rounded-full bg-indigo-500/20 blur-3xl" />
				<div className="absolute bottom-0 -start-40 size-96 rounded-full bg-fuchsia-500/15 blur-3xl" />
			</div>

			<div className="relative mx-auto max-w-7xl px-6">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="mb-16 text-center"
				>
					<motion.div
						initial={{ scale: 0.9 }}
						whileInView={{ scale: 1 }}
						viewport={{ once: true }}
						className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-5 py-2 text-sm font-semibold text-indigo-300 backdrop-blur-sm"
					>
						<MessageCircle className="h-4 w-4" />
						{t("contact.badge")}
					</motion.div>

					<h2 className="mx-auto max-w-4xl text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
						<span className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
							{t("contact.title")}
						</span>
					</h2>

					<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
						{t("contact.subtitle")}
					</p>
				</motion.div>

				{/* Contact Info Grid */}
				<motion.div
					variants={containerVariants}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					className="mb-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
				>
					{contactInfo.map((info, index) => (
						<motion.div
							key={index}
							variants={itemVariants}
							className="group relative"
						>
							<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-1 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/20">
								<div className="relative h-full rounded-[1.4rem] bg-slate-950/60 p-6">
									{/* Icon */}
									<div
										className={cn(
											"mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:ring-white/20",
											info.color
										)}
									>
										<div className="text-white">{info.icon}</div>
									</div>

									{/* Content */}
									<div>
										<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
											{info.label}
										</p>
										{info.href ? (
											<a
												href={info.href}
												className="group/link flex items-center gap-2 text-base font-semibold text-white transition-colors hover:text-indigo-300"
											>
												<span className="flex-1">{info.value}</span>
												<ArrowUpRight className="h-4 w-4 opacity-0 transition-all duration-300 group-hover/link:opacity-100 group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
											</a>
										) : (
											<p className="text-base font-semibold text-white">
												{info.value}
											</p>
										)}
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</motion.div>

				{/* Social Links Card */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="mx-auto max-w-4xl"
				>
					<div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-1 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/20">
						<div className="relative rounded-[1.4rem] bg-slate-950/60 p-8">
							<div className="mb-6 text-center">
								<h3 className="text-2xl font-bold text-white">
									{t("contact.socialTitle")}
								</h3>
								<p className="mt-2 text-sm text-slate-400">
									{t("contact.socialSubtitle")}
								</p>
							</div>

							<div className="flex flex-wrap items-center justify-center gap-4">
								{socialLinks.map((social, index) => (
									<motion.a
										key={social.platform}
										href={social.url}
										target="_blank"
										rel="noreferrer"
										initial={{ opacity: 0, scale: 0.8 }}
										whileInView={{ opacity: 1, scale: 1 }}
										viewport={{ once: true }}
										transition={{ delay: 0.3 + index * 0.1 }}
										className="group/social flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-semibold text-slate-300 transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20"
									>
										<span className="transition-transform duration-300 group-hover/social:rotate-12 group-hover/social:scale-110">
											{social.icon}
										</span>
										<span>{social.platform}</span>
										<ArrowUpRight className="h-4 w-4 opacity-0 transition-all duration-300 group-hover/social:opacity-100 group-hover/social:translate-x-1 group-hover/social:-translate-y-1" />
									</motion.a>
								))}
							</div>
						</div>
					</div>
				</motion.div>

				{/* Bottom CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="mt-16 text-center"
				>
					<div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
						<MessageCircle className="h-5 w-5 text-indigo-300" />
						<p className="text-sm text-slate-300">
							{t("contact.responseTime")}
						</p>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
