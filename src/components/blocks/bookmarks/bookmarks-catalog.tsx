"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { BookmarkDetail } from "./bookmark-card";
import { BookmarkCard } from "./bookmark-card";
import { BookmarkFilters } from "./bookmark-filters";
import {
	BookmarkGrid,
	BookmarkGridEmpty,
	BookmarkGridSkeleton,
	BookmarkPagination,
} from "./bookmark-grid";

const BOOKMARK_SELECT =
	"id, user_id, item_type, item_id, notes, title, slug, description, cover_image_url, created_at, updated_at";

export function BookmarksCatalog() {
	const t = useTranslations("bookmarks");

	const bookmarksQuery = useQueryFilters<"bookmark_details", BookmarkDetail[]>({
		table: "bookmark_details",
		selectColumns: BOOKMARK_SELECT,
		searchColumns: ["title", "description"],
		initialState: {
			name: "bookmark_details",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const bookmarks = (bookmarksQuery.data as any)?.data ?? [];
	const total = (bookmarksQuery.data as any)?.count ?? null;
	const page = bookmarksQuery.state.pagination?.page ?? 1;
	const pageSize = bookmarksQuery.state.pagination?.pageSize ?? 12;

	const hasActiveFilters =
		!!bookmarksQuery.state.search ||
		(bookmarksQuery.state.filters?.length ?? 0) > 0;

	return (
		<div className="flex flex-col gap-6">
			<BookmarkFilters queryState={bookmarksQuery} />

			{bookmarksQuery.isError ? (
				<BookmarkGridEmpty
					title={t("loadError")}
					description={t("loadErrorDescription")}
					action={
						<Button
							size="sm"
							variant="outline"
							onClick={() => bookmarksQuery.refetch()}
						>
							{t("tryAgain")}
						</Button>
					}
				/>
			) : bookmarksQuery.isFetching && bookmarks.length === 0 ? (
				<BookmarkGridSkeleton count={8} />
			) : bookmarks.length === 0 ? (
				<BookmarkGridEmpty
					title={hasActiveFilters ? undefined : t("noBookmarksYet")}
					description={
						hasActiveFilters ? undefined : t("noBookmarksYetDescription")
					}
				/>
			) : (
				<BookmarkGrid>
					{bookmarks.map((bookmark: BookmarkDetail) => (
						<BookmarkCard key={bookmark.id} bookmark={bookmark} />
					))}
				</BookmarkGrid>
			)}

			<BookmarkPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(nextPage) =>
					bookmarksQuery.setPagination({ page: nextPage })
				}
			/>
		</div>
	);
}
