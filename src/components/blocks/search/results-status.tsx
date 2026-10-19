"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ResultsError({
	onRetry,
	className,
}: {
	onRetry: () => void;
	className?: string;
}) {
	const t = useTranslations("search");

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-20 text-center",
				className
			)}
		>
			<p className="text-sm font-medium">{t("loadError")}</p>
			<Button size="sm" variant="outline" onClick={onRetry}>
				{t("tryAgain")}
			</Button>
		</div>
	);
}

export function ResultsEmpty({ className }: { className?: string }) {
	const t = useTranslations("search");

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 py-20 text-center",
				className
			)}
		>
			<p className="text-sm font-medium">{t("noResults")}</p>
			<p className="text-xs text-muted-foreground">
				{t("noResultsDescription")}
			</p>
		</div>
	);
}

export function ResultsPagination({
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
	const t = useTranslations("search");

	if (!total || total <= pageSize) return null;

	const totalPages = Math.ceil(total / pageSize);
	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	return (
		<div className={cn("flex items-center justify-between text-sm", className)}>
			<span className="text-muted-foreground">
				{t("showingResults", { from, to, total })}
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
