"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { isNextImageSafe } from "@/components/blocks/course/cover.utils";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Progress } from "@/components/ui/progress";
import { deleteImageAsset, type ImageTarget } from "@/lib/r2/image-actions";
import {
	IMAGE_ACCEPT,
	IMAGE_LIMITS,
	type ImageScope,
} from "@/lib/r2/public-images";
import {
	ImageUploadError,
	uploadImageFile,
	validateImageFile,
} from "@/lib/r2/upload-client";
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

		const invalid = validateImageFile(file);
		if (invalid) {
			toast.error(
				invalid === "invalidType"
					? t("invalidType")
					: t("tooLarge", { max: formatMb(IMAGE_LIMITS.maxSizeBytes) })
			);
			return;
		}

		setProgress(0);
		try {
			const uploaded = await uploadImageFile({
				scope,
				ownerId,
				file,
				target,
				onProgress: setProgress,
				onFinalizing: () => setIsFinalizing(true),
			});

			setPreview(uploaded.url);
			setCurrentAssetId(uploaded.assetId);
			onUploaded(uploaded);
			toast.success(t("uploaded"));
		} catch (error) {
			// Never flash raw server/env text at the user — localize by cause.
			const code = error instanceof ImageUploadError ? error.code : undefined;
			const messages: Record<string, string> = {
				not_configured: t("notConfigured"),
				not_authorized: t("notAuthorized"),
				permission_check_failed: t("permissionCheckFailed"),
				upload_record_failed: t("uploadRecordFailed"),
				upload_url_failed: t("uploadUrlFailed"),
			};
			toast.error((code && messages[code]) || t("uploadFailed"));
			if (error instanceof Error) console.error(error);
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
					// next/image throws for hosts missing from next.config's
					// allowlist — cover URLs may be external or the config may lag
					// behind a changed env, so fall back to a plain <img> there.
					isNextImageSafe(preview) ? (
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
						<img
							src={preview}
							alt={t("preview")}
							className="absolute inset-0 size-full object-cover"
						/>
					)
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
