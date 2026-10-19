"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import type { DiscountableItemType } from "./types";

export interface AppliedDiscount {
	code: string;
	discountedPrice: number;
	originalPrice: number;
}

export interface DiscountCodeFieldProps {
	itemType: DiscountableItemType;
	itemId: string;
	onApplied: (discount: AppliedDiscount | null) => void;
}

/**
 * Discounts are redeemed entirely by code — nothing applies automatically —
 * so this is the one UI surface that turns a typed code into a price via
 * `validate_discount_code` (a read-only preview; the actual charge happens
 * later inside `purchase_item` when the buyer completes the purchase).
 */
export function DiscountCodeField({
	itemType,
	itemId,
	onApplied,
}: DiscountCodeFieldProps) {
	const t = useTranslations("discounts.field");
	const [expanded, setExpanded] = React.useState(false);
	const [code, setCode] = React.useState("");
	const [isApplying, setIsApplying] = React.useState(false);
	const [applied, setApplied] = React.useState<AppliedDiscount | null>(null);

	async function handleApply() {
		const trimmed = code.trim();
		if (!trimmed) return;
		setIsApplying(true);
		try {
			const client = createClient();
			const { data, error } = await client
				.rpc("validate_discount_code", {
					p_code: trimmed,
					p_item_type: itemType,
					p_item_id: itemId,
				})
				.single();
			if (error) throw error;

			const result: AppliedDiscount = {
				code: trimmed,
				discountedPrice: data.discounted_price,
				originalPrice: data.original_price,
			};
			setApplied(result);
			onApplied(result);
			toast.success(t("applied"));
		} catch (error) {
			const message = (error as { message?: string })?.message ?? "";
			toast.error(
				message.includes("invalid_discount_code")
					? t("invalidCode")
					: message.includes("discount_not_applicable")
						? t("notApplicable")
						: t("applyFailed")
			);
			setApplied(null);
			onApplied(null);
		} finally {
			setIsApplying(false);
		}
	}

	function handleRemove() {
		setApplied(null);
		setCode("");
		setExpanded(false);
		onApplied(null);
	}

	if (applied) {
		return (
			<div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950">
				<span className="font-medium text-emerald-700 dark:text-emerald-400">
					{t("appliedLabel", {
						code: applied.code,
						price: applied.discountedPrice,
					})}
				</span>
				<button
					type="button"
					onClick={handleRemove}
					className="text-muted-foreground hover:text-foreground"
					aria-label={t("remove")}
				>
					<XIcon className="size-3.5" />
				</button>
			</div>
		);
	}

	if (!expanded) {
		return (
			<button
				type="button"
				onClick={() => setExpanded(true)}
				className="text-sm text-primary hover:underline"
			>
				{t("haveCode")}
			</button>
		);
	}

	return (
		<div className="flex gap-2">
			<Input
				value={code}
				onChange={(e) => setCode(e.target.value.toUpperCase())}
				onKeyDown={(e) => e.key === "Enter" && handleApply()}
				placeholder={t("codePlaceholder")}
				className="flex-1"
				disabled={isApplying}
			/>
			<Button
				type="button"
				size="sm"
				variant="outline"
				onClick={handleApply}
				disabled={isApplying || !code.trim()}
			>
				{isApplying && <Spinner className="size-4" />}
				{t("apply")}
			</Button>
		</div>
	);
}
