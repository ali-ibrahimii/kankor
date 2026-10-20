"use client";

import { ArrowLeft, ClipboardList, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	EntityCardArt,
	EntityCardBadge,
	EntityCardBody,
	EntityCardFooter,
	EntityCardMetaItem,
	EntityCardShell,
	toneFromString,
} from "@/components/blocks/shared/entity-card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import type { PublicQuiz } from "./types";

/**
 * Catalog card for a quiz / mock exam — Coursera-style art header + footer.
 */
export function PublicQuizCard({
	quiz,
	className,
}: {
	quiz: PublicQuiz;
	className?: string;
}) {
	const t = useTranslations("quizzes");

	return (
		<EntityCardShell
			href={routes.quizzes.slug.page({ slug: quiz.slug ?? quiz.id })}
			className={className}
		>
			<EntityCardArt
				icon={ClipboardList}
				tone={toneFromString(quiz.id)}
				label={t("title")}
			/>
			<EntityCardBody
				title={quiz.title}
				description={quiz.description}
				badges={
					quiz.time_limit_minutes != null ? (
						<EntityCardBadge>
							<Clock className="size-3" />
							{t("timeLimitMinutes", { count: quiz.time_limit_minutes })}
						</EntityCardBadge>
					) : undefined
				}
			/>
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
			<div className="flex flex-1 flex-col gap-3 p-5">
				<Skeleton className="h-5 w-4/5" />
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-1/2" />
				<div className="mt-auto flex gap-1.5">
					<Skeleton className="h-6 w-20 rounded-full" />
				</div>
			</div>
		</div>
	);
}
