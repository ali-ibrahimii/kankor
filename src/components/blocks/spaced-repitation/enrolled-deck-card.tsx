"use client";

import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { ActiveDeck } from "./types";

export function EnrolledDeckCard({
	deck,
	className,
}: {
	deck: ActiveDeck;
	className?: string;
}) {
	const t = useTranslations("spacedRepetition");
	const tDecks = useTranslations("decks");
	const pending = deck.dueCount + deck.newCount;

	return (
		<Card className={cn("flex h-full flex-col overflow-hidden", className)}>
			<CardContent className="flex flex-1 flex-col gap-4 p-4">
				<div className="flex items-start gap-3">
					<div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Layers />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="line-clamp-2 text-sm font-semibold leading-snug">
							{deck.name}
						</h3>
						{deck.description && (
							<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
								{deck.description}
							</p>
						)}
					</div>
				</div>

				<div className="mt-auto flex flex-wrap gap-1.5">
					<Badge variant="secondary" className="text-xs">
						{tDecks(`algorithm.${deck.algorithm}` as any)}
					</Badge>
					{pending > 0 && (
						<Badge variant="outline" className="text-xs">
							{t("deckSwitcher.due", { count: pending })}
						</Badge>
					)}
				</div>
			</CardContent>

			<CardFooter className="gap-2 p-4 pt-0">
				<Button asChild size="sm" className="w-full">
					<Link href={routes.d.decks.practice.page({ deck: deck.deckId })}>
						{t("page.study")}
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
