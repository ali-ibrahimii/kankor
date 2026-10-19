"use client";

import {
	FileSpreadsheetIcon,
	LinkIcon,
	Loader2Icon,
	UploadIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface UploadStepProps {
	acceptedExtensions: string[];
	isParsing: boolean;
	error: string | null;
	onFileSelected: (file: File) => void;
	onGoogleSheetUrl: (url: string) => void;
}

/** Step 1: pick a file (drag & drop or browse) or paste a public Google Sheets link. */
export function UploadStep({
	acceptedExtensions,
	isParsing,
	error,
	onFileSelected,
	onGoogleSheetUrl,
}: UploadStepProps) {
	const t = useTranslations("importDialog.upload");
	const [sheetUrl, setSheetUrl] = React.useState("");

	return (
		<div className="space-y-4">
			<Tabs defaultValue="file">
				<TabsList className="w-full">
					<TabsTrigger value="file" className="gap-1.5">
						<UploadIcon />
						{t("fileTab")}
					</TabsTrigger>
					<TabsTrigger value="google-sheet" className="gap-1.5">
						<LinkIcon />
						{t("googleSheetTab")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="file">
					<Dropzone
						accept={acceptedExtensions.join(",")}
						onFilesSelected={(files) => files[0] && onFileSelected(files[0])}
						disabled={isParsing}
					>
						{isParsing ? (
							<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
						) : (
							<FileSpreadsheetIcon className="size-8 text-muted-foreground" />
						)}
						<div>
							<p className="text-sm font-medium">
								{isParsing ? t("dropzoneParsing") : t("dropzoneIdle")}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{t("supports", { extensions: acceptedExtensions.join(", ") })}
							</p>
						</div>
					</Dropzone>
				</TabsContent>

				<TabsContent value="google-sheet" className="space-y-3">
					<p className="text-sm text-muted-foreground">
						{t("googleSheetHint")}
					</p>
					<div className="flex gap-2">
						<Input
							value={sheetUrl}
							onChange={(event) => setSheetUrl(event.target.value)}
							placeholder={t("googleSheetPlaceholder")}
							disabled={isParsing}
						/>
						<Button
							onClick={() =>
								sheetUrl.trim() && onGoogleSheetUrl(sheetUrl.trim())
							}
							disabled={isParsing || !sheetUrl.trim()}
						>
							{isParsing ? (
								<Loader2Icon className="animate-spin" />
							) : (
								t("submit")
							)}
						</Button>
					</div>
				</TabsContent>
			</Tabs>

			{error && (
				<Alert variant="destructive">
					<AlertTitle>{t("errorTitle")}</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
