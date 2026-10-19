"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperSeparator,
	StepperTitle,
} from "@/components/ui/stepper";
import type { ImportableTableName } from "@/lib/generated/table-schema";
import { useColumnMapping } from "../hooks/use-column-mapping";
import { useFileParser } from "../hooks/use-file-parser";
import { useImportPreview } from "../hooks/use-import-preview";
import { useRunImport } from "../hooks/use-run-import";
import { useTableSchema } from "../hooks/use-table-schema";
import { ACCEPTED_FILE_EXTENSIONS } from "../parsers";
import type { ImportTarget } from "../services/import-target";
import type { ImportRunSummary } from "../types/validation.types";
import { MappingStep } from "./steps/mapping-step";
import { PreviewStep } from "./steps/preview-step";
import { ResultStep } from "./steps/result-step";
import { UploadStep } from "./steps/upload-step";

type Phase = "upload" | "mapping" | "preview" | "result";

export interface ImportDialogProps {
	/** Destination table name — the only thing this dialog knows about its caller. */
	table: ImportableTableName;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called once the import run finishes, whether or not every row succeeded. */
	onComplete?: (summary: ImportRunSummary) => void;
	/** Swap the persistence layer (default: insert directly into Supabase). */
	importTarget?: ImportTarget;
}

/**
 * Generic, table-agnostic import dialog: Upload → Map fields → Preview → Import.
 * Callers only provide a table name — schema, mapping, validation, and the
 * insert itself are all driven by the generated table metadata.
 */
export function ImportDialog({
	table,
	open,
	onOpenChange,
	onComplete,
	importTarget,
}: ImportDialogProps) {
	const t = useTranslations("importDialog");
	const schema = useTableSchema(table);
	const [phase, setPhase] = React.useState<Phase>("upload");
	const stepLabels = [
		t("steps.upload"),
		t("steps.mapping"),
		t("steps.preview"),
	];

	const fileParser = useFileParser();
	// Memoized so an unmapped file (`parsedFile` null) yields a stable empty
	// array reference — otherwise a fresh `[]` every render would retrigger
	// downstream effects (e.g. useColumnMapping's auto-detect) in a loop.
	const sourceHeaders = React.useMemo(
		() => fileParser.parsedFile?.headers ?? [],
		[fileParser.parsedFile]
	);
	const sourceRows = React.useMemo(
		() => fileParser.parsedFile?.rows ?? [],
		[fileParser.parsedFile]
	);

	const { mapping, setSourceHeader, setDefaultValue, unmappedRequiredColumns } =
		useColumnMapping(schema.columns, sourceHeaders);

	const { previewRows, totalRowCount, invalidRowCount } = useImportPreview(
		sourceRows,
		schema.columns,
		mapping
	);

	const {
		run,
		isRunning,
		progress,
		summary,
		reset: resetRun,
	} = useRunImport(importTarget);

	function resetAll() {
		fileParser.reset();
		resetRun();
		setPhase("upload");
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) resetAll();
		onOpenChange(nextOpen);
	}

	async function handleFileSelected(file: File) {
		const result = await fileParser.parseFile(file);
		if (result) setPhase("mapping");
	}

	async function handleGoogleSheetUrl(url: string) {
		const result = await fileParser.parseGoogleSheet(url);
		if (result) setPhase("mapping");
	}

	async function handleImport() {
		setPhase("result");
		const result = await run(table, previewRows, schema.columns);
		onComplete?.(result);
	}

	const stepIndex = phase === "upload" ? 0 : phase === "mapping" ? 1 : 2;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description", { table })}</DialogDescription>
				</DialogHeader>

				<div className="border-b px-6 py-4">
					<Stepper currentStep={stepIndex}>
						{stepLabels.map((label, index) => (
							<StepperItem key={label} step={index}>
								<StepperIndicator />
								<StepperTitle>{label}</StepperTitle>
								<StepperSeparator />
							</StepperItem>
						))}
					</Stepper>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					{phase === "upload" && (
						<UploadStep
							acceptedExtensions={ACCEPTED_FILE_EXTENSIONS}
							isParsing={fileParser.isParsing}
							error={fileParser.error}
							onFileSelected={handleFileSelected}
							onGoogleSheetUrl={handleGoogleSheetUrl}
						/>
					)}

					{phase === "mapping" && (
						<MappingStep
							columns={schema.columns}
							sourceHeaders={sourceHeaders}
							mapping={mapping}
							unmappedRequiredColumns={unmappedRequiredColumns}
							onSourceHeaderChange={setSourceHeader}
							onDefaultValueChange={setDefaultValue}
						/>
					)}

					{phase === "preview" && (
						<PreviewStep
							columns={schema.columns}
							previewRows={previewRows}
							totalRowCount={totalRowCount}
							invalidRowCount={invalidRowCount}
						/>
					)}

					{phase === "result" && (
						<ResultStep
							isRunning={isRunning}
							progress={progress}
							summary={summary}
						/>
					)}
				</div>

				<DialogFooter className="border-t px-6 py-4">
					{phase === "mapping" && (
						<>
							<Button variant="outline" onClick={() => setPhase("upload")}>
								<ArrowLeftIcon /> {t("footer.back")}
							</Button>
							<Button
								onClick={() => setPhase("preview")}
								disabled={unmappedRequiredColumns.length > 0}
							>
								{t("footer.continue")} <ArrowRightIcon />
							</Button>
						</>
					)}

					{phase === "preview" && (
						<>
							<Button variant="outline" onClick={() => setPhase("mapping")}>
								<ArrowLeftIcon /> {t("footer.back")}
							</Button>
							<Button onClick={handleImport} disabled={totalRowCount === 0}>
								{t("footer.importCount", {
									count: totalRowCount - invalidRowCount,
								})}
							</Button>
						</>
					)}

					{phase === "result" && !isRunning && (
						<Button onClick={() => handleOpenChange(false)}>
							{t("footer.done")}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
