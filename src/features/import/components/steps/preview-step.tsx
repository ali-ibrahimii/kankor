"use client";

import { AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ColumnMetadata } from "@/lib/generated/table-schema";
import { cn } from "@/lib/utils";
import type { PreviewRow } from "../../types/validation.types";

const PREVIEW_LIMIT = 10;

export interface PreviewStepProps {
	columns: ColumnMetadata[];
	previewRows: PreviewRow[];
	totalRowCount: number;
	invalidRowCount: number;
}

/** Step 3: preview the first rows with mapped values, highlighting validation issues. */
export function PreviewStep({
	columns,
	previewRows,
	totalRowCount,
	invalidRowCount,
}: PreviewStepProps) {
	const t = useTranslations("importDialog.preview");
	const visibleRows = previewRows.slice(0, PREVIEW_LIMIT);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
				<span>
					{t("showingRows", {
						shown: visibleRows.length,
						total: totalRowCount,
					})}
				</span>
				{invalidRowCount > 0 && (
					<Badge variant="destructive">
						{t("rowsSkipped", { count: invalidRowCount })}
					</Badge>
				)}
			</div>

			{invalidRowCount > 0 && (
				<Alert variant="destructive">
					<AlertTriangleIcon />
					<AlertTitle>{t("issuesAlertTitle")}</AlertTitle>
					<AlertDescription>{t("issuesAlertDescription")}</AlertDescription>
				</Alert>
			)}

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map((column) => (
								<TableHead key={column.name}>{column.name}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{visibleRows.map((row) => {
							const hasIssues = row.issues.length > 0;
							return (
								<TableRow
									key={row.sourceRowIndex}
									data-state={hasIssues ? "selected" : undefined}
									className={cn(
										hasIssues && "bg-destructive/5 hover:bg-destructive/10"
									)}
								>
									{columns.map((column) => {
										const issue = row.issues.find(
											(i) => i.column === column.name
										);
										return (
											<TableCell
												key={column.name}
												className={cn(issue && "text-destructive")}
											>
												{issue ? (
													<span title={issue.message}>{issue.message}</span>
												) : (
													formatPreviewValue(row.values[column.name])
												)}
											</TableCell>
										);
									})}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function formatPreviewValue(value: unknown): string {
	if (value === null || value === undefined) return "—";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}
