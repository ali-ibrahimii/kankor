"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { UseQueryFilters } from "@/hooks/filter/filter.hooks";
import { cn } from "@/lib/utils";
import { useAuthProfile } from "@/providers/auth.provider";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeckFiltersProps = {
	queryState: Pick<
		UseQueryFilters<"decks">,
		"state" | "setSearch" | "setFilter" | "removeFilter" | "reset"
	>;
	className?: string;
	/** Show an "only my decks" switch that filters decks by the current user's id. */
	enableOwnerFilter?: boolean;
};

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) {
	return (
		<Badge variant="secondary" className="gap-1 rounded-full pe-1 font-normal">
			{label}
			<button
				type="button"
				onClick={onRemove}
				className="ms-0.5 rounded-full p-0.5 hover:bg-foreground/10"
				aria-label={`Remove ${label} filter`}
			>
				<X className="size-2.5" />
			</button>
		</Badge>
	);
}

// ─── FilterToggleGroup ────────────────────────────────────────────────────────

function FilterToggleGroup<T extends string>({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: readonly { value: T; label: string }[];
	value: T | null;
	onChange: (v: T | null) => void;
}) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<div className="flex flex-wrap gap-1.5">
				{options.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => onChange(value === opt.value ? null : opt.value)}
						className={cn(
							"rounded-full border px-3 py-1 text-xs transition-colors",
							value === opt.value
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-background hover:bg-muted"
						)}
					>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	);
}

// ─── DeckFilters ──────────────────────────────────────────────────────────────

export function DeckFilters({
	queryState,
	className,
	enableOwnerFilter,
}: DeckFiltersProps) {
	const t = useTranslations("flashcardBuilder");
	const { state, setSearch, setFilter, removeFilter } = queryState;
	const profile = useAuthProfile();
	const userId = profile?.id;

	const [searchValue, setSearchValue] = React.useState(state.search ?? "");
	const [isOpen, setIsOpen] = React.useState(false);

	React.useEffect(() => {
		setSearchValue(state.search ?? "");
	}, [state.search]);

	function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSearchValue(e.target.value);
		setSearch(e.target.value);
	}

	function handleSearchClear() {
		setSearchValue("");
		setSearch("");
	}

	const currentVisibility =
		(state.filters?.find((f) => f.field === "visibility")?.value as string) ??
		null;
	const currentAlgorithm =
		(state.filters?.find((f) => f.field === "algorithm")?.value as string) ??
		null;

	function setVisibilityFilter(v: string | null) {
		if (v) setFilter({ field: "visibility", operator: "eq", value: v as any });
		else removeFilter("visibility");
	}

	function setAlgorithmFilter(v: string | null) {
		if (v) setFilter({ field: "algorithm", operator: "eq", value: v as any });
		else removeFilter("algorithm");
	}

	const currentOwner =
		(state.filters?.find((f) => f.field === "user_id")?.value as string) ??
		null;
	const onlyMine = enableOwnerFilter && !!userId && currentOwner === userId;

	function setOwnerFilter(checked: boolean) {
		if (checked && userId)
			setFilter({ field: "user_id", operator: "eq", value: userId as any });
		else removeFilter("user_id");
	}

	const visibilityOptions = [
		{ value: "public", label: t("visibility.public") },
		{ value: "private", label: t("visibility.private") },
		{ value: "classmate", label: t("visibility.classmate") },
	] as const;

	const algorithmOptions = [
		{ value: "fsrs", label: t("algorithm.fsrs") },
		{ value: "sm2", label: t("algorithm.sm2") },
		{ value: "leitner", label: t("algorithm.leitner") },
	] as const;

	const activeFilterCount =
		(currentVisibility ? 1 : 0) +
		(currentAlgorithm ? 1 : 0) +
		(onlyMine ? 1 : 0);

	const activeChips: { label: string; onRemove: () => void }[] = [
		...(onlyMine
			? [
					{
						label: t("list.onlyMyDecks"),
						onRemove: () => setOwnerFilter(false),
					},
				]
			: []),
		...(currentVisibility
			? [
					{
						label:
							visibilityOptions.find((o) => o.value === currentVisibility)
								?.label ?? currentVisibility,
						onRemove: () => setVisibilityFilter(null),
					},
				]
			: []),
		...(currentAlgorithm
			? [
					{
						label:
							algorithmOptions.find((o) => o.value === currentAlgorithm)
								?.label ?? currentAlgorithm,
						onRemove: () => setAlgorithmFilter(null),
					},
				]
			: []),
	];

	return (
		<div className={cn("space-y-3", className)}>
			<div className="flex items-center gap-2">
				{/* Search */}
				<div className="relative flex-1">
					<Search className="absolute inset-s-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={searchValue}
						onChange={handleSearchChange}
						placeholder={t("list.searchPlaceholder")}
						className="h-9 pe-9 ps-9"
					/>
					{searchValue && (
						<button
							type="button"
							onClick={handleSearchClear}
							className="absolute inset-e-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
							aria-label="Clear search"
						>
							<X className="size-3.5" />
						</button>
					)}
				</div>

				{/* Filter popover */}
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className={cn(
								"h-9 gap-2 shrink-0",
								activeFilterCount > 0 && "border-primary"
							)}
						>
							<SlidersHorizontal className="size-3.5" />
							{t("list.filters")}
							{activeFilterCount > 0 && (
								<Badge
									variant="default"
									className="ms-0.5 size-4 rounded-full p-0 text-[10px] justify-center"
								>
									{activeFilterCount}
								</Badge>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-72 space-y-4">
						{enableOwnerFilter && (
							<>
								<div className="flex items-center justify-between gap-2">
									<label
										htmlFor="only-my-decks"
										className="text-sm font-medium"
									>
										{t("list.onlyMyDecks")}
									</label>
									<Switch
										id="only-my-decks"
										checked={onlyMine}
										onCheckedChange={setOwnerFilter}
										disabled={!userId}
									/>
								</div>
								<Separator />
							</>
						)}
						<FilterToggleGroup
							label={t("list.visibilityFilter")}
							options={visibilityOptions}
							value={currentVisibility}
							onChange={setVisibilityFilter}
						/>
						<Separator />
						<FilterToggleGroup
							label={t("list.algorithmFilter")}
							options={algorithmOptions}
							value={currentAlgorithm}
							onChange={setAlgorithmFilter}
						/>

						{activeFilterCount > 0 && (
							<>
								<Separator />
								<Button
									variant="ghost"
									size="sm"
									className="w-full text-muted-foreground"
									onClick={() => {
										setVisibilityFilter(null);
										setAlgorithmFilter(null);
										setOwnerFilter(false);
										setIsOpen(false);
									}}
								>
									{t("list.clearAll")}
								</Button>
							</>
						)}
					</PopoverContent>
				</Popover>
			</div>

			{/* Active filter chips */}
			{activeChips.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{activeChips.map((chip) => (
						<FilterChip
							key={chip.label}
							label={chip.label}
							onRemove={chip.onRemove}
						/>
					))}
				</div>
			)}
		</div>
	);
}
