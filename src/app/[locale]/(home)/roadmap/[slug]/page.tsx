import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	CheckCircle2,
	Route,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CoverFillImage } from "@/components/blocks/course/cover-image";
import { getPublishedRoadmapBySlug } from "@/components/blocks/roadmap/actions";
import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import type { BaseParams } from "@/types/common.types";

/**
 * Public roadmap detail — the ordered course track of one published roadmap.
 */
export default async function RoadmapDetailPage({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { locale, slug } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "roadmap" });
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const result = await getPublishedRoadmapBySlug(slug);
	if (!result.success) notFound();
	const roadmap = result.data;
	if (!roadmap) notFound();

	const cover = resolveEntityCardImage({
		customSrc: roadmap.cover_image_url,
		text: roadmap.title,
		kind: "course",
		seed: roadmap.id,
	});

	return (
		<div className="min-h-screen bg-[#f8f9fd] px-4 pt-8 pb-12 text-[#19243b] sm:px-6 sm:pt-12 sm:pb-20 lg:px-8 dark:bg-background dark:text-foreground">
			<div className="mx-auto max-w-5xl">
				<Link
					href={routes.roadmap.page()}
					className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:opacity-80"
				>
					<Arrow className="size-4 rotate-180" />
					{t("detail.backToAll")}
				</Link>

				<header className="relative mt-6 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_80%_0%,rgba(124,229,209,.2),transparent_32%),linear-gradient(125deg,#101a2c,#292747)] px-6 py-12 text-white sm:px-12 sm:py-16">
					<div className="absolute -end-12 -top-16 size-56 rounded-full border-[35px] border-white/[.06]" />
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-2 text-xs font-bold text-[#b7f486]">
						<Route className="size-4" />
						{t("detail.trackLabel")}
					</span>
					<h1 className="mt-6 max-w-3xl text-3xl font-black leading-[1.5] sm:text-5xl">
						{roadmap.title}
					</h1>
					{roadmap.description ? (
						<p className="mt-4 max-w-2xl text-sm leading-8 text-white/70 sm:text-base">
							{roadmap.description}
						</p>
					) : null}
					<p className="mt-7 text-xs font-semibold text-white/60">
						{t("coursesCount", { count: roadmap.roadmap_items.length })}
					</p>
				</header>

				{roadmap.roadmap_items.length === 0 ? (
					<section className="mt-10 rounded-[24px] border border-[#e8eaf1] bg-white p-8 text-center dark:border-border dark:bg-card">
						<p className="text-sm leading-7 text-slate-500 dark:text-muted-foreground">
							{t("detail.emptyItems")}
						</p>
					</section>
				) : (
					<section className="relative mx-auto mt-10 max-w-4xl">
						<div className="absolute bottom-8 start-[25px] top-8 w-px bg-gradient-to-b from-violet-300 via-emerald-300 to-transparent sm:start-[31px]" />
						<ol className="space-y-4">
							{roadmap.roadmap_items.map((item, index) => {
								const courseSlug = item.course?.slug ?? null;
								const inner = (
									<article className="relative flex gap-4 rounded-[24px] border border-[#e8eaf1] bg-white p-5 shadow-[0_18px_48px_-38px_rgba(31,41,75,.35)] sm:gap-6 sm:p-7 dark:border-border dark:bg-card">
										<div
											className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl ${index % 2 ? "bg-[#e4f7ed] text-[#288364]" : "bg-[#eee9ff] text-[#694bd2]"}`}
										>
											<span className="text-sm font-black">
												{t("detail.stepNumber", { number: index + 1 })}
											</span>
										</div>
										<div className="min-w-0 flex-1">
											<h2 className="text-lg font-extrabold sm:text-xl">
												{item.course?.title ?? t("courseFallback")}
											</h2>
											{item.note ? (
												<p className="mt-2 text-sm leading-7 text-slate-500">
													{item.note}
												</p>
											) : null}
											{courseSlug ? (
												<span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#6546cb]">
													<BookOpen className="size-4" />
													{t("detail.openCourse")}
												</span>
											) : null}
										</div>
										<CheckCircle2 className="hidden size-5 text-emerald-500 sm:block" />
									</article>
								);
								return (
									<li key={item.id}>
										{courseSlug ? (
											<Link
												href={routes.courses.slug.page({ slug: courseSlug })}
												className="block transition hover:opacity-90"
											>
												{inner}
											</Link>
										) : (
											inner
										)}
									</li>
								);
							})}
						</ol>
					</section>
				)}

				<footer className="mt-8 flex flex-col items-start justify-between gap-5 rounded-[24px] bg-[#eeecfa] p-6 sm:flex-row sm:items-center sm:p-8 dark:border dark:border-border dark:bg-card/80">
					<p className="max-w-xl text-sm leading-7 text-[#53566e] dark:text-muted-foreground">
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
