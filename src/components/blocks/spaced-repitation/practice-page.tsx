"use client";

import { CirclePlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { DeckSettingsPopover } from "./deck-settings-popover";
import { DeckSwitcher } from "./deck-switcher";
import { EnrollDeckDialog } from "./enroll-deck-dialog";
import { NoActiveDecks } from "./session-states";
import { StudyArea } from "./study-area";
import type { ActiveDeck, StudySession } from "./types";

export interface PracticePageBlockProps {
	activeDecks: ActiveDeck[];
	selectedDeckId: string | null;
	session: StudySession | null;
}

/**
 * Client shell of the spaced-repetition page. All data arrives from the
 * server page; switching decks navigates (?deck=…) so the queue is always
 * rebuilt server-side with fresh due/new cards.
 */
export function PracticePageBlock({
	activeDecks,
	selectedDeckId,
	session,
}: PracticePageBlockProps) {
	const t = useTranslations("spacedRepetition.page");
	const router = useRouter();
	const [enrollOpen, setEnrollOpen] = React.useState(false);

	const selectedDeck =
		activeDecks.find((deck) => deck.deckId === selectedDeckId) ?? null;

	function handleSelectDeck(deckId: string) {
		router.replace(routes.d.decks.practice.page({ deck: deckId }));
	}

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold">{t("title")}</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("subtitle")}
					</p>
				</div>

				{activeDecks.length > 0 && (
					<div className="flex items-center gap-2">
						<DeckSwitcher
							decks={activeDecks}
							selectedDeckId={selectedDeckId}
							onSelect={handleSelectDeck}
						/>
						{selectedDeck && <DeckSettingsPopover deck={selectedDeck} />}
						<Button size="sm" onClick={() => setEnrollOpen(true)}>
							<CirclePlusIcon className="size-4" />
							{t("addDeck")}
						</Button>
					</div>
				)}
			</div>

			{/* Body */}
			{activeDecks.length === 0 ? (
				<NoActiveDecks onAddDeck={() => setEnrollOpen(true)} />
			) : session ? (
				<StudyArea session={session} />
			) : (
				<p className="py-12 text-center text-sm text-muted-foreground">
					{t("noDeckSelected")}
				</p>
			)}

			<EnrollDeckDialog open={enrollOpen} onOpenChange={setEnrollOpen} />
		</div>
	);
}
