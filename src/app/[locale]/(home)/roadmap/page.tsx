import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	Compass,
	Route,
	Sparkles,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CoverFillImage } from "@/components/blocks/course/cover-image";
import { listPublishedRoadmaps } from "@/components/blocks/roadmap/actions";
import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import type { BaseParams } from "@/types/common.types";

/**
 * Public roadmaps page — the real, instructor/admin-authored learning paths
 * from the database. Each roadmap links to its detail page with the ordered
 * course list.
 */
export default async function RoadmapPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "roadmap" });
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const result = await listPublishedRoadmaps();
	const roadmaps = result.success ? result.data : [];

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
						<Sparkles className="size-4 text-[#b7f486]" />
						{t("heroMeta", { count: roadmaps.length })}
					</div>
				</header>

				{roadmaps.length === 0 ? (
					<section className="mt-10 rounded-[24px] border border-[#e8eaf1] bg-white p-8 text-center shadow-[0_18px_48px_-38px_rgba(31,41,75,.35)] sm:p-12">
						<h2 className="text-xl font-extrabold sm:text-2xl">
							{t("emptyTitle")}
						</h2>
						<p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
							{t("emptyBody")}
						</p>
						<Link
							href={routes.courses.page()}
							className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#6546cb] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#5234b8]"
						>
							<BookOpen className="size-4" />
							{t("cta")}
							<Arrow className="size-4" />
						</Link>
					</section>
				) : (
					<section className="mt-10 space-y-5">
						{roadmaps.map((roadmap) => {
							const cover = resolveEntityCardImage({
								customSrc: roadmap.cover_image_url,
								text: roadmap.title,
								kind: "course",
								seed: roadmap.id,
							});
							return (
								<article
									key={roadmap.id}
									className="relative overflow-hidden rounded-[24px] border border-[#e8eaf1] bg-white shadow-[0_18px_48px_-38px_rgba(31,41,75,.35)]"
								>
									<div className="flex flex-col sm:flex-row">
										<span className="relative block h-44 w-full overflow-hidden sm:h-auto sm:w-56 sm:shrink-0">
											<CoverFillImage
												src={cover}
												alt={roadmap.title}
												sizes="(max-width: 640px) 100vw, 224px"
												className="object-cover"
											/>
										</span>
										<div className="flex-1 p-5 sm:p-7">
											<div className="flex items-start gap-3">
												<div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eee9ff] text-[#694bd2]">
													<Route className="size-5" />
												</div>
												<div className="min-w-0 flex-1">
													<h2 className="text-lg font-extrabold sm:text-xl">
														{roadmap.title}
													</h2>
													{roadmap.description ? (
														<p className="mt-2 text-sm leading-7 text-slate-500">
															{roadmap.description}
														</p>
													) : null}
												</div>
											</div>

											{roadmap.roadmap_items.length > 0 ? (
												<ol className="mt-4 space-y-1.5">
													{roadmap.roadmap_items
														.slice(0, 4)
														.map((item, index) => (
															<li
																key={item.id}
																className="flex items-center gap-2 text-sm text-slate-600"
															>
																<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e4f7ed] font-bold text-[#288364] text-xs">
																	{index + 1}
																</span>
																<span className="truncate">
																	{item.course?.title ?? t("courseFallback")}
																</span>
															</li>
														))}
													{roadmap.roadmap_items.length > 4 ? (
														<li className="ps-8 text-slate-400 text-xs">
															{t("moreCourses", {
																count: roadmap.roadmap_items.length - 4,
															})}
														</li>
													) : null}
												</ol>
											) : null}

											<div className="mt-5 flex flex-wrap items-center gap-3">
												<Link
													href={routes.roadmap.slug.page({
														slug: roadmap.slug,
													})}
													className="inline-flex items-center gap-2 rounded-2xl bg-[#6546cb] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#5234b8]"
												>
													{t("viewRoadmap")}
													<Arrow className="size-4" />
												</Link>
												<span className="text-slate-400 text-xs">
													{t("coursesCount", {
														count: roadmap.roadmap_items.length,
													})}
												</span>
											</div>
										</div>
									</div>
								</article>
							);
						})}
					</section>
				)}

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
