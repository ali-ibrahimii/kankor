"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ActiveDeck } from "./types";

export interface DeckSwitcherProps {
	decks: ActiveDeck[];
	selectedDeckId: string | null;
	onSelect: (deckId: string) => void;
}

/** Switch between active learning decks; shows the due-card count per deck. */
export function DeckSwitcher({
	decks,
	selectedDeckId,
	onSelect,
}: DeckSwitcherProps) {
	const t = useTranslations("spacedRepetition.deckSwitcher");

	return (
		<Select value={selectedDeckId ?? undefined} onValueChange={onSelect}>
			<SelectTrigger className="w-56" aria-label={t("label")}>
				<SelectValue placeholder={t("placeholder")} />
			</SelectTrigger>
			<SelectContent>
				{decks.map((deck) => {
					const pending = deck.dueCount + deck.newCount;
					return (
						<SelectItem key={deck.deckId} value={deck.deckId}>
							<span className="flex items-center gap-2">
								<span className="truncate">{deck.name}</span>
								{pending > 0 && (
									<Badge variant="secondary" className="text-xs">
										{t("due", { count: pending })}
									</Badge>
								)}
							</span>
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}
