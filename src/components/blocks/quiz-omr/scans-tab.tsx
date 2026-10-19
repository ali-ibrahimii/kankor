"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	ClockIcon,
	EyeIcon,
	ImageIcon,
	Loader2Icon,
	RotateCcwIcon,
	ScanLineIcon,
	UploadCloudIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
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
import { createClient } from "@/lib/supabase/client";
import { listScans, listVariants } from "./actions";
import { ScanReviewDialog } from "./scan-review-dialog";
import type { OmrScanStatus } from "./types";

const IN_FLIGHT_STATUSES: OmrScanStatus[] = ["pending", "processing"];

function statusBadgeVariant(status: OmrScanStatus) {
	switch (status) {
		case "scored":
			return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
		case "needs_review":
			return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
		case "error":
			return "bg-destructive/10 text-destructive";
		default:
			return "bg-secondary text-secondary-foreground";
	}
}

async function decodeQrFromFile(file: File): Promise<string | null> {
	try {
		const jsQR = (await import("jsqr")).default;
		const bitmap = await createImageBitmap(file);
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		ctx.drawImage(bitmap, 0, 0);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const result = jsQR(imageData.data, imageData.width, imageData.height);
		return result?.data ?? null;
	} catch {
		return null;
	}
}

export interface ScansTabProps {
	quizId: string;
}

export function ScansTab({ quizId }: ScansTabProps) {
	const t = useTranslations("quizOmr.scans");
	const queryClient = useQueryClient();
	const scansKey = ["quiz-omr", quizId, "scans"];

	const { data: scans } = useQuery({
		queryKey: scansKey,
		queryFn: async () => {
			const result = await listScans(quizId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		refetchInterval: (query) => {
			const hasInFlight = query.state.data?.some((s) =>
				IN_FLIGHT_STATUSES.includes(s.status)
			);
			return hasInFlight ? 3000 : false;
		},
	});

	const { data: variants } = useQuery({
		queryKey: ["quiz-omr", quizId, "variants", "all"],
		queryFn: async () => {
			const result = await listVariants(quizId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
	});

	const [pendingFile, setPendingFile] = React.useState<File | null>(null);
	const [selectedVariantId, setSelectedVariantId] = React.useState<string>("");
	const [isUploading, setIsUploading] = React.useState(false);
	const [reviewScanId, setReviewScanId] = React.useState<string | null>(null);
	const [retryingId, setRetryingId] = React.useState<string | null>(null);

	async function handleFileSelected(files: File[]) {
		const file = files[0];
		if (!file) return;
		setPendingFile(file);

		const decoded = await decodeQrFromFile(file);
		if (decoded && variants?.some((v) => v.id === decoded)) {
			setSelectedVariantId(decoded);
			toast.success(t("qrDecoded"));
		} else {
			setSelectedVariantId("");
			if (decoded) toast.warning(t("qrDecodedUnknownVariant"));
			else toast.info(t("qrNotDecoded"));
		}
	}

	async function handleUpload() {
		if (!pendingFile || !selectedVariantId) return;
		setIsUploading(true);

		try {
			const client = createClient();
			const path = `${quizId}/${selectedVariantId}/${Date.now()}-${pendingFile.name}`;

			const { error: uploadError } = await client.storage
				.from("omr-scans")
				.upload(path, pendingFile);
			if (uploadError) throw new Error(uploadError.message);

			const { data: scan, error: rpcError } = await client
				.rpc("create_omr_scan", {
					p_variant_id: selectedVariantId,
					p_image_storage_path: path,
				})
				.single();
			if (rpcError || !scan) throw new Error(rpcError?.message ?? "Failed");

			queryClient.invalidateQueries({ queryKey: scansKey });
			setPendingFile(null);
			setSelectedVariantId("");

			// Fire the scoring call; poll picks up the resulting status change.
			const scanId = (scan as { id: string }).id;
			fetch("/api/omr/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scan_id: scanId }),
			}).finally(() => queryClient.invalidateQueries({ queryKey: scansKey }));

			toast.success(t("uploaded"));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : String(err));
		} finally {
			setIsUploading(false);
		}
	}

	async function handleRetry(scanId: string) {
		setRetryingId(scanId);
		try {
			await fetch("/api/omr/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scan_id: scanId }),
			});
		} finally {
			setRetryingId(null);
			queryClient.invalidateQueries({ queryKey: scansKey });
		}
	}

	return (
		<div className="max-w-4xl space-y-4">
			<div className="rounded-xl border p-4">
				<p className="mb-3 text-sm font-medium">{t("uploadTitle")}</p>
				<Dropzone
					onFilesSelected={handleFileSelected}
					accept="image/*"
					capture="environment"
				>
					<UploadCloudIcon className="size-8 text-muted-foreground/50" />
					<p className="text-sm font-medium">
						{pendingFile ? pendingFile.name : t("dropzoneLabel")}
					</p>
					<p className="text-xs text-muted-foreground">{t("dropzoneHint")}</p>
				</Dropzone>

				{pendingFile && (
					<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
						<Select
							value={selectedVariantId}
							onValueChange={setSelectedVariantId}
						>
							<SelectTrigger className="w-full sm:w-64">
								<SelectValue placeholder={t("variantPlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								{(variants ?? []).map((v) => (
									<SelectItem key={v.id} value={v.id}>
										{v.student_full_name ?? v.id.slice(0, 8)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							onClick={handleUpload}
							disabled={!selectedVariantId || isUploading}
							className="gap-1.5"
						>
							{isUploading && <Loader2Icon className="size-4 animate-spin" />}
							{t("uploadAction")}
						</Button>
					</div>
				)}
			</div>

			{!scans || scans.length === 0 ? (
				<div className="rounded-xl border border-dashed bg-muted/30 py-14 text-center">
					<ScanLineIcon className="mx-auto mb-3 size-9 text-muted-foreground/30" />
					<p className="text-sm font-medium">{t("empty.title")}</p>
				</div>
			) : (
				<div className="rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("table.student")}</TableHead>
								<TableHead>{t("table.status")}</TableHead>
								<TableHead>{t("table.score")}</TableHead>
								<TableHead className="w-24" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{scans.map((scan) => (
								<TableRow key={scan.id}>
									<TableCell className="font-medium">
										{scan.student_full_name ?? t("unknownStudent")}
									</TableCell>
									<TableCell>
										<Badge
											variant="secondary"
											className={statusBadgeVariant(scan.status)}
										>
											{scan.status === "pending" ||
											scan.status === "processing" ? (
												<ClockIcon className="me-1 size-3" />
											) : scan.status === "scored" ? (
												<CheckCircle2Icon className="me-1 size-3" />
											) : scan.status === "needs_review" ? (
												<AlertCircleIcon className="me-1 size-3" />
											) : (
												<AlertCircleIcon className="me-1 size-3" />
											)}
											{t(`status.${scan.status}`)}
										</Badge>
										{scan.status === "error" && scan.error_message && (
											<p className="mt-1 max-w-56 truncate text-xs text-destructive">
												{scan.error_message}
											</p>
										)}
									</TableCell>
									<TableCell>
										{scan.score_pct != null ? (
											<span className="tabular-nums">
												{scan.total_correct}/{scan.total_questions} (
												{scan.score_pct}%)
											</span>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell>
										<div className="flex justify-end gap-1">
											{scan.status === "needs_review" && (
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => setReviewScanId(scan.id)}
													title={t("reviewAction")}
												>
													<EyeIcon className="size-4" />
												</Button>
											)}
											{scan.status === "error" && (
												<Button
													variant="ghost"
													size="icon-sm"
													disabled={retryingId === scan.id}
													onClick={() => handleRetry(scan.id)}
													title={t("retryAction")}
												>
													{retryingId === scan.id ? (
														<Loader2Icon className="size-4 animate-spin" />
													) : (
														<RotateCcwIcon className="size-4" />
													)}
												</Button>
											)}
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => setReviewScanId(scan.id)}
												title={t("viewImageAction")}
											>
												<ImageIcon className="size-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<ScanReviewDialog
				scanId={reviewScanId}
				open={!!reviewScanId}
				onOpenChange={(open) => !open && setReviewScanId(null)}
				onCorrected={() =>
					queryClient.invalidateQueries({ queryKey: scansKey })
				}
			/>
		</div>
	);
}
