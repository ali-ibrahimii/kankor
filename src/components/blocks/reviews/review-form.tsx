"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "./star-rating";

export type ReviewFormValues = {
	rating: number;
	title: string;
	comment: string;
};

export type ReviewFormProps = {
	initialValues?: Partial<ReviewFormValues>;
	isSubmitting: boolean;
	onSubmit: (values: ReviewFormValues) => Promise<void>;
	onCancel?: () => void;
};

export function ReviewForm({
	initialValues,
	isSubmitting,
	onSubmit,
	onCancel,
}: ReviewFormProps) {
	const t = useTranslations("reviews");
	const [rating, setRating] = React.useState(initialValues?.rating ?? 0);
	const [comment, setComment] = React.useState(initialValues?.comment ?? "");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (rating < 1) {
			toast.error(t("ratingRequired"));
			return;
		}
		await onSubmit({ rating, title: "", comment });
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-4 rounded-2xl border bg-card p-5"
		>
			<div className="space-y-1.5">
				<p className="text-sm font-medium">{t("yourRating")}</p>
				<StarRatingInput
					value={rating}
					onChange={setRating}
					disabled={isSubmitting}
				/>
			</div>

			<Textarea
				value={comment}
				onChange={(e) => setComment(e.target.value)}
				placeholder={t("commentPlaceholder")}
				disabled={isSubmitting}
				rows={3}
				maxLength={2000}
			/>

			<div className="flex items-center justify-end gap-2">
				{onCancel && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onCancel}
						disabled={isSubmitting}
					>
						{t("cancel")}
					</Button>
				)}
				<Button type="submit" size="sm" disabled={isSubmitting || rating < 1}>
					{isSubmitting && <Spinner className="size-4" />}
					{t("submit")}
				</Button>
			</div>
		</form>
	);
}
