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
import type { HubCourseItem } from "./course-hub-data";

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
		<div className="mx-auto w-full max-w-[440px]">
			<article className="overflow-hidden rounded-[22px] bg-card shadow-[0_28px_60px_-30px_rgba(4,10,25,.55)] ring-1 ring-white/10">
				<Link
					href={course.href}
					aria-label={t("openFeaturedCourse", { title: course.title })}
					className="group relative block aspect-[16/10] overflow-hidden bg-slate-200"
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

				<div className="space-y-3 p-4">
					<p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
						{course.subtitle}
					</p>

					<div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
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
						className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#b7f486] px-4 py-2 text-xs font-black text-[#17233a] transition hover:bg-[#c9f8a2]"
					>
						{t("startCourseBtn")}
						<NextIcon className="size-4" aria-hidden="true" />
					</Link>
				</div>
			</article>

			{courses.length > 1 && (
				<div className="mt-3 flex items-center justify-center gap-2">
					<button
						type="button"
						onClick={previous}
						aria-label={t("previousFeaturedCourse")}
						className="inline-flex size-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/75 backdrop-blur transition hover:bg-white/20 hover:text-white"
					>
						<PreviousIcon className="size-3.5" aria-hidden="true" />
					</button>

					<div
						role="group"
						aria-label={t("featuredCoursePagination")}
						className="flex items-center gap-1.5 px-1"
					>
						{courses.map((item, index) => (
							<button
								key={item.id}
								type="button"
								onClick={() => setActiveIndex(index)}
								aria-label={t("selectFeaturedCourse", { title: item.title })}
								aria-pressed={index === activeIndex}
								className={cn(
									"h-1.5 rounded-full transition-all",
									index === activeIndex
										? "w-5 bg-[#b7f486]"
										: "w-1.5 bg-white/30 hover:bg-white/60"
								)}
							/>
						))}
					</div>

					<button
						type="button"
						onClick={next}
						aria-label={t("nextFeaturedCourse")}
						className="inline-flex size-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/75 backdrop-blur transition hover:bg-white/20 hover:text-white"
					>
						<NextIcon className="size-3.5" aria-hidden="true" />
					</button>
				</div>
			)}
		</div>
	);
}
