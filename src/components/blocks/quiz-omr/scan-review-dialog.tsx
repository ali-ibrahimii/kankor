"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	correctScanResponse,
	getScanImageUrl,
	listScanResponses,
} from "./actions";

const OPTION_LETTERS = ["A", "B", "C", "D"];
const LOW_CONFIDENCE_THRESHOLD = 0.75;

export interface ScanReviewDialogProps {
	scanId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCorrected: () => void;
}

export function ScanReviewDialog({
	scanId,
	open,
	onOpenChange,
	onCorrected,
}: ScanReviewDialogProps) {
	const t = useTranslations("quizOmr.scans.review");
	const queryClient = useQueryClient();
	const responsesKey = ["quiz-omr", "scan", scanId, "responses"];

	const { data: responses, isLoading } = useQuery({
		queryKey: responsesKey,
		queryFn: async () => {
			if (!scanId) return [];
			const result = await listScanResponses(scanId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: !!scanId && open,
	});

	const { data: imageUrl } = useQuery({
		queryKey: ["quiz-omr", "scan", scanId, "image-url"],
		queryFn: async () => {
			if (!scanId) return null;
			const result = await getScanImageUrl(scanId);
			return result.success ? result.data : null;
		},
		enabled: !!scanId && open,
	});

	const [savingId, setSavingId] = React.useState<string | null>(null);

	async function handleCorrect(responseId: string, optionIndex: number) {
		setSavingId(responseId);
		const result = await correctScanResponse(responseId, optionIndex);
		setSavingId(null);
		if (result.success) {
			toast.success(t("saved"));
			queryClient.invalidateQueries({ queryKey: responsesKey });
			onCorrected();
		} else {
			toast.error(result.error);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="rounded-lg border bg-muted/30">
						{imageUrl ? (
							// biome-ignore lint/performance/noImgElement: signed, short-lived storage URL — next/image remote patterns aren't worth configuring for this
							<img
								src={imageUrl}
								alt={t("scanImageAlt")}
								className="max-h-96 w-full rounded-lg object-contain"
							/>
						) : (
							<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
								{t("noImage")}
							</div>
						)}
					</div>

					<div className="max-h-96 space-y-2 overflow-y-auto">
						{isLoading ? (
							<div className="flex justify-center py-10">
								<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
							</div>
						) : (
							(responses ?? []).map((r, i) => {
								const isLow =
									r.confidence == null ||
									r.confidence < LOW_CONFIDENCE_THRESHOLD;
								return (
									<div
										key={r.id}
										className={
											isLow
												? "rounded-lg border border-amber-500/40 bg-amber-500/5 p-2"
												: "rounded-lg border p-2"
										}
									>
										<div className="flex items-center justify-between gap-2">
											<span className="text-xs font-medium">
												{t("questionN", { n: i + 1 })}
											</span>
											<div className="flex items-center gap-1.5">
												{r.is_correct === true && (
													<CheckCircle2Icon className="size-3.5 text-emerald-600" />
												)}
												{isLow && (
													<Badge
														variant="secondary"
														className="bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400"
													>
														{t("lowConfidence", {
															pct: Math.round((r.confidence ?? 0) * 100),
														})}
													</Badge>
												)}
											</div>
										</div>
										<div className="mt-1.5 flex items-center gap-2">
											<Select
												value={r.detected_option_index?.toString() ?? ""}
												onValueChange={(v) => handleCorrect(r.id, Number(v))}
											>
												<SelectTrigger className="h-8 w-full">
													<SelectValue placeholder={t("noAnswerDetected")} />
												</SelectTrigger>
												<SelectContent>
													{OPTION_LETTERS.map((letter, idx) => (
														<SelectItem key={letter} value={idx.toString()}>
															{letter}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{savingId === r.id && (
												<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
											)}
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
