"use client";

import { ArrowLeft, Clock, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	EntityCardArt,
	EntityCardBody,
	EntityCardFooter,
	EntityCardMetaItem,
	EntityCardShell,
	ratingFromSeed,
	toneFromString,
} from "@/components/blocks/shared/entity-card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import type { PublicQuiz } from "./types";

/**
 * Catalog card for a quiz / Kankor mock exam — clean cover with top-corner
 * user rating and compact exam duration footer.
 */
export function PublicQuizCard({
	quiz,
	href,
	className,
}: {
	quiz: PublicQuiz & {
		cover_image_url?: string | null;
		rating?: number;
		rating_count?: number;
	};
	href?: string;
	className?: string;
}) {
	const t = useTranslations("quizzes");
	const targetHref =
		href ?? routes.quizzes.slug.page({ slug: quiz.slug ?? quiz.id });
	const fallbackStats = ratingFromSeed(quiz.id);
	const score =
		quiz.rating != null ? quiz.rating.toFixed(1) : fallbackStats.score;
	const votes = quiz.rating_count ?? fallbackStats.votes;

	return (
		<EntityCardShell href={targetHref} className={className}>
			<EntityCardArt
				tone={toneFromString(quiz.id)}
				imageSrc={quiz.cover_image_url}
				imageAlt={quiz.title}
				kind="quiz"
				seed={quiz.id}
				topEnd={
					<span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
						<Star className="size-3 fill-amber-400 text-amber-400" />
						<span>{score}</span>
						<span className="text-white/70">({votes})</span>
					</span>
				}
			/>
			<EntityCardBody title={quiz.title} description={quiz.description} />
			<EntityCardFooter
				meta={
					quiz.time_limit_minutes != null ? (
						<EntityCardMetaItem icon={Clock}>
							{t("timeLimitMinutes", { count: quiz.time_limit_minutes })}
						</EntityCardMetaItem>
					) : undefined
				}
				cta={
					<>
						{t("view")} <ArrowLeft className="rtl:rotate-180" size={13} />
					</>
				}
			/>
		</EntityCardShell>
	);
}

export function PublicQuizCardSkeleton() {
	return (
		<div className="soft-card flex h-full flex-col overflow-hidden">
			<Skeleton className="h-36 w-full rounded-none" />
			<div className="flex flex-1 flex-col gap-2.5 p-4">
				<Skeleton className="h-4 w-4/5" />
				<Skeleton className="h-3 w-full" />
			</div>
		</div>
	);
}
