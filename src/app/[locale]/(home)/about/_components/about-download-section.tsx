"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Globe2, Play, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { clientEnv } from "@/lib/env/client-env";
import { routes } from "@/lib/routes";
import { useAboutMotion } from "./about-motion";

export function AboutDownloadSection() {
	const t = useTranslations("aboutUs");
	const locale = useLocale();
	const aboutMotion = useAboutMotion();
	const Arrow = isRtl(locale as Locale) ? ArrowLeft : ArrowRight;
	const playStoreUrl = clientEnv.app.playStoreUrl;

	return (
		<motion.section
			id="download"
			className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_80%_15%,#02656b,transparent_42%),radial-gradient(circle_at_12%_105%,rgba(94,207,173,.18),transparent_38%),linear-gradient(130deg,#3b2621,#3b2621)] px-6 py-12 text-center text-white shadow-[0_32px_76px_-44px_rgba(14,19,49,.72)] sm:rounded-[34px] sm:px-10 sm:py-16">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute -start-16 -top-28 size-72 rounded-full border-[45px] border-white/[.035]"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute -end-20 -bottom-28 size-72 rounded-full border-[40px] border-white/[.03]"
				/>

				<div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3.5 py-1.5 text-xs font-bold text-[#afa5a6] backdrop-blur">
					<Sparkles className="size-3.5" />
					<span>{t("download.badge")}</span>
				</div>

				<h2 className="mx-auto mt-5 max-w-2xl text-2xl font-black leading-[1.45] tracking-tight text-white sm:text-3xl lg:text-4xl">
					{t("download.title")}
				</h2>

				<p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-white/65 sm:text-base">
					{t("download.subtitle")}
				</p>

				<div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
					<Link
						href={routes.courses.page()}
						className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#afa5a6] px-6 py-3.5 text-sm font-extrabold text-[#3b2621] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#afa5a6] sm:w-auto"
					>
						<Globe2 className="size-4" />
						<span>{t("download.webCta")}</span>
						<Arrow className="size-4" />
					</Link>

					<a
						href={playStoreUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/[.07] px-6 py-2.5 text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[.13] sm:w-auto"
					>
						<Play className="size-5 fill-current text-[#afa5a6]" />
						<div className="text-start">
							<p className="text-[10px] leading-none text-white/60">
								{t("download.stores.googlePlay.label")}
							</p>
							<p className="mt-1 text-sm font-extrabold leading-none text-white">
								{t("download.stores.googlePlay.name")}
							</p>
						</div>
					</a>
				</div>
			</div>
		</motion.section>
	);
}
