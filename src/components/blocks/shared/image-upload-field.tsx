"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Progress } from "@/components/ui/progress";
import {
	deleteImageAsset,
	finalizeImageUpload,
	type ImageTarget,
	requestImageUpload,
} from "@/lib/r2/image-actions";
import {
	IMAGE_ACCEPT,
	IMAGE_LIMITS,
	type ImageScope,
	isAllowedImageMimeType,
	isAllowedImageSize,
} from "@/lib/r2/public-images";
import { cn } from "@/lib/utils";

/**
 * Uploads one public image (course cover, school logo…) straight to Cloudflare
 * R2 and stores its public URL on the owner row.
 *
 * The flow mirrors the private course-asset uploader: ask the server for a
 * presigned PUT, send the bytes browser→R2 with XHR (so progress is real),
 * then have the server HEAD the object and publish it. Nothing is world
 * readable until step 3 confirms the size/type actually landed.
 */

function uploadWithProgress(
	url: string,
	file: File,
	onProgress: (percent: number) => void
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

function formatMb(bytes: number): string {
	return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export interface ImageUploadFieldProps {
	scope: ImageScope;
	ownerId: string;
	target?: ImageTarget;
	/** Current image URL (cover_image_url / logo_url), if any. */
	value?: string | null;
	/** Existing asset id, so "remove" can also delete the R2 object. */
	assetId?: string | null;
	/** `cover` renders 16:9, `logo` renders a square avatar. */
	aspect?: "cover" | "logo";
	disabled?: boolean;
	className?: string;
	onUploaded: (result: {
		url: string;
		assetId: string;
		storageKey: string;
	}) => void;
	onRemoved?: () => void;
}

export function ImageUploadField({
	scope,
	ownerId,
	target = "cover",
	value,
	assetId,
	aspect = "cover",
	disabled,
	className,
	onUploaded,
	onRemoved,
}: ImageUploadFieldProps) {
	const t = useTranslations("imageUpload");
	const [progress, setProgress] = React.useState<number | null>(null);
	const [isFinalizing, setIsFinalizing] = React.useState(false);
	const [isRemoving, setIsRemoving] = React.useState(false);
	const [preview, setPreview] = React.useState<string | null>(value ?? null);
	const [currentAssetId, setCurrentAssetId] = React.useState<string | null>(
		assetId ?? null
	);

	React.useEffect(() => {
		setPreview(value ?? null);
	}, [value]);

	React.useEffect(() => {
		setCurrentAssetId(assetId ?? null);
	}, [assetId]);

	const isBusy = progress !== null || isFinalizing || isRemoving;

	async function handleFiles(files: File[]) {
		const file = files[0];
		if (!file) return;

		if (!isAllowedImageMimeType(file.type)) {
			toast.error(t("invalidType"));
			return;
		}
		if (!isAllowedImageSize(file.size)) {
			toast.error(t("tooLarge", { max: formatMb(IMAGE_LIMITS.maxSizeBytes) }));
			return;
		}

		setProgress(0);
		try {
			const requested = await requestImageUpload({
				scope,
				ownerId,
				variant: target,
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

			const finalized = await finalizeImageUpload(
				requested.data.assetId,
				target
			);
			if (!finalized.success) {
				toast.error(finalized.error);
				return;
			}

			setPreview(finalized.data.url);
			setCurrentAssetId(finalized.data.assetId);
			onUploaded(finalized.data);
			toast.success(t("uploaded"));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t("uploadFailed"));
		} finally {
			setProgress(null);
			setIsFinalizing(false);
		}
	}

	async function handleRemove() {
		if (!currentAssetId) {
			// No R2 asset behind this URL (external/legacy link) — just clear it.
			setPreview(null);
			onRemoved?.();
			return;
		}
		setIsRemoving(true);
		try {
			const result = await deleteImageAsset(currentAssetId);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			setPreview(null);
			setCurrentAssetId(null);
			onRemoved?.();
			toast.success(t("removed"));
		} finally {
			setIsRemoving(false);
		}
	}

	return (
		<div className={cn("space-y-2", className)}>
			<Dropzone
				accept={IMAGE_ACCEPT}
				disabled={disabled || isBusy}
				onFilesSelected={handleFiles}
				className={cn(
					"relative overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 transition-colors",
					!isBusy && "hover:border-primary/50 hover:bg-primary/[.04]",
					aspect === "cover" ? "aspect-video" : "size-28 rounded-full"
				)}
				aria-label={t("dropHint")}
			>
				{preview ? (
					<Image
						src={preview}
						alt={t("preview")}
						fill
						sizes={
							aspect === "cover" ? "(max-width: 768px) 100vw, 480px" : "112px"
						}
						className="object-cover"
					/>
				) : (
					<div className="flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center">
						<ImagePlus className="size-6 text-muted-foreground" />
						<p className="text-[11px] font-bold text-muted-foreground">
							{t("dropHint")}
						</p>
						<p className="text-[10px] text-muted-foreground/70">
							{t("formats", { max: formatMb(IMAGE_LIMITS.maxSizeBytes) })}
						</p>
					</div>
				)}

				{isBusy && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-[1px]">
						<Loader2 className="size-5 animate-spin text-primary" />
						<div className="w-32">
							<Progress value={progress ?? 60} className="h-1" />
						</div>
						<p className="text-[10px] font-bold tabular-nums text-muted-foreground">
							{isFinalizing ? t("finalizing") : `${progress ?? 0}%`}
						</p>
					</div>
				)}
			</Dropzone>

			<div className="flex flex-wrap items-center gap-2">
				{preview ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={disabled || isBusy}
						onClick={handleRemove}
						className="h-8 gap-1.5 rounded-lg text-[11px] font-bold text-destructive hover:text-destructive"
					>
						<Trash2 className="size-3.5" />
						{t("remove")}
					</Button>
				) : null}

				<span className="text-[10px] text-muted-foreground">
					{t("storedInR2")}
				</span>
			</div>
		</div>
	);
}
