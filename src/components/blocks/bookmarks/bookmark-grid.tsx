import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookmarkCardSkeleton } from "./bookmark-card";

export function BookmarkGrid({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
				className
			)}
		>
			{children}
		</div>
	);
}

export function BookmarkGridSkeleton({ count = 8 }: { count?: number }) {
	return (
		<BookmarkGrid>
			{Array.from({ length: count }).map((_, index) => (
				<BookmarkCardSkeleton key={index} />
			))}
		</BookmarkGrid>
	);
}

export function BookmarkGridEmpty({
	title,
	description,
	action,
	className,
}: {
	title?: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}) {
	const t = useTranslations("bookmarks");

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-20 text-center",
				className
			)}
		>
			<div className="flex size-12 items-center justify-center rounded-full bg-muted">
				<Bookmark className="size-5 text-muted-foreground" />
			</div>
			<div>
				<p className="text-sm font-medium">{title ?? t("noBookmarksFound")}</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{description ?? t("noBookmarksDescription")}
				</p>
			</div>
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}

export function BookmarkPagination({
	page,
	pageSize,
	total,
	onPageChange,
	className,
}: {
	page: number;
	pageSize: number;
	total: number | null;
	onPageChange: (page: number) => void;
	className?: string;
}) {
	const t = useTranslations("bookmarks");

	if (!total || total <= pageSize) return null;

	const totalPages = Math.ceil(total / pageSize);
	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	return (
		<div className={cn("flex items-center justify-between text-sm", className)}>
			<span className="text-muted-foreground">
				{t("showing", { from, to, total })}
			</span>

			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
				>
					{t("previous")}
				</Button>
				<span className="px-2 text-xs text-muted-foreground">
					{page} / {totalPages}
				</span>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
				>
					{t("next")}
				</Button>
			</div>
		</div>
	);
}
