"use client";

import { ClipboardList, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { PublicQuiz } from "./types";

export function PublicQuizCard({
	quiz,
	className,
}: {
	quiz: PublicQuiz;
	className?: string;
}) {
	const t = useTranslations("quizzes");

	return (
		<Card className={cn("flex h-full flex-col overflow-hidden", className)}>
			<Link href={routes.quizzes.slug.page({ slug: quiz.slug ?? quiz.id })}>
				<CardContent className="flex flex-1 flex-col gap-4 p-4">
					<div className="flex items-start gap-3">
						<div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<ClipboardList />
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="line-clamp-2 text-sm font-semibold leading-snug">
								{quiz.title}
							</h3>
							{quiz.description && (
								<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
									{quiz.description}
								</p>
							)}
						</div>
					</div>

					{quiz.time_limit_minutes != null && (
						<div className="mt-auto flex flex-wrap gap-1.5">
							<Badge variant="outline" className="gap-1 font-normal">
								<Clock className="size-3" />
								{t("timeLimitMinutes", { count: quiz.time_limit_minutes })}
							</Badge>
						</div>
					)}
				</CardContent>
			</Link>
		</Card>
	);
}

export function PublicQuizCardSkeleton() {
	return (
		<Card className="overflow-hidden">
			<CardContent className="flex flex-col gap-4 p-4">
				<div className="flex items-start gap-3">
					<Skeleton className="size-11 rounded-lg" />
					<div className="flex flex-1 flex-col gap-2">
						<Skeleton className="h-4 w-4/5" />
						<Skeleton className="h-3 w-1/2" />
					</div>
				</div>
				<div className="flex gap-1.5">
					<Skeleton className="h-6 w-20 rounded-full" />
				</div>
			</CardContent>
		</Card>
	);
}
