"use client";

import { PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import type { EnrollableDeck } from "@/components/blocks/spaced-repitation";
import { EnrollDeckDialog } from "@/components/blocks/spaced-repitation";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { useAuth } from "@/providers/auth.provider";
import { DeckDetail } from "@/types/queries.types";

export interface DeckDetailActionsProps {
	deck: DeckDetail;
	isEnrolled: boolean;
}

// Signed-in + not enrolled: `/d/decks/practice?deck=…` only resumes a deck
// already in the user's active list, so we must enroll first via the dialog
// rather than link straight to the practice page.
export function DeckDetailActions({
	deck,
	isEnrolled,
}: DeckDetailActionsProps) {
	const t = useTranslations("decks");
	const { isAuthenticated } = useAuth();
	const [enrollOpen, setEnrollOpen] = React.useState(false);

	if (!isAuthenticated) {
		return (
			<Button
				asChild
				size="lg"
				className="w-full gap-2 shadow-sm font-semibold"
			>
				<Link
					href={routes.auth.login.page({
						next: routes.decks.slug.page({ slug: deck.slug }),
					})}
				>
					<PlayCircle className="size-5" />
					{t("signUpToPractice")}
				</Link>
			</Button>
		);
	}

	if (isEnrolled) {
		return (
			<Button
				asChild
				size="lg"
				className="w-full gap-2 shadow-sm font-semibold"
			>
				<Link href={routes.d.decks.practice.page({ deck: deck.id })}>
					<PlayCircle className="size-5" />
					{t("continueStudying")}
				</Link>
			</Button>
		);
	}

	return (
		<>
			<Button
				size="lg"
				className="w-full gap-2 shadow-sm font-semibold"
				onClick={() => setEnrollOpen(true)}
			>
				<PlayCircle className="size-5" />
				{deck.is_free
					? t("practiceNow")
					: t("buyForCredits", { count: deck.price_credits ?? 0 })}
			</Button>
			<EnrollDeckDialog
				open={enrollOpen}
				onOpenChange={setEnrollOpen}
				preselected={{
					id: deck.id,
					name: deck.name,
					description: deck.description,
					algorithm: deck.algorithm,
					cardCount: deck.total_flashcards,
					isFree: deck.is_free,
					priceCredits: deck.price_credits ?? 0,
				}}
			/>
		</>
	);
}
