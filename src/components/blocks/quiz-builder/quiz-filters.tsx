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

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizFiltersProps = {
	queryState: Pick<
		UseQueryFilters<"admin_quizzes_view">,
		"state" | "setSearch" | "setFilter" | "removeFilter"
	>;
	className?: string;
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

// ─── QuizFilters ──────────────────────────────────────────────────────────────

export function QuizFilters({ queryState, className }: QuizFiltersProps) {
	const t = useTranslations("quizBuilder.list.filters");
	const { state, setSearch, setFilter, removeFilter } = queryState;

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
		(state.filters?.find((f) => f.field === "visibility")?.value as
			| string
			| undefined) ?? null;
	const currentIsFree =
		(state.filters?.find((f) => f.field === "is_free")?.value as
			| boolean
			| undefined) ?? null;
	const currentSchoolFilter = state.filters?.find(
		(f) => f.field === "school_id"
	);
	const standaloneOnly =
		currentSchoolFilter?.operator === "is" &&
		currentSchoolFilter.value === null;

	function setVisibilityFilter(v: string | null) {
		if (v) setFilter({ field: "visibility", operator: "eq", value: v as any });
		else removeFilter("visibility");
	}

	function setIsFreeFilter(v: string | null) {
		if (v === null) {
			removeFilter("is_free");
			return;
		}
		setFilter({ field: "is_free", operator: "eq", value: v === "free" });
	}

	function setStandaloneOnlyFilter(checked: boolean) {
		if (checked) setFilter({ field: "school_id", operator: "is", value: null });
		else removeFilter("school_id");
	}

	const visibilityOptions = [
		{ value: "public", label: t("visibilityPublic") },
		{ value: "private", label: t("visibilityPrivate") },
		{ value: "classmate", label: t("visibilityClassmate") },
	] as const;

	const isFreeOptions = [
		{ value: "free", label: t("free") },
		{ value: "paid", label: t("paid") },
	] as const;

	const isFreeValue =
		currentIsFree === null ? null : currentIsFree ? "free" : "paid";

	const activeFilterCount =
		(currentVisibility ? 1 : 0) +
		(currentIsFree !== null ? 1 : 0) +
		(standaloneOnly ? 1 : 0);

	const activeChips: { label: string; onRemove: () => void }[] = [
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
		...(currentIsFree !== null
			? [
					{
						label:
							isFreeOptions.find((o) => o.value === isFreeValue)?.label ?? "",
						onRemove: () => setIsFreeFilter(null),
					},
				]
			: []),
		...(standaloneOnly
			? [
					{
						label: t("standalone"),
						onRemove: () => setStandaloneOnlyFilter(false),
					},
				]
			: []),
	];

	return (
		<div className={cn("space-y-3", className)}>
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute inset-s-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
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
							aria-label="Clear search"
						>
							<X className="size-3.5" />
						</button>
					)}
				</div>

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
							{t("filters")}
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
						<FilterToggleGroup
							label={t("visibility")}
							options={visibilityOptions}
							value={currentVisibility}
							onChange={setVisibilityFilter}
						/>
						<Separator />
						<FilterToggleGroup
							label={t("pricing")}
							options={isFreeOptions}
							value={isFreeValue}
							onChange={setIsFreeFilter}
						/>
						<Separator />
						<div className="flex items-center justify-between gap-2">
							<label htmlFor="standalone-only" className="text-sm font-medium">
								{t("standalone")}
							</label>
							<Switch
								id="standalone-only"
								checked={standaloneOnly}
								onCheckedChange={setStandaloneOnlyFilter}
							/>
						</div>

						{activeFilterCount > 0 && (
							<>
								<Separator />
								<Button
									variant="ghost"
									size="sm"
									className="w-full text-muted-foreground"
									onClick={() => {
										setVisibilityFilter(null);
										setIsFreeFilter(null);
										setStandaloneOnlyFilter(false);
										setIsOpen(false);
									}}
								>
									{t("clearAll")}
								</Button>
							</>
						)}
					</PopoverContent>
				</Popover>
			</div>

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
