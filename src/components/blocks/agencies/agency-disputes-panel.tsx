"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { type SimpleColumn, SimpleDataTable } from "@/components/blocks/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/hooks/use-supabase";
import type { TableRow as DbRow } from "@/types/db.types";
import { resolveAgencyDispute, respondAgencyDispute } from "./actions";

type DisputeRow = DbRow<"agency_disputes_view">;

/**
 * Dispute queue. Agencies see and respond to disputes on their own
 * transactions (`mode="agency"`); super admins resolve them, optionally
 * issuing a compensating credit adjustment (`mode="admin"`).
 */
export function AgencyDisputesPanel({
	agencyId,
	mode,
}: {
	agencyId: string;
	mode: "agency" | "admin";
}) {
	const t = useTranslations("admin.agencies.disputes");
	const queryClient = useQueryClient();
	const [selected, setSelected] = React.useState<DisputeRow | null>(null);
	const [responseText, setResponseText] = React.useState("");
	const [resolutionNote, setResolutionNote] = React.useState("");
	const [adjustment, setAdjustment] = React.useState("");

	const disputesQuery = useSupabase({
		table: "agency_disputes_view",
		selectColumns:
			"id, agency_id, topup_id, status, student_note, agency_response, resolution_note, created_at, topup_amount, topup_created_at, student_name, student_email_masked",
		state: {
			filters: [{ field: "agency_id", operator: "eq", value: agencyId }],
			sort: [{ field: "created_at", direction: "desc" }],
		},
	});
	const disputes = disputesQuery.data?.data ?? [];
	const isLoading = disputesQuery.isLoading;

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: ["agency_disputes_view"] });
		queryClient.invalidateQueries({ queryKey: ["agency_topups_view"] });
	}

	function openDetail(dispute: DisputeRow) {
		setSelected(dispute);
		setResponseText("");
		setResolutionNote("");
		setAdjustment("");
	}

	async function handleRespond() {
		if (!selected || responseText.trim().length === 0) return;
		const result = await respondAgencyDispute(
			selected.id ?? "",
			responseText.trim()
		);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(t("responded"));
		setSelected(null);
		invalidate();
	}

	async function handleResolve(status: "resolved" | "rejected") {
		if (!selected) return;
		const amount = Number(adjustment);
		const result = await resolveAgencyDispute({
			disputeId: selected.id ?? "",
			status,
			resolutionNote: resolutionNote.trim() || undefined,
			adjustmentAmount:
				Number.isInteger(amount) && amount !== 0 ? amount : undefined,
		});
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(t("resolvedToast"));
		setSelected(null);
		invalidate();
	}

	const columns: SimpleColumn<DisputeRow>[] = [
		{
			key: "student",
			header: t("table.student"),
			cell: (row) => (
				<div className="flex min-w-0 flex-col">
					<span className="truncate font-medium">
						{row.student_name ?? "—"}
					</span>
					<span className="truncate text-xs text-muted-foreground">
						{row.student_email_masked}
					</span>
				</div>
			),
		},
		{
			key: "amount",
			header: t("table.amount"),
			className: "tabular-nums",
			cell: (row) => row.topup_amount?.toLocaleString(),
		},
		{
			key: "status",
			header: t("table.status"),
			cell: (row) => (
				<Badge variant={row.status === "open" ? "destructive" : "outline"}>
					{t(`status.${row.status ?? "open"}` as never)}
				</Badge>
			),
		},
		{
			key: "created",
			header: t("table.created"),
			className: "text-sm text-muted-foreground",
			cell: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
		},
		{
			key: "actions",
			header: null,
			className: "w-24 text-end",
			cell: (row) => (
				<Button variant="outline" size="sm" onClick={() => openDetail(row)}>
					{t("view")}
				</Button>
			),
		},
	];

	return (
		<div className="space-y-4">
			<SimpleDataTable
				columns={columns}
				rows={disputes}
				rowKey={(row) => row.id ?? ""}
				isLoading={isLoading}
				emptyText={t("empty")}
			/>

			<Dialog
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("detailTitle")}</DialogTitle>
					</DialogHeader>

					{selected && (
						<div className="space-y-4">
							<div className="space-y-1 rounded-md border p-3 text-sm">
								<p>
									<span className="font-medium">{t("table.student")}: </span>
									{selected.student_name} ({selected.student_email_masked})
								</p>
								<p>
									<span className="font-medium">{t("table.amount")}: </span>
									{selected.topup_amount?.toLocaleString()}
								</p>
								<p>
									<span className="font-medium">{t("studentNote")}: </span>
									{selected.student_note}
								</p>
								{selected.agency_response && (
									<p>
										<span className="font-medium">{t("agencyResponse")}: </span>
										{selected.agency_response}
									</p>
								)}
								{selected.resolution_note && (
									<p>
										<span className="font-medium">{t("resolutionNote")}: </span>
										{selected.resolution_note}
									</p>
								)}
							</div>

							{selected.status === "open" && mode === "agency" && (
								<div className="space-y-2">
									<Label htmlFor="dispute-response">
										{t("agencyResponse")}
									</Label>
									<Textarea
										id="dispute-response"
										value={responseText}
										onChange={(e) => setResponseText(e.target.value)}
									/>
									<div className="flex justify-end">
										<Button
											onClick={handleRespond}
											disabled={responseText.trim().length === 0}
										>
											{t("respond")}
										</Button>
									</div>
								</div>
							)}

							{selected.status === "open" && mode === "admin" && (
								<div className="space-y-3">
									<div className="space-y-2">
										<Label htmlFor="dispute-resolution">
											{t("resolutionNote")}
										</Label>
										<Textarea
											id="dispute-resolution"
											value={resolutionNote}
											onChange={(e) => setResolutionNote(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="dispute-adjustment">
											{t("adjustment")}
										</Label>
										<Input
											id="dispute-adjustment"
											type="number"
											value={adjustment}
											onChange={(e) => setAdjustment(e.target.value)}
											placeholder={t("adjustmentHint")}
										/>
									</div>
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => handleResolve("rejected")}
										>
											{t("reject")}
										</Button>
										<Button onClick={() => handleResolve("resolved")}>
											{t("resolve")}
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
