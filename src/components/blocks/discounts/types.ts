import type { Database } from "@/lib/supabase/database.types";

export type DiscountType = Database["public"]["Enums"]["discount_type"];
export type DiscountScope = Database["public"]["Enums"]["discount_scope"];
export type DiscountableItemType =
	Database["public"]["Enums"]["purchase_item_type"];

export type DiscountRow = Database["public"]["Tables"]["discounts"]["Row"];

/** An owned course/deck/quiz the caller can pick as a discount target. */
export interface DiscountableItem {
	itemType: DiscountableItemType;
	id: string;
	title: string;
}

export interface DiscountFormValues {
	code: string;
	type: DiscountType;
	value: string;
	scope: DiscountScope;
	/** `"course:<id>"` / `"deck:<id>"` / `"quiz:<id>"` composite keys. */
	targetKeys: string[];
	startsAt: string;
	endsAt: string;
	isActive: boolean;
}

export const DEFAULT_DISCOUNT_FORM_VALUES: DiscountFormValues = {
	code: "",
	type: "percentage",
	value: "",
	scope: "item",
	targetKeys: [],
	startsAt: "",
	endsAt: "",
	isActive: true,
};

export function targetKey(itemType: DiscountableItemType, id: string): string {
	return `${itemType}:${id}`;
}

export function parseTargetKey(key: string): {
	itemType: DiscountableItemType;
	id: string;
} {
	const [itemType, id] = key.split(":") as [DiscountableItemType, string];
	return { itemType, id };
}
