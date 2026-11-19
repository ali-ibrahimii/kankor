"use client";

import {
	ArrowLeft,
	ArrowRight,
	Clock,
	Repeat,
	Star,
	Target,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CoverFillImage } from "@/components/blocks/course/cover-image";
import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import {
	artTones,
	ratingFromSeed,
	toneFromString,
} from "@/components/blocks/shared/entity-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { PublicQuiz } from "./types";

/**
 * Catalog card for a public quiz / Kankor mock exam, aligned with the
 * refreshed `(home)` soft-card design language.
 */
export function PublicQuizCard({
	quiz,
	href,
	className,
}: {
	quiz: PublicQuiz & {
		cover_image_url?: string | null;
		exam_zone?: string;
		rating?: number;
		rating_count?: number;
	};
	href?: string;
	className?: string;
}) {
	const t = useTranslations("quizzes");
	const locale = useLocale();
	const Arrow = isRtl(locale as Locale) ? ArrowLeft : ArrowRight;

	const targetHref =
		href ?? routes.quizzes.slug.page({ slug: quiz.slug ?? quiz.id });
	const fallbackStats = ratingFromSeed(quiz.id);
	const score =
		quiz.rating != null ? quiz.rating.toFixed(1) : fallbackStats.score;
	const votes = quiz.rating_count ?? fallbackStats.votes;

	const coverSrc = resolveEntityCardImage({
		customSrc: quiz.cover_image_url,
		text: quiz.title,
		kind: "quiz",
		seed: quiz.id,
	});
	const tone = toneFromString(quiz.id);

	const showAccessPill = quiz.is_free != null;
	const hasCriteriaBadges =
		quiz.passing_score_percentage != null || quiz.max_attempts != null;

	return (
		<article
			className={cn(
				"group soft-card card-hover relative flex h-full flex-col overflow-hidden border-[#e5e8f3] bg-white dark:border-white/10 dark:bg-[#1b2438]",
				className
			)}
		>
			<Link href={targetHref} className="flex flex-1 flex-col">
				{/* Cover Header */}
				<div
					className={cn(
						"relative h-40 w-full shrink-0 overflow-hidden bg-linear-to-br",
						artTones[tone]
					)}
				>
					<CoverFillImage
						src={coverSrc}
						alt={quiz.title}
						sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 310px"
						className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
					/>

					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0f1a2c]/60 via-transparent to-black/25"
					/>

					{/* Top-Start Access / Zone Pill */}
					<div className="absolute start-3 top-3 flex items-center gap-1.5">
						{showAccessPill &&
							(quiz.is_free ? (
								<span className="rounded-full bg-[#b7f486] px-2.5 py-0.5 text-[10px] font-extrabold text-[#17233a] shadow-xs">
									{t("free")}
								</span>
							) : (
								<span className="rounded-full border border-white/15 bg-[#0f1a2c]/75 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
									{t("priceCredits", { count: quiz.price_credits ?? 0 })}
								</span>
							))}
						{quiz.exam_zone && (
							<span className="rounded-full bg-white/92 px-2.5 py-0.5 text-[10px] font-extrabold text-[#19243b] shadow-xs">
								{quiz.exam_zone}
							</span>
						)}
					</div>

					{/* Top-End Rating Pill */}
					<span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
						<Star className="size-3 fill-amber-400 text-amber-400" />
						<span>{score}</span>
						<span className="text-white/70">({votes})</span>
					</span>
				</div>

				{/* Card Body */}
				<div className="flex flex-1 flex-col p-5">
					<h3 className="line-clamp-2 text-[15px] font-extrabold leading-6 text-[#19243b] transition-colors group-hover:text-primary dark:text-slate-100 dark:group-hover:text-violet-300">
						{quiz.title}
					</h3>

					{quiz.description && (
						<p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
							{quiz.description}
						</p>
					)}

					{hasCriteriaBadges && (
						<div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
							{quiz.passing_score_percentage != null && (
								<span className="inline-flex items-center gap-1 rounded-full bg-[#e1f6ec] px-2.5 py-1 text-[10.5px] font-bold text-[#258263] dark:bg-emerald-400/12 dark:text-emerald-200">
									<Target className="size-3" />
									{t("passingScore", {
										percent: quiz.passing_score_percentage,
									})}
								</span>
							)}
							{quiz.max_attempts != null && (
								<span className="inline-flex items-center gap-1 rounded-full bg-[#eee8ff] px-2.5 py-1 text-[10.5px] font-bold text-[#6b4dd7] dark:bg-violet-400/12 dark:text-violet-200">
									<Repeat className="size-3" />
									{t("maxAttempts", { count: quiz.max_attempts })}
								</span>
							)}
						</div>
					)}
				</div>

				{/* Card Footer */}
				<div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/55 px-5 py-3 text-xs dark:border-white/[.08] dark:bg-white/[.025]">
					<span className="inline-flex min-w-0 items-center gap-1.5 text-[11.5px] font-bold text-slate-600 dark:text-slate-300">
						<Clock className="size-3.5 shrink-0 text-primary dark:text-violet-300" />
						<span className="truncate">
							{quiz.time_limit_minutes != null
								? t("timeLimitMinutes", { count: quiz.time_limit_minutes })
								: t("hub.detail.flexible")}
						</span>
					</span>

					<span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-extrabold text-primary transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 dark:text-violet-300">
						<span>{t("view")}</span>
						<Arrow className="size-3.5" />
					</span>
				</div>
			</Link>
		</article>
	);
}

export function PublicQuizCardSkeleton() {
	return (
		<div className="soft-card flex h-full flex-col overflow-hidden border-[#e5e8f3] bg-white dark:border-white/10 dark:bg-[#1b2438]">
			<Skeleton className="h-40 w-full rounded-none" />
			<div className="flex flex-1 flex-col gap-2.5 p-5">
				<Skeleton className="h-4 w-4/5 rounded-lg" />
				<Skeleton className="h-3 w-full rounded-lg" />
				<Skeleton className="h-3 w-2/3 rounded-lg" />
				<div className="mt-auto flex gap-2 pt-3">
					<Skeleton className="h-5 w-20 rounded-full" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
			</div>
			<div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-white/[.08]">
				<Skeleton className="h-3.5 w-16 rounded-md" />
				<Skeleton className="h-3.5 w-20 rounded-md" />
			</div>
		</div>
	);
}
