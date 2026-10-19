"use client";

import { BookOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";
import { DeckCardSkeleton } from "./deck-card";

// ─── DeckGrid ─────────────────────────────────────────────────────────────────

export function DeckGrid({
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

// ─── DeckGridSkeleton ─────────────────────────────────────────────────────────

export function DeckGridSkeleton({ count = 8 }: { count?: number }) {
	return (
		<DeckGrid>
			{Array.from({ length: count }).map((_, i) => (
				<DeckCardSkeleton key={i} />
			))}
		</DeckGrid>
	);
}

// ─── DeckGridEmpty ────────────────────────────────────────────────────────────

export function DeckGridEmpty({
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
	const t = useTranslations("flashcardBuilder");

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-20 text-center",
				className
			)}
		>
			<div className="flex size-12 items-center justify-center rounded-full bg-muted">
				<BookOpenIcon className="size-5 text-muted-foreground" />
			</div>
			<div>
				<p className="text-sm font-medium">{title ?? t("list.emptyTitle")}</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{description ?? t("list.emptyDescription")}
				</p>
			</div>
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}

// ─── DeckPagination ───────────────────────────────────────────────────────────

export function DeckPagination({
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
	const t = useTranslations("flashcardBuilder");

	if (!total || total <= pageSize) return null;

	const totalPages = Math.ceil(total / pageSize);
	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	return (
		<div className={cn("flex items-center justify-between text-sm", className)}>
			<span className="text-muted-foreground">
				{t("list.showing", { from, to, total })}
			</span>

			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
					className="rounded-md border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
				>
					{t("list.previous")}
				</button>
				<span className="px-2 text-xs text-muted-foreground">
					{page} / {totalPages}
				</span>
				<button
					type="button"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
					className="rounded-md border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
				>
					{t("list.next")}
				</button>
			</div>
		</div>
	);
}
