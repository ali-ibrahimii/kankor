"use client";

import { motion } from "framer-motion";
import { Apple, Play, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAboutMotion } from "./about-motion";

export function AboutDownloadSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();

	return (
		<motion.section
			id="download"
			className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_26%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#2563eb_100%)] text-white"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-size-[24px_24px]" />
			<div className="absolute -top-20 -inset-e-20 size-80 rounded-full bg-white/10 blur-3xl" />
			<div className="absolute -bottom-20 -inset-s-20 size-80 rounded-full bg-indigo-400/20 blur-3xl" />

			<div className="relative mx-auto max-w-5xl px-6 py-24 lg:py-28">
				<motion.div
					className="rounded-[2.25rem] border border-white/15 bg-white/10 p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl md:p-12"
					variants={aboutMotion.card}
				>
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
						<Sparkles className="h-4 w-4" /> {t("download.title")}
					</div>
					<h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
						{t("download.title")}
					</h2>
					<p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-sky-100/90 md:text-lg">
						{t("download.subtitle")}
					</p>

					<motion.div
						className="mt-10 flex flex-wrap justify-center gap-4"
						variants={aboutMotion.stagger}
						initial="hidden"
						whileInView="show"
						viewport={aboutMotion.viewport}
					>
						<motion.button
							variants={aboutMotion.item}
							className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-6 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/20 transition-transform hover:-translate-y-0.5 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
						>
							<Apple className="h-6 w-6" />
							<div className="text-start">
								<p className="text-[10px] leading-none text-white/55">
									{t("download.stores.appStore.label")}
								</p>
								<p className="text-sm font-bold leading-tight">
									{t("download.stores.appStore.name")}
								</p>
							</div>
						</motion.button>
						<motion.button
							variants={aboutMotion.item}
							className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-6 py-3.5 font-semibold text-slate-950 shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
						>
							<Play className="h-6 w-6 fill-current" />
							<div className="text-start">
								<p className="text-[10px] leading-none text-slate-500">
									{t("download.stores.googlePlay.label")}
								</p>
								<p className="text-sm font-bold leading-tight">
									{t("download.stores.googlePlay.name")}
								</p>
							</div>
						</motion.button>
					</motion.div>
				</motion.div>
			</div>
		</motion.section>
	);
}
