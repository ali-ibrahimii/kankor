"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Compact "Showing x–y of z" pagination footer bound to the
 * useQueryFilters pagination state. Renders nothing while the list
 * fits in a single page.
 */
export function ListPagination({
	page,
	pageSize,
	total,
	onPageChange,
}: {
	page: number;
	pageSize: number;
	total: number | null;
	onPageChange: (page: number) => void;
}) {
	const t = useTranslations("admin.common");

	if (total == null || total <= pageSize) return null;

	return (
		<div className="flex items-center justify-between text-sm">
			<span className="text-muted-foreground">
				{t("showing", {
					from: (page - 1) * pageSize + 1,
					to: Math.min(page * pageSize, total),
					total,
				})}
			</span>
			<div className="flex items-center gap-1">
				<Button
					size="sm"
					variant="outline"
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
				>
					{t("previous")}
				</Button>
				<Button
					size="sm"
					variant="outline"
					disabled={page * pageSize >= total}
					onClick={() => onPageChange(page + 1)}
				>
					{t("next")}
				</Button>
			</div>
		</div>
	);
}
