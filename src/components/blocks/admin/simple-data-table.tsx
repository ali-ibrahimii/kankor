"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export type SimpleColumn<T> = {
	key: string;
	header: React.ReactNode;
	cell: (row: T) => React.ReactNode;
	className?: string;
};

/**
 * Minimal declarative table with built-in loading/empty rows, shared by
 * every admin list (instructors, schools, members, content tabs).
 */
export function SimpleDataTable<T>({
	columns,
	rows,
	rowKey,
	isLoading = false,
	emptyText,
}: {
	columns: SimpleColumn<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	isLoading?: boolean;
	emptyText?: string;
}) {
	const t = useTranslations("admin.common");

	return (
		<div className="rounded-xl border bg-background">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((column) => (
							<TableHead key={column.key} className={column.className}>
								{column.header}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading && rows.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="py-10 text-center text-sm text-muted-foreground"
							>
								{t("loading")}
							</TableCell>
						</TableRow>
					) : rows.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="py-10 text-center text-sm text-muted-foreground"
							>
								{emptyText ?? t("empty")}
							</TableCell>
						</TableRow>
					) : (
						rows.map((row) => (
							<TableRow key={rowKey(row)}>
								{columns.map((column) => (
									<TableCell key={column.key} className={column.className}>
										{column.cell(row)}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
