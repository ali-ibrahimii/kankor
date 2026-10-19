"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export interface CardNavigationProps {
	canGoPrev: boolean;
	canGoNext: boolean;
	onPrev: () => void;
	onNext: () => void;
}

/** Previous / next card buttons (also bound to the arrow keys). */
export function CardNavigation({
	canGoPrev,
	canGoNext,
	onPrev,
	onNext,
}: CardNavigationProps) {
	const t = useTranslations("spacedRepetition.nav");

	return (
		<div className="mx-auto flex w-full max-w-2xl items-center justify-between">
			<Button
				variant="ghost"
				size="sm"
				disabled={!canGoPrev}
				onClick={onPrev}
				className="text-muted-foreground"
			>
				<ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
				{t("previous")}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				disabled={!canGoNext}
				onClick={onNext}
				className="text-muted-foreground"
			>
				{t("next")}
				<ChevronRightIcon className="size-4 rtl:rotate-180" aria-hidden />
			</Button>
		</div>
	);
}
