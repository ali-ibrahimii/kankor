"use client";

import { motion } from "framer-motion";
import {
	ChevronDown,
	Globe2,
	Mail,
	MapPin,
	Sparkles,
	Users,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ABOUT_TONE_CYCLE, ABOUT_TONES, useAboutMotion } from "./about-motion";

interface SocialLink {
	platform: string;
	url: string;
}

interface TeamMember {
	id: string;
	name: string;
	role: string;
	imageUrl?: string;
	email?: string;
	phone?: string;
	location?: string;
	shortBio: string;
	fullBio?: string;
	socialLinks?: SocialLink[];
}

/**
 * Per-asset portrait framing for files verified in `public/`.
 * Missing or legacy paths (e.g. `/img/team/4.jpg`) render a crisp monogram tile.
 */
const VERIFIED_PORTRAITS: Record<string, string> = {
	"/team-ali.png":
		"scale-[2.25] origin-[50%_13%] object-cover object-[50%_12%]",
	"/team-nilo.png": "object-cover object-[50%_18%]",
	"/team-sara.jpg":
		"scale-[2.25] origin-[50%_13%] object-cover object-[50%_12%]",
};

function SocialGlyph({ platform, url }: { platform: string; url: string }) {
	const token = `${platform} ${url}`.toLowerCase();

	if (
		token.includes("twitter") ||
		token.includes("x.com") ||
		token.includes("توییتر") ||
		token.includes("ټویټر")
	) {
		return (
			<svg
				viewBox="0 0 24 24"
				fill="currentColor"
				className="size-3.5"
				aria-hidden="true"
			>
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
			</svg>
		);
	}

	if (
		token.includes("instagram") ||
		token.includes("اینستاگرام") ||
		token.includes("انسټاګرام")
	) {
		return (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="size-3.5"
				aria-hidden="true"
			>
				<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
				<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
				<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
			</svg>
		);
	}

	if (token.includes("facebook") || token.includes("فیسبوک")) {
		return (
			<svg
				viewBox="0 0 24 24"
				fill="currentColor"
				className="size-3.5"
				aria-hidden="true"
			>
				<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
			</svg>
		);
	}

	return <Globe2 className="size-3.5" aria-hidden="true" />;
}

function getMemberInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "•";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0] ?? ""}\u200C${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function TeamMemberAvatar({
	member,
	toneIcon,
}: {
	member: TeamMember;
	toneIcon: string;
}) {
	const [failed, setFailed] = useState(false);
	const portraitClass = member.imageUrl
		? VERIFIED_PORTRAITS[member.imageUrl]
		: undefined;
	const showImage = Boolean(member.imageUrl && portraitClass && !failed);

	return (
		<div className="relative size-20 shrink-0 overflow-hidden rounded-[22px] border-4 border-white bg-white shadow-md shadow-slate-900/8 dark:border-[#3b2621] dark:bg-[#3b2621]">
			{showImage && member.imageUrl ? (
				<Image
					src={member.imageUrl}
					alt={member.name}
					fill
					sizes="240px"
					onError={() => setFailed(true)}
					className={portraitClass}
				/>
			) : (
				<div
					className={cn(
						"flex size-full items-center justify-center text-xl font-black tracking-tight",
						toneIcon
					)}
				>
					{getMemberInitials(member.name)}
				</div>
			)}
		</div>
	);
}

export function AboutTeamSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const raw = t.raw("team.members");
	const members: TeamMember[] = Array.isArray(raw) ? raw : [];

	if (members.length === 0) return null;

	return (
		<motion.section
			id="team"
			className="scroll-mt-32 py-16 sm:py-20 lg:scroll-mt-36 lg:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* Split Header + Culture Note */}
				<div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
					<div className="max-w-2xl">
						<span className="section-kicker">
							<Users className="size-3.5" />
							{t("team.badge")}
						</span>
						<h2 className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-[#3b2621] sm:text-3xl lg:text-4xl dark:text-slate-100">
							{t("team.title")}
						</h2>
						<p className="mt-3 text-sm leading-8 text-slate-500 sm:text-base dark:text-slate-400">
							{t("team.subtitle")}
						</p>
					</div>

					<div className="soft-card max-w-md border-[#e8eeea] bg-white px-5 py-4 dark:border-white/10 dark:bg-[#3b2621]">
						<div className="flex items-start gap-3">
							<span
								className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${ABOUT_TONES.violet.icon}`}
							>
								<Sparkles className="size-4" />
							</span>
							<div className="min-w-0">
								<p className="text-xs font-extrabold text-[#3b2621] sm:text-sm dark:text-slate-100">
									{t("team.panelTitle")}
								</p>
								<p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
									{t("team.panelDesc")}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* 4 Unified Editorial Member Cards */}
				<motion.div
					className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
					variants={aboutMotion.stagger}
					initial="hidden"
					whileInView="show"
					viewport={aboutMotion.viewport}
				>
					{members.map((member, idx) => {
						const tone =
							ABOUT_TONES[ABOUT_TONE_CYCLE[idx % ABOUT_TONE_CYCLE.length]];
						const isExpanded = expandedId === member.id;
						const hasExtraBio =
							Boolean(member.fullBio) && member.fullBio !== member.shortBio;

						return (
							<motion.article
								key={member.id}
								variants={aboutMotion.card}
								className="soft-card card-hover group flex flex-col overflow-hidden border-[#e8eeea] bg-white dark:border-white/10 dark:bg-[#3b2621]"
							>
								{/* Soft Pastel Studio Banner */}
								<div className={`relative h-20 bg-linear-to-br ${tone.banner}`}>
									<div
										aria-hidden="true"
										className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${tone.bar} opacity-75`}
									/>
									{member.location && (
										<span className="absolute end-3.5 top-3.5 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-600 backdrop-blur-sm dark:border-white/10 dark:bg-[#251c19]/70 dark:text-slate-300">
											<MapPin className="size-3 text-primary" />
											{member.location}
										</span>
									)}
								</div>

								{/* Card Body */}
								<div className="flex flex-1 flex-col px-6 pb-6">
									<div className="-mt-10 flex items-end justify-between gap-3">
										<TeamMemberAvatar member={member} toneIcon={tone.icon} />

										{hasExtraBio && (
											<button
												type="button"
												onClick={() =>
													setExpandedId(isExpanded ? null : member.id)
												}
												aria-expanded={isExpanded}
												aria-label={member.name}
												className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50 text-slate-500 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-white/10 dark:bg-white/[.05] dark:text-slate-400 dark:hover:text-violet-200"
											>
												<ChevronDown
													className={cn(
														"size-4 transition-transform duration-200",
														isExpanded && "rotate-180"
													)}
												/>
											</button>
										)}
									</div>

									<h3 className="mt-4 text-lg font-extrabold text-[#3b2621] dark:text-slate-100">
										{member.name}
									</h3>

									<p className="mt-1 text-xs font-bold text-primary dark:text-violet-300">
										{member.role}
									</p>

									<p className="mt-3 flex-1 text-xs leading-7 text-slate-500 sm:text-[13px] dark:text-slate-400">
										{isExpanded && member.fullBio
											? member.fullBio
											: member.shortBio}
									</p>

									{/* Footer Links */}
									{(member.email || (member.socialLinks?.length ?? 0) > 0) && (
										<div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-white/[.08]">
											<div className="flex items-center gap-1.5">
												{member.socialLinks?.map((social) => (
													<a
														key={`${member.id}-${social.platform}`}
														href={social.url}
														target="_blank"
														rel="noopener noreferrer"
														aria-label={`${member.name} — ${social.platform}`}
														className="flex size-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/80 text-slate-500 transition hover:border-primary/35 hover:bg-primary/6 hover:text-primary dark:border-white/10 dark:bg-white/[.04] dark:text-slate-400 dark:hover:border-violet-400/40 dark:hover:text-violet-200"
													>
														<SocialGlyph
															platform={social.platform}
															url={social.url}
														/>
													</a>
												))}
											</div>

											{member.email && (
												<a
													href={`mailto:${member.email}`}
													aria-label={member.email}
													className="flex size-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/80 text-slate-500 transition hover:border-primary/35 hover:bg-primary/6 hover:text-primary dark:border-white/10 dark:bg-white/[.04] dark:text-slate-400 dark:hover:border-violet-400/40 dark:hover:text-violet-200"
												>
													<Mail className="size-3.5" />
												</a>
											)}
										</div>
									)}
								</div>
							</motion.article>
						);
					})}
				</motion.div>
			</div>
		</motion.section>
	);
}
