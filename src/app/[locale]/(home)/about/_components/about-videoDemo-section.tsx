"use client";

import { motion } from "framer-motion";
import { Play, Volume2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface AboutVideoSectionProps {
	videoId?: string;
	thumbnailUrl?: string;
}

export function AboutVideoSection({
	videoId,
	thumbnailUrl,
}: AboutVideoSectionProps) {
	const t = useTranslations("aboutUs");
	const [isPlaying, setIsPlaying] = useState(false);

	const handlePlay = () => setIsPlaying(true);
	const handleClose = () => setIsPlaying(false);

	return (
		<section
			id="demo"
			className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 text-white lg:py-28"
		>
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
				<div
					className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			<div className="relative mx-auto max-w-6xl px-6">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="mb-12 text-center"
				>
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-5 py-2 text-sm font-semibold text-indigo-300 backdrop-blur-sm">
						<Play className="h-4 w-4" />
						{t("video.badge")}
					</div>

					<h2 className="mx-auto max-w-4xl text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
						<span className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
							{t("video.title")}
						</span>
					</h2>

					<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
						{t("video.subtitle")}
					</p>
				</motion.div>

				{/* Video Container */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="relative mx-auto max-w-5xl"
				>
					<div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-1 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:shadow-indigo-500/20">
						<div className="relative aspect-video overflow-hidden rounded-lg bg-slate-950">
							{!isPlaying ? (
								<>
									{/* Thumbnail */}
									<div className="absolute inset-0">
										<img
											src={
												thumbnailUrl ||
												`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
											}
											alt={t("video.title")}
											className="h-full w-full object-cover"
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
									</div>

									{/* Play Button */}
									<button
										onClick={handlePlay}
										className="group/btn absolute inset-0 flex items-center justify-center"
										aria-label={t("video.playButton")}
									>
										<motion.div
											initial={{ scale: 1 }}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.95 }}
											className="relative"
										>
											<div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30" />
											<div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500/20" />
											<div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-2xl shadow-indigo-500/50 transition-all duration-300 group-hover/btn:shadow-indigo-500/70 md:size-24">
												<Play className="h-8 w-8 text-white fill-white md:h-10 md:w-10" />
											</div>
										</motion.div>
									</button>

									{/* Duration Info */}
									<div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
										<div className="flex items-center gap-3 text-sm text-slate-300">
											<Volume2 className="h-4 w-4" />
											<span>{t("video.duration")}</span>
										</div>
									</div>
								</>
							) : (
								<>
									{/* YouTube Embed */}
									<iframe
										src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
										title={t("video.title")}
										className="absolute inset-0 h-full w-full"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
									/>
									<button
										onClick={handleClose}
										className="absolute end-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-slate-950/80 text-white backdrop-blur-sm transition-all hover:bg-slate-950"
										aria-label={t("video.closeButton")}
									>
										<X className="h-5 w-5" />
									</button>
								</>
							)}
						</div>
					</div>
					<div className="absolute -bottom-6 start-1/2 -z-10 h-32 w-3/4 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
				</motion.div>

				{/* Features */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="mt-16 grid gap-6 md:grid-cols-3"
				>
					{[
						{ title: t("video.feature1Title"), desc: t("video.feature1Desc") },
						{ title: t("video.feature2Title"), desc: t("video.feature2Desc") },
						{ title: t("video.feature3Title"), desc: t("video.feature3Desc") },
					].map((feature, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
							className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
						>
							<h3 className="mb-2 text-lg font-bold text-white">
								{feature.title}
							</h3>
							<p className="text-sm leading-6 text-slate-400">{feature.desc}</p>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
