"use client";

import { ArrowLeft, Layers, Sparkles, SquareStack } from "lucide-react";
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

export type PublicDeck = {
	id: string;
	slug: string | null;
	name: string;
	description: string | null;
	is_free: boolean;
	card_count?: number;
};

/**
 * Catalog card for a flashcard deck — Coursera-style art header + meta footer.
 */
export function PublicDeckCard({
	deck,
	className,
}: {
	deck: PublicDeck;
	className?: string;
}) {
	const t = useTranslations("decks");

	return (
		<EntityCardShell
			href={routes.decks.slug.page({ slug: deck.slug ?? deck.id })}
			className={className}
		>
			<EntityCardArt
				icon={Layers}
				tone={toneFromString(deck.id)}
				label={t("title")}
			/>
			<EntityCardBody
				title={deck.name}
				description={deck.description}
				badges={
					<>
						{deck.card_count != null && (
							<EntityCardBadge>
								<SquareStack className="size-3" />
								{t("cardCount", { count: deck.card_count })}
							</EntityCardBadge>
						)}
						{deck.is_free && (
							<EntityCardBadge tone="success">
								<Sparkles className="size-3" />
								{t("free")}
							</EntityCardBadge>
						)}
					</>
				}
			/>
			<EntityCardFooter
				meta={
					deck.card_count != null ? (
						<EntityCardMetaItem icon={SquareStack}>
							{t("cardCount", { count: deck.card_count })}
						</EntityCardMetaItem>
					) : undefined
				}
				price={deck.is_free ? t("free") : null}
				cta={
					<>
						{t("practiceNow")}{" "}
						<ArrowLeft className="rtl:rotate-180" size={13} />
					</>
				}
			/>
		</EntityCardShell>
	);
}

export function PublicDeckCardSkeleton() {
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
