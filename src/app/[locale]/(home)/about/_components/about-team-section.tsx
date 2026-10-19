"use client";

// src/app/[locale]/(home)/about/_components/about-team-section.tsx

import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowRight,
	ChevronDown,
	ExternalLink,
	Mail,
	MapPin,
	Phone,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
	FacebookIcon,
	InstagramIcon,
	TwitterIcon,
} from "@/components/blocks/navbar/icons/social-icons";
import { cn } from "@/lib/utils";

type SocialLink = {
	platform: string;
	url: string;
};

type TeamMember = {
	id: string;
	name: string;
	role: string;
	imageUrl: string;
	email?: string;
	phone?: string;
	location?: string;
	shortBio: string;
	fullBio: string;
	socialLinks: SocialLink[];
};

export function AboutTeamSection() {
	const t = useTranslations("aboutUs");
	const membersRaw = t.raw("team.members");
	const members = Array.isArray(membersRaw) ? (membersRaw as TeamMember[]) : [];
	const [expandedMember, setExpandedMember] = useState<string | null>(null);

	const socialIcons: Record<string, React.ReactNode> = {
		twitter: <TwitterIcon className="h-4 w-4" />,
		instagram: <InstagramIcon className="h-4 w-4" />,
		facebook: <FacebookIcon className="h-4 w-4" />,
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.15,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 30 },
		show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
	};

	return (
		<section className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 text-white lg:py-28">
			{/* Animated gradient orbs */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
				<div
					className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			<div className="relative mx-auto max-w-7xl px-6">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="mb-20 text-center"
				>
					<motion.div
						initial={{ scale: 0.9 }}
						whileInView={{ scale: 1 }}
						viewport={{ once: true }}
						className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-5 py-2 text-sm font-semibold text-indigo-300 backdrop-blur-sm"
					>
						<span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
						{t("team.badge")}
					</motion.div>

					<h2 className="mx-auto max-w-4xl text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
						<span className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
							{t("team.title")}
						</span>
					</h2>

					<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
						{t("team.subtitle")}
					</p>
				</motion.div>

				{/* Featured Member - Hero Section */}
				{members.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
						className="mb-16"
					>
						<div className="group relative overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-1 shadow-2xl backdrop-blur-xl">
							<div className="relative overflow-hidden rounded-[2.85rem] bg-slate-950/50">
								<div className="grid lg:grid-cols-2">
									{/* Image Side */}
									<div className="relative h-[400px] lg:h-[600px] overflow-hidden">
										<Image
											src={members[0].imageUrl}
											alt={members[0].name}
											fill
											sizes="(max-width: 1024px) 100vw, 50vw"
											className="object-cover transition-transform duration-700 group-hover:scale-105"
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
										<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-fuchsia-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

										{/* Floating Badge */}
										<div className="absolute top-8 left-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
											<span className="flex h-2 w-2 items-center justify-center">
												<span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
											</span>
											{members[0].role}
										</div>
									</div>

									{/* Content Side */}
									<div className="relative flex flex-col justify-center p-8 lg:p-12">
										<div className="space-y-6">
											<div>
												<h3 className="text-4xl font-black text-white lg:text-5xl">
													{members[0].name}
												</h3>
												<p className="mt-3 text-xl font-semibold text-indigo-300">
													{members[0].role}
												</p>
											</div>

											<p className="text-base leading-7 text-slate-300">
												{members[0].shortBio}
											</p>

											{/* Contact Info */}
											<div className="space-y-3">
												{members[0].email && (
													<a
														href={`mailto:${members[0].email}`}
														className="flex items-center gap-3 text-sm text-slate-400 transition-colors hover:text-indigo-300"
													>
														<Mail className="h-4 w-4" />
														{members[0].email}
													</a>
												)}
												{members[0].phone && (
													<div className="flex items-center gap-3 text-sm text-slate-400">
														<Phone className="h-4 w-4" />
														{members[0].phone}
													</div>
												)}
												{members[0].location && (
													<div className="flex items-center gap-3 text-sm text-slate-400">
														<MapPin className="h-4 w-4" />
														{members[0].location}
													</div>
												)}
											</div>

											{/* Social Links */}
											{members[0].socialLinks &&
												members[0].socialLinks.length > 0 && (
													<div className="flex flex-wrap gap-2">
														{members[0].socialLinks.map((link) => (
															<a
																key={link.platform}
																href={link.url}
																target="_blank"
																rel="noreferrer"
																className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 hover:scale-110 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white"
																title={link.platform}
																aria-label={link.platform}
															>
																{socialIcons[link.platform.toLowerCase()] || (
																	<ExternalLink
																		className="h-4 w-4"
																		aria-hidden="true"
																	/>
																)}
															</a>
														))}
													</div>
												)}

											<div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
												<p className="text-sm leading-7 text-slate-300">
													{members[0].fullBio}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				)}

				{/* Other Team Members Grid */}
				{members.length > 1 && (
					<motion.div
						variants={containerVariants}
						initial="hidden"
						whileInView="show"
						viewport={{ once: true }}
						className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
					>
						{members.slice(1).map((member) => (
							<motion.div
								key={member.id}
								variants={itemVariants}
								className="group relative"
							>
								<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-1 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/20">
									<div className="relative overflow-hidden rounded-[1.4rem] bg-slate-950/60">
										{/* Image */}
										<div className="relative h-72 overflow-hidden">
											<Image
												src={member.imageUrl}
												alt={member.name}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												className="object-cover transition-transform duration-700 group-hover:scale-110"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

											{/* Role Badge */}
											<div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
												{member.role}
											</div>
										</div>

										{/* Content */}
										<div className="space-y-4 p-6">
											<div>
												<h3 className="text-2xl font-bold text-white">
													{member.name}
												</h3>
											</div>

											<p className="line-clamp-3 text-sm leading-6 text-slate-300">
												{member.shortBio}
											</p>

											{/* Contact Info */}
											<div className="space-y-2">
												{member.email && (
													<a
														href={`mailto:${member.email}`}
														className="flex items-center gap-2 text-xs text-slate-400 transition-colors hover:text-indigo-300"
													>
														<Mail className="h-3.5 w-3.5" />
														<span className="truncate">{member.email}</span>
													</a>
												)}
												{member.location && (
													<div className="flex items-center gap-2 text-xs text-slate-400">
														<MapPin className="h-3.5 w-3.5" />
														{member.location}
													</div>
												)}
											</div>

											{/* Social Links */}
											{member.socialLinks && member.socialLinks.length > 0 && (
												<div className="flex flex-wrap gap-2">
													{member.socialLinks.slice(0, 3).map((link) => (
														<a
															key={link.platform}
															href={link.url}
															target="_blank"
															rel="noreferrer"
															className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 hover:scale-110 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white"
															title={link.platform}
															aria-label={link.platform}
														>
															{socialIcons[link.platform.toLowerCase()] || (
																<ExternalLink
																	className="h-4 w-4"
																	aria-hidden="true"
																/>
															)}
														</a>
													))}
													{member.socialLinks.length > 3 && (
														<div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-400">
															+{member.socialLinks.length - 3}
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				)}
			</div>
		</section>
	);
}
