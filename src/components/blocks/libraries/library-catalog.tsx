"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import {
	applyFilters,
	applyPagination,
	applySearch,
	applySort,
} from "@/hooks/filter/query-state-mapping";
import type { QueryFn } from "@/hooks/filter/types";
import { createClient } from "@/lib/supabase/client";
import { useIsAuthenticated } from "@/providers/auth.provider";
import { LibraryCard } from "./library-card";
import { LibraryFilters } from "./library-filters";
import {
	LibraryGrid,
	LibraryGridEmpty,
	LibraryGridSkeleton,
	LibraryPagination,
} from "./library-grid";
import {
	FIELDS_CATEGORY_ID,
	type LibrarySection,
	STUDIES_CATEGORY_ID,
} from "./section-categories";
import type { LibraryBook, LibraryFilterOption } from "./types";

export const BOOK_SELECT =
	"id, slug, title, desc, uri, file_path, book_id, category_id, grade_id, subject_id, created_at, updated_at, books ( id, name, full_name ), categories ( id, name, slug ), grades ( id, name ), subjects ( id, name )";

const SEARCH_COLUMNS = ["title", "desc"] as const;

/**
 * "fields"/"studies" are plain category_id filters; "more" needs `not in`,
 * which the shared filter DSL doesn't support, so this bypasses
 * `defaultQueryFn` and builds the query directly.
 */
function fixedSectionQueryFn(
	section: LibrarySection
): QueryFn<"libraries", LibraryBook[]> {
	return async (client, table, state) => {
		let query: any = client
			.from(table as any)
			.select(BOOK_SELECT, { count: "exact" });

		if (section === "fields") {
			query = query.eq("category_id", FIELDS_CATEGORY_ID);
		} else if (section === "studies") {
			query = query.eq("category_id", STUDIES_CATEGORY_ID);
		} else {
			// SQL's `NOT IN` never matches NULLs, so an explicit `.or` is needed to
			// also pull in uncategorized rows — otherwise they'd vanish from every
			// section (confirmed against real data: not.in alone returns 267 rows,
			// but 14 more have category_id IS NULL and belong in "more" too).
			query = query.or(
				`category_id.is.null,category_id.not.in.(${FIELDS_CATEGORY_ID},${STUDIES_CATEGORY_ID})`
			);
		}

		if (state?.filters?.length) {
			query = applyFilters<"libraries">(query, state.filters);
		}
		if (state?.search) {
			query = applySearch<"libraries">(query, state.search, [
				...SEARCH_COLUMNS,
			]);
		}
		if (state?.sort) {
			query = applySort<"libraries">(query, state.sort);
		}
		query = applyPagination(query, state?.pagination);

		return await query;
	};
}

async function fetchLibraryOptions() {
	const client = createClient();
	const { data, error } = await client
		.from("libraries")
		.select(
			"category_id, categories(id, name), subject_id, subjects(id, name), book_id, books(id, name), grade_id, grades(id, name)"
		);

	if (error) throw error;

	const categoriesMap = new Map<string, LibraryFilterOption>();
	const subjectsMap = new Map<string, LibraryFilterOption>();
	const booksMap = new Map<string, LibraryFilterOption>();
	const gradesMap = new Map<string, LibraryFilterOption>();

	for (const row of data ?? []) {
		if (
			row.categories &&
			typeof row.categories === "object" &&
			"id" in row.categories &&
			"name" in row.categories
		) {
			const cat = row.categories as LibraryFilterOption;
			categoriesMap.set(cat.id, cat);
		}
		if (
			row.subjects &&
			typeof row.subjects === "object" &&
			"id" in row.subjects &&
			"name" in row.subjects
		) {
			const sub = row.subjects as LibraryFilterOption;
			subjectsMap.set(sub.id, sub);
		}
		if (
			row.books &&
			typeof row.books === "object" &&
			"id" in row.books &&
			"name" in row.books
		) {
			const bk = row.books as LibraryFilterOption;
			booksMap.set(bk.id, bk);
		}
		if (
			row.grades &&
			typeof row.grades === "object" &&
			"id" in row.grades &&
			"name" in row.grades
		) {
			const grd = row.grades as LibraryFilterOption;
			gradesMap.set(grd.id, grd);
		}
	}

	return {
		categories: Array.from(categoriesMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		),
		subjects: Array.from(subjectsMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		),
		books: Array.from(booksMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		),
		grades: Array.from(gradesMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		),
	};
}

export function LibraryCatalog({
	fixedCategoryFilter,
	initialData,
}: {
	/** Pins the catalog to a fixed section instead of the free-form category filter (used by the student dashboard's Library sidebar). */
	fixedCategoryFilter?: LibrarySection;
	initialData?: { data: LibraryBook[] | null; count: number | null };
} = {}) {
	const t = useTranslations("libraries");
	const isAuthenticated = useIsAuthenticated();

	const optionsQuery = useQuery({
		queryKey: ["library-options"],
		queryFn: fetchLibraryOptions,
	});

	const booksQuery = useQueryFilters<"libraries", LibraryBook[]>({
		table: "libraries",
		selectColumns: BOOK_SELECT,
		searchColumns: ["title", "desc"],
		initialData,
		queryFn: fixedCategoryFilter
			? fixedSectionQueryFn(fixedCategoryFilter)
			: undefined,
		initialState: {
			name: fixedCategoryFilter
				? `libraries-${fixedCategoryFilter}`
				: "libraries",
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const books = (booksQuery.data as any)?.data ?? [];
	const total = (booksQuery.data as any)?.count ?? null;
	const page = booksQuery.state.pagination?.page ?? 1;
	const pageSize = booksQuery.state.pagination?.pageSize ?? 12;

	return (
		<div className="flex flex-col gap-6">
			<LibraryFilters
				queryState={booksQuery}
				books={optionsQuery.data?.books}
				categories={optionsQuery.data?.categories}
				subjects={optionsQuery.data?.subjects}
				grades={optionsQuery.data?.grades}
			/>

			{booksQuery.isError ? (
				<LibraryGridEmpty
					title={t("loadError")}
					description={t("loadErrorDescription")}
					action={
						<Button
							size="sm"
							variant="outline"
							onClick={() => booksQuery.refetch()}
						>
							{t("tryAgain")}
						</Button>
					}
				/>
			) : booksQuery.isFetching && books.length === 0 ? (
				<LibraryGridSkeleton count={pageSize} />
			) : books.length === 0 ? (
				<LibraryGridEmpty />
			) : (
				<LibraryGrid>
					{books.map((book: LibraryBook) => (
						<LibraryCard
							key={book.id}
							book={book}
							showDownloadBnt={isAuthenticated}
						/>
					))}
				</LibraryGrid>
			)}

			<LibraryPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(nextPage) =>
					booksQuery.setPagination({ page: nextPage })
				}
			/>
		</div>
	);
}
