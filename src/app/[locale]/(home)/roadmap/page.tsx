import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	CheckCircle2,
	Compass,
	Flag,
	Sparkles,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import type { BaseParams } from "@/types/common.types";

export default async function RoadmapPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "roadmap" });
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;
	const steps = [1, 2, 3, 4, 5] as const;
	return (
		<div className="min-h-screen bg-[#f8f9fd] px-4 pt-8 pb-12 text-[#19243b] sm:px-6 sm:pt-12 sm:pb-20 lg:px-8">
			<div className="mx-auto max-w-5xl">
				<header className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_80%_0%,rgba(124,229,209,.2),transparent_32%),linear-gradient(125deg,#101a2c,#292747)] px-6 py-12 text-white sm:px-12 sm:py-16">
					<div className="absolute -end-12 -top-16 size-56 rounded-full border-[35px] border-white/[.06]" />
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-2 text-xs font-bold text-[#b7f486]">
						<Compass className="size-4" />
						{t("title")}
					</span>
					<h1 className="mt-6 max-w-3xl text-3xl font-black leading-[1.5] sm:text-5xl">
						{t("title")}
					</h1>
					<p className="mt-4 max-w-2xl text-sm leading-8 text-white/70 sm:text-base">
						{t("subtitle")}
					</p>
					<div className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-white/60">
						<Sparkles className="size-4 text-[#b7f486]" />5{" "}
						{locale === "en" ? "steps" : "مرحله"} ·{" "}
						{locale === "en"
							? "Learn at your own pace"
							: "با سرعت خودتان یاد بگیرید"}
					</div>
				</header>
				<section className="relative mx-auto mt-10 max-w-4xl">
					<div className="absolute bottom-8 start-[25px] top-8 w-px bg-gradient-to-b from-violet-300 via-emerald-300 to-transparent sm:start-[31px]" />
					<div className="space-y-4">
						{steps.map((step, index) => (
							<article
								key={step}
								className="relative flex gap-4 rounded-[24px] border border-[#e8eaf1] bg-white p-5 shadow-[0_18px_48px_-38px_rgba(31,41,75,.35)] sm:gap-6 sm:p-7"
							>
								<div
									className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl ${index % 2 ? "bg-[#e4f7ed] text-[#288364]" : "bg-[#eee9ff] text-[#694bd2]"}`}
								>
									<span className="text-sm font-black">
										{t(`steps.${index}.0`)}
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<h2 className="text-lg font-extrabold sm:text-xl">
										{t(`steps.${index}.1`)}
									</h2>
									<p className="mt-2 text-sm leading-7 text-slate-500">
										{t(`steps.${index}.2`)}
									</p>
								</div>
								{index === 4 ? (
									<Flag className="hidden size-5 text-amber-500 sm:block" />
								) : (
									<CheckCircle2 className="hidden size-5 text-emerald-500 sm:block" />
								)}
							</article>
						))}
					</div>
				</section>
				<footer className="mt-8 flex flex-col items-start justify-between gap-5 rounded-[24px] bg-[#eeecfa] p-6 sm:flex-row sm:items-center sm:p-8">
					<p className="max-w-xl text-sm leading-7 text-[#53566e]">
						{t("note")}
					</p>
					<Link
						href={routes.courses.page()}
						className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#6546cb] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#5234b8]"
					>
						<BookOpen className="size-4" />
						{t("cta")}
						<Arrow className="size-4" />
					</Link>
				</footer>
			</div>
		</div>
	);
}
