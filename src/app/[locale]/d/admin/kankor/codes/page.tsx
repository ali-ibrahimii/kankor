"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";

type KankorCodeRow = {
	id: string;
	code: number;
	min_score: number;
	max_score: number;
	universities: { name: string } | null;
	departments: { name: string } | null;
};

export default function AdminKankorCodesPage() {
	const t = useTranslations("adminCatalog");

	const filters = useQueryFilters<"code", KankorCodeRow[]>({
		table: "code",
		selectColumns:
			"id, code, min_score, max_score, universities(name), departments(name)",
		initialState: {
			name: "admin-kankor-codes",
			sort: [{ field: "code", direction: "asc" }],
			pagination: { page: 1, pageSize: 25 },
		},
	});

	const result = filters.data as
		| { data?: KankorCodeRow[]; count?: number | null }
		| undefined;
	const items = result?.data ?? [];
	const total = result?.count ?? 0;
	const page = filters.state.pagination?.page ?? 1;
	const pageSize = filters.state.pagination?.pageSize ?? 25;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("codes.title")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("codes.description")}
					</p>
				</div>
				<Badge variant="secondary" className="text-xs">
					{t("totalCount", { count: total })}
				</Badge>
			</div>

			<div className="overflow-hidden rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("codes.code")}</TableHead>
							<TableHead>{t("codes.university")}</TableHead>
							<TableHead>{t("codes.department")}</TableHead>
							<TableHead>{t("codes.scoreRange")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isLoading ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									{t("loading")}
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									{t("empty")}
								</TableCell>
							</TableRow>
						) : (
							items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-mono font-semibold tabular-nums">
										{item.code}
									</TableCell>
									<TableCell className="font-medium">
										{item.universities?.name ?? "—"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{item.departments?.name ?? "—"}
									</TableCell>
									<TableCell
										className="tabular-nums text-muted-foreground"
										dir="ltr"
									>
										{item.min_score} – {item.max_score}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{total > pageSize ? (
				<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
					<span>{t("pageOf", { page, total: totalPages })}</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={() => filters.setPagination({ page: page - 1 })}
						>
							{t("previous")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= totalPages}
							onClick={() => filters.setPagination({ page: page + 1 })}
						>
							{t("next")}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
