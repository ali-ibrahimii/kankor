"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import type { SessionCounts } from "./types";

export interface SessionStatsProps {
	progress: { done: number; total: number };
	remaining: SessionCounts;
}

/** Session progress bar plus remaining new/learning/review counters. */
export function SessionStats({ progress, remaining }: SessionStatsProps) {
	const t = useTranslations("spacedRepetition.stats");
	const percent =
		progress.total === 0 ? 0 : (progress.done / progress.total) * 100;

	return (
		<div className="mx-auto w-full max-w-2xl space-y-2">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>
					{t("progress", { done: progress.done, total: progress.total })}
				</span>
				<span className="flex items-center gap-3">
					<span className="flex items-center gap-1">
						<span className="size-2 rounded-full bg-sky-500" aria-hidden />
						{t("new")} {remaining.newCount}
					</span>
					<span className="flex items-center gap-1">
						<span className="size-2 rounded-full bg-amber-500" aria-hidden />
						{t("learning")} {remaining.learningCount}
					</span>
					<span className="flex items-center gap-1">
						<span className="size-2 rounded-full bg-emerald-500" aria-hidden />
						{t("review")} {remaining.reviewCount}
					</span>
				</span>
			</div>
			<Progress value={percent} aria-label={t("progressLabel")} />
		</div>
	);
}
