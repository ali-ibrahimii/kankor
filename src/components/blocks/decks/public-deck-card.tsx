"use client";

import { ArrowLeft, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	EntityCardArt,
	EntityCardBody,
	EntityCardShell,
	ratingFromSeed,
	toneFromString,
} from "@/components/blocks/shared/entity-card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";

export type PublicDeck = {
	id: string;
	slug: string | null;
	name: string;
	description: string | null;
	is_free: boolean;
	card_count?: number;
	category?: string | null;
	rating?: number;
	rating_count?: number;
	cover_image_url?: string | null;
};

/**
 * Catalog card for a flashcard deck — clean cover with Free + User Rating in
 * the top corners, and card count · category · practice CTA in the footer.
 */
export function PublicDeckCard({
	deck,
	href,
	className,
}: {
	deck: PublicDeck;
	href?: string;
	className?: string;
}) {
	const t = useTranslations("decks");
	const targetHref =
		href ?? routes.decks.slug.page({ slug: deck.slug ?? deck.id });
	const fallbackStats = ratingFromSeed(deck.id);
	const score =
		deck.rating != null ? deck.rating.toFixed(1) : fallbackStats.score;
	const votes = deck.rating_count ?? fallbackStats.votes;

	return (
		<EntityCardShell href={targetHref} className={className}>
			<EntityCardArt
				tone={toneFromString(deck.id)}
				imageSrc={deck.cover_image_url}
				imageAlt={deck.name}
				kind="deck"
				seed={deck.id}
				topStart={
					deck.is_free ? (
						<span className="rounded-full bg-[#b7f486] px-2.5 py-0.5 text-[10px] font-extrabold text-[#17233a] shadow-sm">
							{t("free")}
						</span>
					) : undefined
				}
				topEnd={
					<span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
						<Star className="size-3 fill-amber-400 text-amber-400" />
						<span>{score}</span>
						<span className="text-white/70">({votes})</span>
					</span>
				}
			/>
			<EntityCardBody title={deck.name} description={deck.description} />
			<div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5 text-[11px]">
				<span className="shrink-0 font-semibold text-muted-foreground">
					{deck.card_count != null
						? t("cardCount", { count: deck.card_count })
						: t("title")}
				</span>

				{deck.category && (
					<span className="truncate rounded-full bg-primary/8 px-2.5 py-0.5 text-[10px] font-bold text-primary">
						{deck.category}
					</span>
				)}

				<span className="inline-flex shrink-0 items-center gap-1 font-bold text-primary transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
					{t("practiceNow")}
					<ArrowLeft className="rtl:rotate-180" size={12} />
				</span>
			</div>
		</EntityCardShell>
	);
}

export function PublicDeckCardSkeleton() {
	return (
		<div className="soft-card flex h-full flex-col overflow-hidden">
			<Skeleton className="h-36 w-full rounded-none" />
			<div className="flex flex-1 flex-col gap-2.5 p-4">
				<Skeleton className="h-4 w-4/5" />
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-1/2" />
			</div>
		</div>
	);
}
