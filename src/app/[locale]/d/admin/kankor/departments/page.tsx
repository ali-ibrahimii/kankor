"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";

type DepartmentRow = {
	id: string;
	name: string;
	created_at: string;
	faculties: { name: string } | null;
};

export default function AdminDepartmentsPage() {
	const t = useTranslations("adminCatalog");
	const locale = useLocale();
	const dateFormat = React.useMemo(
		() =>
			new Intl.DateTimeFormat(
				locale === "en" ? "en-US" : locale === "ps" ? "ps-AF" : "fa-AF",
				{ dateStyle: "medium" }
			),
		[locale]
	);

	const filters = useQueryFilters<"departments", DepartmentRow[]>({
		table: "departments",
		selectColumns: "id, name, created_at, faculties(name)",
		searchColumns: ["name"],
		initialState: {
			name: "admin-departments",
			sort: [{ field: "name", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const result = filters.data as
		| { data?: DepartmentRow[]; count?: number | null }
		| undefined;
	const items = result?.data ?? [];
	const total = result?.count ?? 0;
	const page = filters.state.pagination?.page ?? 1;
	const pageSize = filters.state.pagination?.pageSize ?? 20;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("departments.title")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("departments.description")}
					</p>
				</div>
				<Badge variant="secondary" className="text-xs">
					{t("totalCount", { count: total })}
				</Badge>
			</div>

			<div className="relative max-w-sm">
				<Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={filters.state.search ?? ""}
					onChange={(e) => filters.setSearch(e.target.value)}
					placeholder={t("searchPlaceholder")}
					className="ps-9"
				/>
			</div>

			<div className="overflow-hidden rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("name")}</TableHead>
							<TableHead>{t("departments.faculty")}</TableHead>
							<TableHead>{t("createdAt")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isLoading ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									{t("loading")}
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									{t("empty")}
								</TableCell>
							</TableRow>
						) : (
							items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{item.faculties?.name ?? "—"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{dateFormat.format(new Date(item.created_at))}
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
