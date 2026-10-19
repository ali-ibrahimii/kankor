"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	type AppliedDiscount,
	DiscountCodeField,
} from "@/components/blocks/discounts";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { useAuth } from "@/providers/auth.provider";
import { enrollInDeck, listEnrollableDecks } from "./actions";
import type { EnrollableDeck } from "./types";
import { DEFAULT_DAILY_LIMIT, MAX_DAILY_LIMIT, MIN_DAILY_LIMIT } from "./types";

export interface EnrollDeckDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Skip the deck picker and enroll straight into this deck. */
	preselected?: EnrollableDeck | null;
}

/**
 * Deck setup dialog: pick a deck (unless preselected), choose how many new
 * cards to introduce per day, then enroll and jump to the practice page.
 */
export function EnrollDeckDialog({
	open,
	onOpenChange,
	preselected = null,
}: EnrollDeckDialogProps) {
	const t = useTranslations("spacedRepetition.enroll");
	const router = useRouter();
	const { refetchProfile } = useAuth();

	const [decks, setDecks] = React.useState<EnrollableDeck[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [dailyLimit, setDailyLimit] = React.useState(DEFAULT_DAILY_LIMIT);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [discount, setDiscount] = React.useState<AppliedDiscount | null>(null);

	const selectedDeck =
		preselected ?? decks.find((deck) => deck.id === selectedId) ?? null;

	// Load enrollable decks each time the picker variant of the dialog opens.
	React.useEffect(() => {
		if (!open) return;
		setSelectedId(preselected?.id ?? null);
		setDailyLimit(DEFAULT_DAILY_LIMIT);
		setDiscount(null);
		if (preselected) return;

		let cancelled = false;
		setIsLoading(true);
		listEnrollableDecks()
			.then((result) => {
				if (cancelled) return;
				if (result.success) setDecks(result.data);
				else toast.error(t("loadFailed"));
			})
			.catch(() => {
				if (!cancelled) toast.error(t("loadFailed"));
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [open, preselected, t]);

	async function handleEnroll() {
		if (!selectedDeck || isSubmitting) return;
		setIsSubmitting(true);
		try {
			const result = await enrollInDeck(
				selectedDeck.id,
				dailyLimit,
				discount?.code
			);
			if (!result.success) {
				toast.error(
					result.error.includes("insufficient_credits")
						? t("insufficientCredits")
						: t("failed")
				);
				return;
			}
			toast.success(t("enrolled"));
			if (!selectedDeck.isFree) await refetchProfile();
			onOpenChange(false);
			router.push(routes.d.decks.practice.page({ deck: selectedDeck.id }));
			router.refresh();
		} catch {
			toast.error(t("failed"));
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{/* Deck picker (hidden when a deck is preselected) */}
					{!preselected && (
						<div className="space-y-2">
							<Label htmlFor="enroll-deck">{t("deckLabel")}</Label>
							{isLoading ? (
								<div className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
									<Spinner className="size-4" />
									{t("loading")}
								</div>
							) : decks.length === 0 ? (
								<p className="text-sm text-muted-foreground">{t("noDecks")}</p>
							) : (
								<Select
									value={selectedId ?? undefined}
									onValueChange={(value) => {
										setSelectedId(value);
										setDiscount(null);
									}}
								>
									<SelectTrigger id="enroll-deck" className="w-full">
										<SelectValue placeholder={t("deckPlaceholder")} />
									</SelectTrigger>
									<SelectContent>
										{decks.map((deck) => (
											<SelectItem key={deck.id} value={deck.id}>
												<span className="flex items-center gap-2">
													<span className="truncate">{deck.name}</span>
													<span className="text-xs text-muted-foreground">
														{t("cardCount", { count: deck.cardCount })}
													</span>
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					)}

					{/* Price + discount code — hidden until a deck is selected/preselected */}
					{selectedDeck && !selectedDeck.isFree && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-[#1461B8]">
								{t("priceCredits", { count: selectedDeck.priceCredits })}
							</p>
							<DiscountCodeField
								key={selectedDeck.id}
								itemType="deck"
								itemId={selectedDeck.id}
								onApplied={setDiscount}
							/>
						</div>
					)}

					{/* Daily new-card limit */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="daily-limit">{t("dailyLimitLabel")}</Label>
							<span className="text-sm font-semibold tabular-nums">
								{dailyLimit}
							</span>
						</div>
						<Slider
							id="daily-limit"
							min={MIN_DAILY_LIMIT}
							max={MAX_DAILY_LIMIT}
							step={1}
							value={[dailyLimit]}
							onValueChange={([value]) => setDailyLimit(value)}
							aria-label={t("dailyLimitLabel")}
						/>
						<p className="text-xs text-muted-foreground">
							{t("dailyLimitHint")}
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						{t("cancel")}
					</Button>
					<Button
						onClick={handleEnroll}
						disabled={!selectedDeck || isSubmitting}
					>
						{isSubmitting && <Spinner className="size-4" />}
						{isSubmitting
							? t("submitting")
							: selectedDeck && !selectedDeck.isFree
								? t("buyForCredits", { count: selectedDeck.priceCredits })
								: t("submit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
