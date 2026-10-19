"use client";

import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { DiscountableItem, DiscountableItemType } from "./types";
import { targetKey } from "./types";

export interface DiscountTargetPickerProps {
	items: DiscountableItem[];
	isLoading: boolean;
	selected: string[];
	onChange: (keys: string[]) => void;
	/** "item" scope allows only one selection; "group" allows many. */
	multiple: boolean;
}

const TYPE_ORDER: DiscountableItemType[] = ["course", "deck", "quiz"];

export function DiscountTargetPicker({
	items,
	isLoading,
	selected,
	onChange,
	multiple,
}: DiscountTargetPickerProps) {
	const t = useTranslations("discounts.picker");
	const [search, setSearch] = React.useState("");

	const filtered = items.filter((item) =>
		item.title.toLowerCase().includes(search.toLowerCase())
	);
	const grouped = TYPE_ORDER.map((itemType) => ({
		itemType,
		items: filtered.filter((item) => item.itemType === itemType),
	})).filter((group) => group.items.length > 0);

	function toggle(key: string) {
		if (selected.includes(key)) {
			onChange(selected.filter((k) => k !== key));
			return;
		}
		onChange(multiple ? [...selected, key] : [key]);
	}

	return (
		<div className="space-y-2">
			<div className="relative">
				<SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					className="ps-8"
					placeholder={t("searchPlaceholder")}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<div className="max-h-56 overflow-y-auto rounded-md border p-2">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Spinner className="size-4" />
					</div>
				) : grouped.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						{t("empty")}
					</p>
				) : (
					<div className="space-y-3">
						{grouped.map((group) => (
							<div key={group.itemType}>
								<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									{t(`itemType.${group.itemType}`)}
								</p>
								<div className="space-y-1">
									{group.items.map((item) => {
										const key = targetKey(item.itemType, item.id);
										const isChecked = selected.includes(key);
										return (
											<label
												key={key}
												className={cn(
													"flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-muted",
													isChecked && "bg-primary/5"
												)}
											>
												<Checkbox
													checked={isChecked}
													onCheckedChange={() => toggle(key)}
												/>
												<span className="truncate">{item.title}</span>
											</label>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<p className="text-xs text-muted-foreground">
				{multiple ? t("multiHint") : t("singleHint")}
			</p>
		</div>
	);
}
