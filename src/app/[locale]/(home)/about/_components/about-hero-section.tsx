"use client";

import {
	ArrowLeft,
	ArrowRight,
	Globe2,
	GraduationCap,
	Play,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { routes } from "@/lib/routes";

export function AboutHeroSection({ isRtl }: { isRtl: boolean }) {
	const t = useTranslations("aboutUs");
	const Arrow = isRtl ? ArrowLeft : ArrowRight;

	return (
		<section className="relative overflow-hidden bg-[#060A1A] text-white">
			<div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_88%_24%,rgba(99,102,241,0.36),transparent_36%),radial-gradient(circle_at_54%_92%,rgba(14,165,233,0.2),transparent_42%)]" />
			<div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.2)_1px,transparent_1px)] [background-size:36px_36px]" />
			<div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/35 to-transparent" />

			<div className="relative mx-auto grid max-w-7xl gap-14 px-6  lg:grid-cols-[1fr_0.92fr] lg:items-center lg:py-28">
				<div>
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold text-slate-100 backdrop-blur">
						<GraduationCap className="h-4 w-4 text-cyan-300" />
						{t("hero.badge")}
					</span>

					<h1 className="mt-7 max-w-2xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
						<span className="bg-gradient-to-r from-cyan-200 via-sky-100 to-indigo-100 bg-clip-text text-transparent">
							{t("hero.title")}
						</span>
					</h1>

					<p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
						{t("hero.subtitle")}
					</p>

					<div className="mt-10 flex flex-wrap gap-4">
						<a
							href={routes.courses.page()}
							className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-7 py-3.5 font-semibold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-cyan-200"
						>
							{t("hero.cta.primary")}
							<Arrow className="h-4 w-4" />
						</a>
						<a
							href={routes.home.page()}
							className="group inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15"
						>
							<span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition group-hover:bg-white/25">
								<Play className="h-3.5 w-3.5 fill-current" />
							</span>
							{t("hero.cta.secondary")}
						</a>
					</div>

					<div className="mt-10 flex flex-wrap gap-3 text-sm">
						<div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">
							<ShieldCheck className="h-4 w-4" />
							{t("features.offline.title")}
						</div>
						<div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-sky-100">
							<Globe2 className="h-4 w-4" />
							{t("features.sync.title")}
						</div>
					</div>
				</div>

				<div className="relative mx-auto w-full max-w-[520px]">
					<div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/45 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl md:p-8">
						<div className="mb-6 flex items-center justify-between">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
								Learning Signal
							</p>
							<div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200">
								<Sparkles className="h-3.5 w-3.5 text-cyan-300" />
								Live
							</div>
						</div>

						<div className="relative flex min-h-[260px] items-center justify-center">
							<div className="absolute size-[260px] rounded-full border border-cyan-200/25" />
							<div className="absolute size-[190px] rounded-full border border-indigo-200/25" />
							<div className="absolute size-[126px] rounded-full border border-sky-200/30 bg-sky-300/10 backdrop-blur-sm" />

							<div className="absolute -left-2 top-5 rounded-2xl border border-white/15 bg-slate-900/70 px-4 py-3 text-start shadow-xl">
								<p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
									{t("stats.value.students")}
								</p>
								<p className="mt-1 text-xl font-bold text-cyan-100">1M+</p>
							</div>

							<div className="absolute -right-2 top-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-slate-900/70 px-4 py-3 text-start shadow-xl">
								<p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
									{t("stats.value.courses")}
								</p>
								<p className="mt-1 text-xl font-bold text-indigo-100">50K+</p>
							</div>

							<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-2xl border border-white/15 bg-slate-900/70 px-4 py-3 text-center shadow-xl">
								<p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
									{t("stats.value.rating")}
								</p>
								<p className="mt-1 text-xl font-bold text-emerald-100">4.9★</p>
							</div>
						</div>

						<div className="mt-6 grid gap-3 sm:grid-cols-2">
							<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
								<p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
									{t("features.offline.title")}
								</p>
								<p className="mt-2 text-sm text-slate-200">
									{t("features.offline.desc")}
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
								<p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
									{t("features.sync.title")}
								</p>
								<p className="mt-2 text-sm text-slate-200">
									{t("features.sync.desc")}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
