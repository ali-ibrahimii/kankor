"use client";

import {
	ExternalLinkIcon,
	FileIcon,
	Loader2Icon,
	UploadCloudIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Progress } from "@/components/ui/progress";
import {
	deleteCourseAsset,
	finalizeAssetUpload,
	getAssetSignedUrl,
	requestAssetUpload,
} from "@/lib/r2/actions";
import {
	ASSET_LIMITS,
	type AssetKind,
	isAllowedMimeType,
	isAllowedSize,
} from "@/lib/r2/constants";
import { cn } from "@/lib/utils";

/** Storage keys look like `courses/{courseId}/{kind}/{uuid}-{filename}`. */
function displayNameFromKey(storageKey: string): string {
	const base = storageKey.split("/").pop() ?? storageKey;
	const dashIndex = base.indexOf("-", 36);
	return dashIndex > 0 ? base.slice(dashIndex + 1) : base;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex++;
	}
	return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/** Uploads directly to R2 via a presigned PUT, tracking progress with XHR (fetch has no upload progress event). */
function uploadWithProgress(
	url: string,
	file: File,
	onProgress: (pct: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url);
		xhr.setRequestHeader("Content-Type", file.type);
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress(Math.round((event.loaded / event.total) * 100));
			}
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) resolve();
			else reject(new Error(`Upload failed (${xhr.status})`));
		};
		xhr.onerror = () => reject(new Error("Upload failed"));
		xhr.send(file);
	});
}

export interface AssetUploadProps {
	courseId: string;
	blockId: string;
	kind: AssetKind;
	storageKey: string | null;
	onUploaded: (storageKey: string) => void;
	onRemoved: () => void;
	disabled?: boolean;
}

export function AssetUpload({
	courseId,
	blockId,
	kind,
	storageKey,
	onUploaded,
	onRemoved,
	disabled,
}: AssetUploadProps) {
	const t = useTranslations("courseBuilder.block.upload");
	const [progress, setProgress] = React.useState<number | null>(null);
	const [isFinalizing, setIsFinalizing] = React.useState(false);
	const [isRemoving, setIsRemoving] = React.useState(false);
	const [isOpening, setIsOpening] = React.useState(false);

	const limits = ASSET_LIMITS[kind];
	const isBusy = progress !== null || isFinalizing;

	async function handleFilesSelected(files: File[]) {
		const file = files[0];
		if (!file) return;

		if (!isAllowedMimeType(kind, file.type)) {
			toast.error(t("invalidType"));
			return;
		}
		if (!isAllowedSize(kind, file.size)) {
			toast.error(t("tooLarge", { max: formatBytes(limits.maxSizeBytes) }));
			return;
		}

		setProgress(0);
		try {
			const requested = await requestAssetUpload({
				courseId,
				blockId,
				kind,
				filename: file.name,
				mimeType: file.type,
				sizeBytes: file.size,
			});
			if (!requested.success) {
				toast.error(requested.error);
				setProgress(null);
				return;
			}

			await uploadWithProgress(requested.data.uploadUrl, file, setProgress);
			setProgress(100);
			setIsFinalizing(true);

			const finalized = await finalizeAssetUpload(requested.data.assetId);
			if (!finalized.success) {
				toast.error(finalized.error);
				return;
			}

			onUploaded(finalized.data.storageKey);
			toast.success(t("uploadSuccess"));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t("uploadFailed"));
		} finally {
			setProgress(null);
			setIsFinalizing(false);
		}
	}

	async function handleOpen() {
		if (!storageKey) return;
		setIsOpening(true);
		try {
			const result = await getAssetSignedUrl(storageKey);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			window.open(result.data.url, "_blank", "noopener,noreferrer");
		} finally {
			setIsOpening(false);
		}
	}

	async function handleRemove() {
		if (!storageKey) return;
		setIsRemoving(true);
		try {
			const result = await deleteCourseAsset(storageKey);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			onRemoved();
		} finally {
			setIsRemoving(false);
		}
	}

	if (storageKey) {
		return (
			<div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
				<FileIcon className="size-4 shrink-0 text-muted-foreground" />
				<span className="min-w-0 flex-1 truncate text-sm">
					{displayNameFromKey(storageKey)}
				</span>
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					onClick={handleOpen}
					disabled={isOpening || disabled}
					title={t("open")}
				>
					{isOpening ? (
						<Loader2Icon className="size-3.5 animate-spin" />
					) : (
						<ExternalLinkIcon className="size-3.5" />
					)}
				</Button>
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					onClick={handleRemove}
					disabled={isRemoving || disabled}
					title={t("remove")}
					className="text-muted-foreground hover:text-destructive"
				>
					{isRemoving ? (
						<Loader2Icon className="size-3.5 animate-spin" />
					) : (
						<XIcon className="size-3.5" />
					)}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Dropzone
				onFilesSelected={handleFilesSelected}
				accept={limits.allowedMimeTypes.join(",")}
				disabled={isBusy || disabled}
				className={cn("py-6", isBusy && "pointer-events-none")}
			>
				{isBusy ? (
					<Loader2Icon className="size-6 animate-spin text-muted-foreground/60" />
				) : (
					<UploadCloudIcon className="size-6 text-muted-foreground/50" />
				)}
				<p className="text-sm font-medium">
					{isFinalizing
						? t("verifying")
						: progress !== null
							? t("uploading", { pct: progress })
							: t("dropzoneLabel")}
				</p>
				<p className="text-xs text-muted-foreground">
					{t("dropzoneHint", { max: formatBytes(limits.maxSizeBytes) })}
				</p>
			</Dropzone>
			{progress !== null && <Progress value={progress} />}
		</div>
	);
}
