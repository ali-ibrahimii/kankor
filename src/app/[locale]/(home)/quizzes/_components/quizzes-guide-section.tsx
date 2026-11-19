import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	ClipboardList,
	Sparkles,
	Timer,
	TrendingUp,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";

export async function QuizzesGuideSection({ locale }: { locale: Locale }) {
	const t = await getTranslations({ locale, namespace: "quizzes" });
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;
	const numberFormatter = new Intl.NumberFormat(locale, {
		minimumIntegerDigits: 2,
	});

	const steps = [
		{
			key: "step-1",
			icon: ClipboardList,
			title: t("hub.steps.item1Title"),
			desc: t("hub.steps.item1Desc"),
			iconClass:
				"bg-[#eee8ff] text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200",
			barClass: "from-[#6b4dd7] to-[#9b82ff]",
		},
		{
			key: "step-2",
			icon: Timer,
			title: t("hub.steps.item2Title"),
			desc: t("hub.steps.item2Desc"),
			iconClass:
				"bg-[#e1f6ec] text-[#258263] dark:bg-emerald-400/15 dark:text-emerald-200",
			barClass: "from-[#258263] to-[#5ecfad]",
		},
		{
			key: "step-3",
			icon: TrendingUp,
			title: t("hub.steps.item3Title"),
			desc: t("hub.steps.item3Desc"),
			iconClass:
				"bg-[#e6f1ff] text-[#3a79c2] dark:bg-sky-400/15 dark:text-sky-200",
			barClass: "from-[#3a79c2] to-[#68a8f0]",
		},
	] as const;

	return (
		<>
			{/* 3-Step Exam Readiness Strip */}
			<section className="border-y border-[#e9eaf2] bg-white/75 py-16 sm:py-20 dark:border-white/10 dark:bg-[#1b2438]/60">
				<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<span className="section-kicker">
							<Sparkles className="size-3.5" />
							{t("hub.steps.badge")}
						</span>
						<h2 className="mt-4 text-2xl font-black leading-[1.45] tracking-tight text-[#19243b] sm:text-3xl lg:text-4xl dark:text-slate-100">
							{t("hub.steps.title")}
						</h2>
						<p className="mt-3 text-sm leading-8 text-slate-500 sm:text-base dark:text-slate-400">
							{t("hub.steps.subtitle")}
						</p>
					</div>

					<div className="mt-11 grid gap-5 md:grid-cols-3 lg:gap-6">
						{steps.map(
							({ key, icon: Icon, title, desc, iconClass, barClass }, idx) => (
								<article
									key={key}
									className="soft-card card-hover group relative overflow-hidden border-[#e5e8f3] bg-white p-7 sm:p-8 dark:border-white/10 dark:bg-[#1b2438]"
								>
									<div
										aria-hidden="true"
										className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${barClass} opacity-75 transition-opacity group-hover:opacity-100`}
									/>
									<div className="flex items-start justify-between gap-4">
										<div
											className={`flex size-13 shrink-0 items-center justify-center rounded-[18px] ${iconClass}`}
										>
											<Icon className="size-6" />
										</div>
										<span
											aria-hidden="true"
											className="text-2xl font-black tracking-tight text-slate-200 transition-colors group-hover:text-primary/25 dark:text-white/10 dark:group-hover:text-primary/35"
										>
											{numberFormatter.format(idx + 1)}
										</span>
									</div>

									<h3 className="mt-6 text-lg font-extrabold text-[#19243b] sm:text-xl dark:text-slate-100">
										{title}
									</h3>
									<p className="mt-2.5 text-sm leading-8 text-slate-500 dark:text-slate-400">
										{desc}
									</p>
								</article>
							)
						)}
					</div>
				</div>
			</section>

			{/* Contained Deep-Navy Host / Prep CTA Banner */}
			<section className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
				<div className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_80%_15%,#413c82,transparent_42%),radial-gradient(circle_at_12%_105%,rgba(94,207,173,.18),transparent_38%),linear-gradient(130deg,#141f34,#222a46)] px-6 py-12 text-center text-white shadow-[0_32px_76px_-44px_rgba(14,19,49,.72)] sm:rounded-[34px] sm:px-10 sm:py-16">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -start-16 -top-28 size-72 rounded-full border-[45px] border-white/[.035]"
					/>

					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3.5 py-1.5 text-xs font-bold text-[#b7f486] backdrop-blur">
						<Sparkles className="size-3.5" />
						{t("hub.cta.badge")}
					</span>

					<h2 className="mx-auto mt-5 max-w-2xl text-2xl font-black leading-[1.45] tracking-tight text-white sm:text-3xl">
						{t("hub.cta.title")}
					</h2>

					<p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-white/65 sm:text-base">
						{t("hub.cta.subtitle")}
					</p>

					<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Link
							href={routes.auth.signup.page({ type: "instructor" })}
							className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b7f486] px-6 py-3 text-sm font-extrabold text-[#17233a] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#c9f8a2] sm:w-auto"
						>
							<span>{t("hub.cta.primary")}</span>
							<Arrow className="size-4" />
						</Link>

						<Link
							href={routes.courses.page()}
							className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.06] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-white/35 hover:bg-white/[.12] sm:w-auto"
						>
							<BookOpen className="size-4 text-[#b7f486]" />
							<span>{t("hub.cta.secondary")}</span>
						</Link>
					</div>
				</div>
			</section>
		</>
	);
}
