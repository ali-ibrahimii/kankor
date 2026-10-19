"use client";

import { CheckCircle2Icon, CirclePlusIcon, CoffeeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import type { SessionStats } from "./store";

// ─── No active decks ──────────────────────────────────────────────────────────

export function NoActiveDecks({ onAddDeck }: { onAddDeck: () => void }) {
	const t = useTranslations("spacedRepetition.empty");

	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<CirclePlusIcon />
				</EmptyMedia>
				<EmptyTitle>{t("title")}</EmptyTitle>
				<EmptyDescription>{t("subtitle")}</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button onClick={onAddDeck}>
					<CirclePlusIcon className="size-4" />
					{t("action")}
				</Button>
			</EmptyContent>
		</Empty>
	);
}

// ─── Nothing due today ────────────────────────────────────────────────────────

export function AllCaughtUp() {
	const t = useTranslations("spacedRepetition.caughtUp");

	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<CoffeeIcon />
				</EmptyMedia>
				<EmptyTitle>{t("title")}</EmptyTitle>
				<EmptyDescription>{t("subtitle")}</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

// ─── Session complete ─────────────────────────────────────────────────────────

export interface SessionCompleteProps {
	stats: SessionStats;
	reviewedCount: number;
}

export function SessionComplete({
	stats,
	reviewedCount,
}: SessionCompleteProps) {
	const t = useTranslations("spacedRepetition.complete");
	const tg = useTranslations("spacedRepetition.grades");

	const breakdown = [
		{ grade: "again", count: stats.again, dot: "bg-rose-500" },
		{ grade: "hard", count: stats.hard, dot: "bg-amber-500" },
		{ grade: "good", count: stats.good, dot: "bg-emerald-500" },
		{ grade: "easy", count: stats.easy, dot: "bg-sky-500" },
	] as const;

	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<CheckCircle2Icon />
				</EmptyMedia>
				<EmptyTitle>{t("title")}</EmptyTitle>
				<EmptyDescription>
					{t("subtitle", { count: reviewedCount })}
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					{breakdown.map(({ grade, count, dot }) => (
						<span key={grade} className="flex items-center gap-1.5">
							<span className={`size-2 rounded-full ${dot}`} aria-hidden />
							{tg(grade)}: {count}
						</span>
					))}
				</div>
				<Button variant="outline" asChild>
					<Link href="/d/decks">{t("backToDecks")}</Link>
				</Button>
			</EmptyContent>
		</Empty>
	);
}
