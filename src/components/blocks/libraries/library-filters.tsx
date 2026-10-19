"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import type { UseQueryFilters } from "@/hooks/filter/filter.hooks";
import { cn } from "@/lib/utils";
import type { LibraryFilterOption } from "./types";

type LibrarySortValue = "updated_desc" | "name_asc" | "name_desc";

export type LibraryFiltersProps = {
	queryState: Pick<
		UseQueryFilters<"libraries">,
		"state" | "setSearch" | "setFilter" | "removeFilter" | "setState" | "reset"
	>;
	books?: LibraryFilterOption[];
	categories?: LibraryFilterOption[];
	subjects?: LibraryFilterOption[];
	grades?: LibraryFilterOption[];
	className?: string;
};

function getCurrentSort(queryState: LibraryFiltersProps["queryState"]) {
	const sort = queryState.state.sort?.[0];

	if (sort?.field === "title" && sort.direction === "asc") return "name_asc";
	if (sort?.field === "title" && sort.direction === "desc") return "name_desc";

	return "updated_desc";
}

export function LibraryFilters({
	queryState,
	books = [],
	categories = [],
	subjects = [],
	grades = [],
	className,
}: LibraryFiltersProps) {
	const t = useTranslations("libraries");
	const { state, setSearch, setFilter, removeFilter, setState } = queryState;
	const [searchValue, setSearchValue] = React.useState(state.search ?? "");
	const [mobileOpen, setMobileOpen] = React.useState(false);

	React.useEffect(() => {
		setSearchValue(state.search ?? "");
	}, [state.search]);

	const categoryId =
		(state.filters?.find((filter) => filter.field === "category_id")?.value as
			| string
			| null
			| undefined) ?? "all";
	const subjectId =
		(state.filters?.find((filter) => filter.field === "subject_id")?.value as
			| string
			| null
			| undefined) ?? "all";
	const bookId =
		(state.filters?.find((filter) => filter.field === "book_id")?.value as
			| string
			| null
			| undefined) ?? "all";
	const gradeId =
		(state.filters?.find((filter) => filter.field === "grade_id")?.value as
			| string
			| null
			| undefined) ?? "all";
	const sortValue = getCurrentSort(queryState);

	function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
		setSearchValue(event.target.value);
		setSearch(event.target.value);
	}

	function handleSearchClear() {
		setSearchValue("");
		setSearch("");
	}

	function handleCategoryChange(value: string) {
		if (value === "all") removeFilter("category_id");
		else
			setFilter({ field: "category_id", operator: "eq", value: value as any });
	}

	function handleSubjectChange(value: string) {
		if (value === "all") removeFilter("subject_id");
		else
			setFilter({ field: "subject_id", operator: "eq", value: value as any });
	}

	function handleBookChange(value: string) {
		if (value === "all") removeFilter("book_id");
		else setFilter({ field: "book_id", operator: "eq", value: value as any });
	}

	function handleGradeChange(value: string) {
		if (value === "all") removeFilter("grade_id");
		else setFilter({ field: "grade_id", operator: "eq", value: value as any });
	}

	function handleSortChange(value: LibrarySortValue) {
		const sort =
			value === "name_asc"
				? [{ field: "title" as const, direction: "asc" as const }]
				: value === "name_desc"
					? [{ field: "title" as const, direction: "desc" as const }]
					: [{ field: "updated_at" as const, direction: "desc" as const }];

		setState((prev) => ({
			...prev,
			sort,
			pagination: prev.pagination
				? { ...prev.pagination, page: 1 }
				: prev.pagination,
		}));
	}

	function handleClearAll() {
		handleSearchClear();
		removeFilter(["category_id", "subject_id", "book_id", "grade_id"]);
		setMobileOpen(false);
	}

	const hasActiveFilters =
		searchValue.length > 0 ||
		categoryId !== "all" ||
		subjectId !== "all" ||
		bookId !== "all" ||
		gradeId !== "all";

	const filterDropdowns = (isMobile = false) => (
		<div
			className={cn(
				isMobile
					? "flex flex-col gap-4 p-4"
					: "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-5"
			)}
		>
			<Select value={categoryId} onValueChange={handleCategoryChange}>
				<SelectTrigger className={cn("h-9 w-full", !isMobile && "lg:w-40")}>
					<SelectValue placeholder={t("allCategories")} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="all">{t("allCategories")}</SelectItem>
						{categories.map((category) => (
							<SelectItem key={category.id} value={category.id}>
								{category.name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			<Select value={subjectId} onValueChange={handleSubjectChange}>
				<SelectTrigger className={cn("h-9 w-full", !isMobile && "lg:w-40")}>
					<SelectValue placeholder={t("allSubjects")} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="all">{t("allSubjects")}</SelectItem>
						{subjects.map((subject) => (
							<SelectItem key={subject.id} value={subject.id}>
								{subject.name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			<Select value={bookId} onValueChange={handleBookChange}>
				<SelectTrigger className={cn("h-9 w-full", !isMobile && "lg:w-40")}>
					<SelectValue placeholder={t("allBooks")} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="all">{t("allBooks")}</SelectItem>
						{books.map((book) => (
							<SelectItem key={book.id} value={book.id}>
								{book.name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			<Select value={gradeId} onValueChange={handleGradeChange}>
				<SelectTrigger className={cn("h-9 w-full", !isMobile && "lg:w-40")}>
					<SelectValue placeholder={t("allGrades")} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="all">{t("allGrades")}</SelectItem>
						{grades.map((grade) => (
							<SelectItem key={grade.id} value={grade.id}>
								{grade.name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			<Select
				value={sortValue}
				onValueChange={(value) => handleSortChange(value as LibrarySortValue)}
			>
				<SelectTrigger className={cn("h-9 w-full", !isMobile && "lg:w-40")}>
					<SelectValue placeholder={t("sort")} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="updated_desc">{t("sortRecent")}</SelectItem>
						<SelectItem value="name_asc">{t("sortNameAsc")}</SelectItem>
						<SelectItem value="name_desc">{t("sortNameDesc")}</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			<div className="flex flex-row items-center gap-2">
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

				{/* Mobile Filter Button */}
				<div className="block lg:hidden">
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<Button variant="outline" size="icon-sm" className="h-9 w-9">
								<SlidersHorizontal className="size-4" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-[300px] sm:w-[350px]">
							<SheetHeader>
								<SheetTitle>{t("filters")}</SheetTitle>
							</SheetHeader>
							<div className="mt-4 flex-1 overflow-y-auto">
								{filterDropdowns(true)}
							</div>
							{hasActiveFilters && (
								<div className="p-4 border-t mt-auto flex flex-col gap-2">
									<Button variant="outline" onClick={handleClearAll}>
										{t("clearAll")}
									</Button>
								</div>
							)}
						</SheetContent>
					</Sheet>
				</div>

				{/* Desktop Filters (Inline) */}
				<div className="hidden lg:block">{filterDropdowns(false)}</div>
			</div>

			{hasActiveFilters && (
				<div className="flex justify-end">
					<Button variant="ghost" size="sm" onClick={handleClearAll}>
						{t("clearAll")}
					</Button>
				</div>
			)}
		</div>
	);
}
