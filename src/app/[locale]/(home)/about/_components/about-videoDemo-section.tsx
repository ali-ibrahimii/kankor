"use client";

import { motion } from "framer-motion";
import { BarChart3, Clock, Play, Sparkles, WifiOff, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAboutMotion } from "./about-motion";

interface AboutVideoSectionProps {
	videoId?: string;
	thumbnailUrl?: string;
}

export function AboutVideoSection({
	videoId = "2REnqD3JLtQ",
	thumbnailUrl = "/og-image.png",
}: AboutVideoSectionProps) {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();
	const [isPlaying, setIsPlaying] = useState(false);

	const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

	const highlights = [
		{
			key: "feature1",
			icon: Sparkles,
			title: t("video.feature1Title"),
			desc: t("video.feature1Desc"),
		},
		{
			key: "feature2",
			icon: WifiOff,
			title: t("video.feature2Title"),
			desc: t("video.feature2Desc"),
		},
		{
			key: "feature3",
			icon: BarChart3,
			title: t("video.feature3Title"),
			desc: t("video.feature3Desc"),
		},
	] as const;

	return (
		<motion.section
			id="demo"
			className="scroll-mt-32 mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-10 lg:scroll-mt-36 lg:px-8"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1a2c] bg-[radial-gradient(circle_at_8%_108%,rgba(94,207,173,.2),transparent_38%),radial-gradient(circle_at_90%_-8%,rgba(137,100,255,.34),transparent_42%),linear-gradient(125deg,#0f1a2c_4%,#16223a_58%,#20223f_100%)] px-5 py-10 text-white shadow-[0_34px_80px_-46px_rgba(14,19,49,.7)] sm:rounded-[34px] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,.12)_0.7px,transparent_0.7px)] bg-size-[24px_24px]"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute -start-20 -top-24 -z-10 size-72 rounded-full border-[42px] border-white/[.03]"
				/>

				{/* Header */}
				<div className="mx-auto max-w-2xl text-center">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur">
						<Play className="size-3.5 fill-current text-[#b7f486]" />
						{t("video.badge")}
					</span>

					<h2 className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-white sm:text-3xl lg:text-4xl">
						{t("video.title")}
					</h2>

					<p className="mt-3 text-sm leading-8 text-white/65 sm:text-base">
						{t("video.subtitle")}
					</p>
				</div>

				{/* Contained 16:9 Cinema Frame */}
				<div className="mx-auto mt-9 max-w-4xl sm:mt-11">
					<div className="overflow-hidden rounded-[22px] border border-white/14 bg-[#09101f] shadow-[0_30px_70px_-32px_rgba(0,0,0,.75)] sm:rounded-[26px]">
						<div className="relative aspect-video">
							{!isPlaying ? (
								<div className="group relative size-full">
									<Image
										src={thumbnailUrl}
										alt={t("video.title")}
										fill
										sizes="(max-width: 1024px) 100vw, 896px"
										className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
									/>
									<div
										aria-hidden="true"
										className="absolute inset-0 bg-linear-to-t from-[#09101f]/85 via-[#09101f]/35 to-[#09101f]/25 transition-opacity duration-300 group-hover:opacity-90"
									/>

									<button
										type="button"
										onClick={() => setIsPlaying(true)}
										aria-label={t("video.playButton")}
										className="absolute inset-0 flex flex-col items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f486] focus-visible:ring-inset"
									>
										<span className="flex size-16 items-center justify-center rounded-full bg-[#b7f486] text-[#17233a] shadow-[0_18px_45px_rgba(0,0,0,.45)] ring-8 ring-white/10 transition duration-300 group-hover:scale-105 group-hover:bg-[#c9f8a2] sm:size-20">
											<Play className="size-7 translate-x-0.5 fill-current sm:size-8" />
										</span>
										<span className="rounded-full border border-white/15 bg-[#0f1a2c]/75 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
											{t("video.playButton")}
										</span>
									</button>

									{/* Duration Pill */}
									<div className="pointer-events-none absolute bottom-3.5 start-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0f1a2c]/80 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md sm:bottom-5 sm:start-5">
										<Clock className="size-3.5 text-[#b7f486]" />
										<span>{t("video.duration")}</span>
									</div>
								</div>
							) : (
								<div className="relative size-full">
									<iframe
										src={embedUrl}
										title={t("video.title")}
										className="size-full"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
									/>
									<button
										type="button"
										onClick={() => setIsPlaying(false)}
										aria-label={t("video.closeButton")}
										className="absolute end-3.5 top-3.5 flex size-9 items-center justify-center rounded-full border border-white/20 bg-[#09101f]/80 text-white backdrop-blur-md transition hover:bg-[#09101f]"
									>
										<X className="size-4" />
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* 3 Glass Feature Highlights */}
				<div className="mx-auto mt-8 grid max-w-4xl gap-3.5 sm:grid-cols-3 sm:gap-4">
					{highlights.map(({ key, icon: Icon, title, desc }) => (
						<div
							key={key}
							className="rounded-2xl border border-white/10 bg-white/[.055] p-5 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[.08]"
						>
							<div className="flex items-center gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#b7f486]/14 text-[#b7f486]">
									<Icon className="size-4" />
								</span>
								<h3 className="text-sm font-extrabold text-white">{title}</h3>
							</div>
							<p className="mt-2.5 text-xs leading-7 text-white/65">{desc}</p>
						</div>
					))}
				</div>
			</div>
		</motion.section>
	);
}
