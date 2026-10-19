"use client";

import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "@/i18n/navigation";
import { updateDailyLimit } from "./actions";
import type { ActiveDeck } from "./types";
import { MAX_DAILY_LIMIT, MIN_DAILY_LIMIT } from "./types";

export interface DeckSettingsPopoverProps {
	deck: ActiveDeck;
}

/** Adjust the daily new-card limit of the currently selected deck. */
export function DeckSettingsPopover({ deck }: DeckSettingsPopoverProps) {
	const t = useTranslations("spacedRepetition.settings");
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [dailyLimit, setDailyLimit] = React.useState(deck.dailyLimit);
	const [isSaving, setIsSaving] = React.useState(false);

	// Keep the slider in sync when the student switches decks.
	React.useEffect(() => {
		setDailyLimit(deck.dailyLimit);
	}, [deck.dailyLimit]);

	async function handleSave() {
		if (isSaving) return;
		setIsSaving(true);
		try {
			const result = await updateDailyLimit(deck.deckId, dailyLimit);
			if (!result.success) {
				toast.error(t("updateFailed"));
				return;
			}
			toast.success(t("updated"));
			setOpen(false);
			router.refresh();
		} catch {
			toast.error(t("updateFailed"));
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="icon-sm" aria-label={t("label")}>
					<Settings2Icon className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-72 space-y-3">
				<div className="flex items-center justify-between">
					<Label htmlFor="deck-daily-limit">{t("dailyLimit")}</Label>
					<span className="text-sm font-semibold tabular-nums">
						{dailyLimit}
					</span>
				</div>
				<Slider
					id="deck-daily-limit"
					min={MIN_DAILY_LIMIT}
					max={MAX_DAILY_LIMIT}
					step={1}
					value={[dailyLimit]}
					onValueChange={([value]) => setDailyLimit(value)}
					aria-label={t("dailyLimit")}
				/>
				<Button
					size="sm"
					className="w-full"
					onClick={handleSave}
					disabled={isSaving || dailyLimit === deck.dailyLimit}
				>
					{isSaving ? t("updating") : t("update")}
				</Button>
			</PopoverContent>
		</Popover>
	);
}
