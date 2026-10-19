"use client";

import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type {
	ImportProgress,
	ImportRunSummary,
} from "../../types/validation.types";

export interface ResultStepProps {
	isRunning: boolean;
	progress: ImportProgress | null;
	summary: ImportRunSummary | null;
}

/** Import progress and final success/failure summary. */
export function ResultStep({ isRunning, progress, summary }: ResultStepProps) {
	const t = useTranslations("importDialog.result");

	if (isRunning) {
		const percent =
			progress && progress.total > 0
				? (progress.processed / progress.total) * 100
				: 0;
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
				<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
				<div className="w-full max-w-sm space-y-2">
					<Progress value={percent} />
					<p className="text-sm text-muted-foreground">
						{t("importing", {
							processed: progress?.processed ?? 0,
							total: progress?.total ?? 0,
						})}
					</p>
				</div>
			</div>
		);
	}

	if (!summary) return null;

	const hasErrors = summary.errors.length > 0;

	return (
		<div className="space-y-4">
			<div className="flex flex-col items-center gap-2 py-4 text-center">
				{hasErrors ? (
					<AlertTriangleIcon className="size-8 text-amber-500" />
				) : (
					<CheckCircle2Icon className="size-8 text-emerald-500" />
				)}
				<p className="text-sm font-medium">
					{hasErrors
						? t("importedWithFailures", {
								count: summary.insertedCount,
								failed: summary.errors.length,
							})
						: t("importedSummary", { count: summary.insertedCount })}
				</p>
			</div>

			{hasErrors && (
				<Alert variant="destructive">
					<AlertTriangleIcon />
					<AlertTitle>{t("errorsAlertTitle")}</AlertTitle>
					<AlertDescription>{t("errorsAlertDescription")}</AlertDescription>
				</Alert>
			)}

			{hasErrors && (
				<div className="max-h-64 overflow-y-auto rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-20">{t("rowColumn")}</TableHead>
								<TableHead>{t("reasonColumn")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{summary.errors.map((error) => (
								<TableRow key={error.sourceRowIndex}>
									<TableCell>{error.sourceRowIndex + 1}</TableCell>
									<TableCell className="text-destructive">
										{error.message}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
