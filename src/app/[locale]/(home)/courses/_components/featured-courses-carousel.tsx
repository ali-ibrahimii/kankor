"use client";

import {
	ChevronLeft,
	ChevronRight,
	GraduationCap,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { HubCourseItem } from "./school-hub-data";

export function FeaturedCoursesCarousel({
	courses,
}: {
	courses: HubCourseItem[];
}) {
	const t = useTranslations("schoolHub");
	const locale = useLocale();
	const rtl = isRtl(locale);
	const [activeIndex, setActiveIndex] = useState(0);
	const course = courses[activeIndex];

	if (!course) return null;

	const PreviousIcon = rtl ? ChevronRight : ChevronLeft;
	const NextIcon = rtl ? ChevronLeft : ChevronRight;
	const previous = () =>
		setActiveIndex((index) => (index - 1 + courses.length) % courses.length);
	const next = () => setActiveIndex((index) => (index + 1) % courses.length);

	return (
		<div className="mx-auto w-full max-w-[520px]">
			<article className="overflow-hidden rounded-[24px] border border-border/75 bg-card shadow-[0_26px_65px_-40px_rgba(31,41,75,.55)]">
				<Link
					href={course.href}
					aria-label={t("openFeaturedCourse", { title: course.title })}
					className="group relative block aspect-[16/9] overflow-hidden bg-muted"
				>
					<Image
						src={resolveEntityCardImage({
							customSrc: course.imageSrc,
							text: `${course.categoryLabel} ${course.title}`,
							kind: "course",
							seed: course.id,
						})}
						alt={course.title}
						fill
						priority
						sizes="(max-width: 1024px) 100vw, 500px"
						className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
					/>
					<div
						aria-hidden="true"
						className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-slate-950/25"
					/>
					<span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/55 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-md">
						<Sparkles className="size-3.5 text-amber-300" aria-hidden="true" />
						{t("featuredBadge")}
					</span>
					<span className="absolute end-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm">
						{course.isFree
							? t("freeTag")
							: t("creditsTag", { credits: course.priceCredits })}
					</span>
					<div className="absolute inset-x-4 bottom-4 text-start text-white sm:inset-x-5 sm:bottom-5">
						<p className="text-xs font-semibold text-white/75">
							{course.categoryLabel}
						</p>
						<h2 className="mt-1 line-clamp-2 text-lg font-extrabold leading-snug sm:text-xl">
							{course.title}
						</h2>
					</div>
				</Link>

				<div className="space-y-3.5 p-4 sm:p-5">
					<p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
						{course.subtitle}
					</p>

					<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
						<span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-foreground">
							<GraduationCap
								className="size-4 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<span className="truncate">{course.instructorName}</span>
						</span>
						<span className="shrink-0 text-muted-foreground">
							{t("lessonsUnit", { count: course.lessonsCount })} ·{" "}
							{t("hoursUnit", { count: course.durationHours })}
						</span>
					</div>

					<Link
						href={course.href}
						className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
					>
						{t("startCourseBtn")}
						<NextIcon className="size-4" aria-hidden="true" />
					</Link>
				</div>
			</article>

			{courses.length > 1 && (
				<div className="mt-3 rounded-2xl border border-border/65 bg-background/80 p-2.5 shadow-sm backdrop-blur-sm">
					<div className="mb-2 flex items-center justify-between gap-2 px-1">
						<p className="text-[11px] font-semibold text-muted-foreground">
							{t("featuredCoursePosition", {
								current: activeIndex + 1,
								total: courses.length,
							})}
						</p>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={previous}
								aria-label={t("previousFeaturedCourse")}
								className="inline-flex size-7 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none"
							>
								<PreviousIcon className="size-4" aria-hidden="true" />
							</button>
							<button
								type="button"
								onClick={next}
								aria-label={t("nextFeaturedCourse")}
								className="inline-flex size-7 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none"
							>
								<NextIcon className="size-4" aria-hidden="true" />
							</button>
						</div>
					</div>

					<div
						role="group"
						aria-label={t("featuredCoursePagination")}
						className="flex snap-x gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					>
						{courses.map((item, index) => (
							<button
								key={item.id}
								type="button"
								onClick={() => setActiveIndex(index)}
								aria-label={t("selectFeaturedCourse", { title: item.title })}
								aria-pressed={index === activeIndex}
								className={cn(
									"flex min-w-[145px] max-w-[200px] snap-start items-center gap-2 rounded-xl border p-1.5 text-start transition-colors",
									index === activeIndex
										? "border-primary/50 bg-primary/5"
										: "border-border/60 bg-card hover:border-primary/30"
								)}
							>
								<span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
									<Image
										src={resolveEntityCardImage({
											customSrc: item.imageSrc,
											text: item.title,
											kind: "course",
											seed: item.id,
										})}
										alt=""
										fill
										aria-hidden="true"
										sizes="40px"
										className="object-cover"
									/>
								</span>
								<span className="line-clamp-2 text-[10px] font-semibold leading-snug text-foreground">
									{item.title}
								</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
