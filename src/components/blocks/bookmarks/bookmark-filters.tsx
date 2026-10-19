"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { UseQueryFilters } from "@/hooks/filter/filter.hooks";
import { cn } from "@/lib/utils";
import type { BookmarkableItemType } from "./bookmark-button";

export type BookmarkFiltersProps = {
	queryState: Pick<
		UseQueryFilters<"bookmark_details">,
		"state" | "setSearch" | "setFilter" | "removeFilter"
	>;
	className?: string;
};

const ITEM_TYPES: BookmarkableItemType[] = [
	"course",
	"deck",
	"library",
	"quiz",
];

export function BookmarkFilters({
	queryState,
	className,
}: BookmarkFiltersProps) {
	const t = useTranslations("bookmarks");
	const { state, setSearch, setFilter, removeFilter } = queryState;
	const [searchValue, setSearchValue] = React.useState(state.search ?? "");

	React.useEffect(() => {
		setSearchValue(state.search ?? "");
	}, [state.search]);

	const itemType =
		(state.filters?.find((filter) => filter.field === "item_type")?.value as
			| string
			| undefined) ?? "all";

	function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
		setSearchValue(event.target.value);
		setSearch(event.target.value);
	}

	function handleSearchClear() {
		setSearchValue("");
		setSearch("");
	}

	function handleItemTypeChange(value: string) {
		if (value === "all") removeFilter("item_type");
		else
			setFilter({
				field: "item_type",
				operator: "eq",
				value: value as any,
			});
	}

	return (
		<div
			className={cn(
				"flex flex-col gap-3 sm:flex-row sm:items-center",
				className
			)}
		>
			<div className="relative min-w-0 flex-1">
				<Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					value={searchValue}
					onChange={handleSearchChange}
					placeholder={t("searchPlaceholder")}
					className="h-9 pe-9 ps-9"
				/>
				{searchValue && (
					<button
						type="button"
						onClick={handleSearchClear}
						className="absolute inset-e-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
						aria-label={t("clearSearch")}
					>
						<X className="size-4" />
					</button>
				)}
			</div>

			<Select value={itemType} onValueChange={handleItemTypeChange}>
				<SelectTrigger className="h-9 w-full sm:w-44">
					<SelectValue placeholder={t("allTypes")} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="all">{t("allTypes")}</SelectItem>
						{ITEM_TYPES.map((type) => (
							<SelectItem key={type} value={type}>
								{t(`type_${type}`)}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}
