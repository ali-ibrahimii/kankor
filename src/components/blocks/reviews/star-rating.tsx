"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
	sm: "size-3.5",
	default: "size-4",
	lg: "size-6",
} as const;

export type StarRatingProps = {
	value: number;
	size?: keyof typeof sizeClasses;
	className?: string;
};

/** Read-only 5-star display, filled up to the (rounded) rating value. */
export function StarRating({
	value,
	size = "default",
	className,
}: StarRatingProps) {
	const rounded = Math.round(value);
	const t = useTranslations("reviews");

	return (
		<div
			role="img"
			aria-label={t("ratingValue", { rating: value })}
			className={cn("flex items-center gap-0.5", className)}
		>
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					aria-hidden="true"
					className={cn(
						sizeClasses[size],
						i <= rounded
							? "fill-amber-400 text-amber-400"
							: "fill-muted text-muted"
					)}
				/>
			))}
		</div>
	);
}

export type StarRatingInputProps = {
	value: number;
	onChange: (value: number) => void;
	disabled?: boolean;
	className?: string;
};

/** Interactive 1–5 star picker with hover preview. */
export function StarRatingInput({
	value,
	onChange,
	disabled,
	className,
}: StarRatingInputProps) {
	const [hovered, setHovered] = React.useState<number | null>(null);
	const shown = hovered ?? value;
	const t = useTranslations("reviews");

	return (
		<div
			className={cn("flex items-center gap-1", className)}
			onMouseLeave={() => setHovered(null)}
			role="radiogroup"
			aria-label={t("yourRating")}
		>
			{[1, 2, 3, 4, 5].map((i) => (
				<button
					key={i}
					type="button"
					disabled={disabled}
					role="radio"
					aria-checked={value === i}
					aria-label={t("ratingValue", { rating: i })}
					onMouseEnter={() => setHovered(i)}
					onFocus={() => setHovered(i)}
					onBlur={() => setHovered(null)}
					onClick={() => onChange(i)}
					className="rounded-sm p-0.5 transition-transform hover:scale-110 disabled:pointer-events-none disabled:opacity-50"
				>
					<Star
						aria-hidden="true"
						className={cn(
							"size-7 transition-colors",
							i <= shown
								? "fill-amber-400 text-amber-400"
								: "fill-muted text-muted"
						)}
					/>
				</button>
			))}
		</div>
	);
}
