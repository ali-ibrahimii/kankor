"use client";

import { AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ColumnMetadata } from "@/lib/generated/table-schema";
import type { FieldMappingState } from "../../types/mapping.types";

const IGNORE_VALUE = "__ignore__";

export interface MappingStepProps {
	columns: ColumnMetadata[];
	sourceHeaders: string[];
	mapping: FieldMappingState;
	unmappedRequiredColumns: ColumnMetadata[];
	onSourceHeaderChange: (
		targetColumn: string,
		sourceHeader: string | null
	) => void;
	onDefaultValueChange: (targetColumn: string, defaultValue: string) => void;
}

/** Step 2: map source file columns onto destination table columns. */
export function MappingStep({
	columns,
	sourceHeaders,
	mapping,
	unmappedRequiredColumns,
	onSourceHeaderChange,
	onDefaultValueChange,
}: MappingStepProps) {
	const t = useTranslations("importDialog.mapping");

	return (
		<div className="space-y-4">
			{unmappedRequiredColumns.length > 0 && (
				<Alert variant="destructive">
					<AlertTriangleIcon />
					<AlertTitle>{t("requiredAlertTitle")}</AlertTitle>
					<AlertDescription>
						{unmappedRequiredColumns.map((c) => c.name).join(", ")}
					</AlertDescription>
				</Alert>
			)}

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("destinationColumn")}</TableHead>
						<TableHead>{t("sourceColumn")}</TableHead>
						<TableHead>{t("defaultValue")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{columns.map((column) => {
						const columnMapping = mapping[column.name];
						const isRequired = !column.nullable && !column.optional;

						return (
							<TableRow key={column.name}>
								<TableCell>
									<div className="flex items-center gap-1.5">
										<span className="font-medium">{column.name}</span>
										{isRequired && (
											<Badge variant="outline" className="text-[10px]">
												{t("required")}
											</Badge>
										)}
									</div>
									<span className="block text-xs text-muted-foreground">
										{column.dataType}
										{column.enumValues
											? `: ${column.enumValues.join(" | ")}`
											: ""}
									</span>
								</TableCell>
								<TableCell>
									<Select
										value={columnMapping?.sourceHeader ?? IGNORE_VALUE}
										onValueChange={(value) =>
											onSourceHeaderChange(
												column.name,
												value === IGNORE_VALUE ? null : value
											)
										}
									>
										<SelectTrigger className="w-full min-w-48">
											<SelectValue placeholder={t("dontImport")} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={IGNORE_VALUE}>
												{t("dontImport")}
											</SelectItem>
											{sourceHeaders.map((header) => (
												<SelectItem key={header} value={header}>
													{header}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell>
									<Input
										value={columnMapping?.defaultValue ?? ""}
										onChange={(event) =>
											onDefaultValueChange(column.name, event.target.value)
										}
										placeholder={
											columnMapping?.sourceHeader
												? "—"
												: t("defaultPlaceholder")
										}
										className="min-w-36"
									/>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
