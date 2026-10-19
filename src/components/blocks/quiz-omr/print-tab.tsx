"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	DownloadIcon,
	FileTextIcon,
	Loader2Icon,
	PrinterIcon,
	RotateCcwIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { listVariants, printVariants } from "./actions";
import type { QuizOmrSummary } from "./types";

export interface PrintTabProps {
	quiz: QuizOmrSummary;
}

export function PrintTab({ quiz }: PrintTabProps) {
	const t = useTranslations("quizOmr.print");
	const queryClient = useQueryClient();
	const variantsKey = ["quiz-omr", quiz.id, "variants", quiz.print_version];

	const { data: variants, isLoading } = useQuery({
		queryKey: variantsKey,
		queryFn: async () => {
			const result = await listVariants(quiz.id);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
	});

	const [shuffle, setShuffle] = React.useState(true);
	const [confirmed, setConfirmed] = React.useState(false);
	const [isPrinting, setIsPrinting] = React.useState(false);
	const [dialogOpen, setDialogOpen] = React.useState(false);

	const isLocked = !!quiz.locked_at;
	const hasVariants = (variants?.length ?? 0) > 0;

	async function handlePrint() {
		setIsPrinting(true);
		const result = await printVariants(quiz.id, shuffle);
		setIsPrinting(false);
		setDialogOpen(false);
		setConfirmed(false);

		if (result.success) {
			toast.success(t("printed", { count: result.data.variantCount }));
			queryClient.invalidateQueries({ queryKey: ["quiz-omr", quiz.id] });
		} else {
			toast.error(result.error);
		}
	}

	function downloadPdf() {
		window.open(`/api/omr/print?quiz_id=${quiz.id}`, "_blank");
	}

	return (
		<div className="max-w-3xl space-y-4">
			<div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-medium">
						{isLocked ? t("reprintTitle") : t("printTitle")}
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{t("printDescription")}
					</p>
				</div>

				<div className="flex shrink-0 gap-2">
					{hasVariants && (
						<Button variant="outline" onClick={downloadPdf} className="gap-1.5">
							<DownloadIcon className="size-4" />
							{t("downloadPdf")}
						</Button>
					)}

					<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<AlertDialogTrigger asChild>
							<Button className="gap-1.5">
								{isLocked ? (
									<RotateCcwIcon className="size-4" />
								) : (
									<PrinterIcon className="size-4" />
								)}
								{isLocked ? t("reprintAction") : t("printAction")}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
								<AlertDialogDescription>
									{t("confirmDescription")}
								</AlertDialogDescription>
							</AlertDialogHeader>

							<div className="space-y-4 py-2">
								<div className="flex items-center justify-between rounded-lg border p-3">
									<div>
										<Label htmlFor="shuffle-switch" className="text-sm">
											{t("shuffleLabel")}
										</Label>
										<p className="text-xs text-muted-foreground">
											{t("shuffleDescription")}
										</p>
									</div>
									<Switch
										id="shuffle-switch"
										checked={shuffle}
										onCheckedChange={setShuffle}
									/>
								</div>

								<div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
									<Checkbox
										id="lock-confirm"
										checked={confirmed}
										onCheckedChange={(v) => setConfirmed(!!v)}
										className="mt-0.5"
									/>
									<Label
										htmlFor="lock-confirm"
										className="text-xs font-normal leading-snug text-amber-800 dark:text-amber-400"
									>
										<AlertTriangleIcon className="me-1 inline size-3.5" />
										{t("lockConfirmLabel")}
									</Label>
								</div>
							</div>

							<AlertDialogFooter>
								<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
								<AlertDialogAction
									disabled={!confirmed || isPrinting}
									onClick={(e) => {
										e.preventDefault();
										handlePrint();
									}}
								>
									{isPrinting && (
										<Loader2Icon className="size-4 animate-spin" />
									)}
									{t("confirmAction")}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-10">
					<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
				</div>
			) : !variants || variants.length === 0 ? (
				<div className="rounded-xl border border-dashed bg-muted/30 py-14 text-center">
					<FileTextIcon className="mx-auto mb-3 size-9 text-muted-foreground/30" />
					<p className="text-sm font-medium">{t("empty.title")}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("empty.description")}
					</p>
				</div>
			) : (
				<div className="rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("table.student")}</TableHead>
								<TableHead>{t("table.version")}</TableHead>
								<TableHead>{t("table.shuffled")}</TableHead>
								<TableHead>{t("table.scanStatus")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{variants.map((v) => (
								<TableRow key={v.id}>
									<TableCell className="font-medium">
										{v.student_full_name ?? t("unknownStudent")}
									</TableCell>
									<TableCell>v{v.template_version}</TableCell>
									<TableCell>
										{v.shuffled ? (
											<Badge variant="secondary">{t("shuffledYes")}</Badge>
										) : (
											<span className="text-xs text-muted-foreground">
												{t("shuffledNo")}
											</span>
										)}
									</TableCell>
									<TableCell>
										{v.latest_scan_status ? (
											<Badge variant="secondary">{v.latest_scan_status}</Badge>
										) : (
											<span className="text-xs text-muted-foreground">
												{t("notScanned")}
											</span>
										)}
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
