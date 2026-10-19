"use client";

import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReviewItem } from "@/types/queries.types";
import { StarRating } from "./star-rating";

export type ReviewListItemProps = {
	review: ReviewItem;
	isOwn?: boolean;
	onDelete?: () => void;
	isDeleting?: boolean;
};

export function ReviewListItem({
	review,
	isOwn,
	onDelete,
	isDeleting,
}: ReviewListItemProps) {
	const t = useTranslations("reviews");
	const locale = useLocale();
	const name = review.reviewer.name?.trim() || t("anonymous");
	const formattedDate = new Date(review.created_at).toLocaleDateString(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return (
		<div className="flex gap-3 border-b py-5 last:border-b-0">
			<Avatar>
				<AvatarImage src={review.reviewer.avatar ?? undefined} />
				<AvatarFallback>{name[0]}</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1 space-y-1.5">
				<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">{name}</span>
						{isOwn && (
							<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
								{t("you")}
							</span>
						)}
					</div>
					<span className="text-xs text-muted-foreground">{formattedDate}</span>
				</div>
				<StarRating value={review.rating} size="sm" />
				{review.comment && (
					<p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
						{review.comment}
					</p>
				)}
				{isOwn && onDelete && (
					<Button
						variant="ghost"
						size="sm"
						className="-ms-2 h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
						onClick={onDelete}
						disabled={isDeleting}
					>
						<Trash2 className="size-3.5" />
						{t("delete")}
					</Button>
				)}
			</div>
		</div>
	);
}
