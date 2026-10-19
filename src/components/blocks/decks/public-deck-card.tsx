"use client";

import { Layers, Sparkles, SquareStack } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type PublicDeck = {
	id: string;
	slug: string | null;
	name: string;
	description: string | null;
	is_free: boolean;
	card_count?: number;
};

export function PublicDeckCard({
	deck,
	className,
}: {
	deck: PublicDeck;
	className?: string;
}) {
	const t = useTranslations("decks");

	return (
		<Card className={cn("flex h-full flex-col overflow-hidden", className)}>
			<Link href={routes.decks.slug.page({ slug: deck.slug ?? deck.id })}>
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
						{deck.card_count != null && (
							<Badge variant="outline" className="gap-1 font-normal">
								<SquareStack className="size-3" />
								{t("cardCount", { count: deck.card_count })}
							</Badge>
						)}
						{deck.is_free && (
							<Badge
								variant="outline"
								className="gap-1 font-normal border-emerald-200 text-emerald-700"
							>
								<Sparkles className="size-3" />
								{t("free")}
							</Badge>
						)}
					</div>
				</CardContent>
			</Link>
		</Card>
	);
}

export function PublicDeckCardSkeleton() {
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
