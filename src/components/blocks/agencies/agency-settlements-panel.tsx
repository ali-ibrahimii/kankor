"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { type SimpleColumn, SimpleDataTable } from "@/components/blocks/admin";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useAppForm } from "@/hooks/use-form";
import { useSupabase } from "@/hooks/use-supabase";
import type { Database } from "@/lib/supabase/database.types";
import type { TableRow as DbRow } from "@/types/db.types";
import { recordAgencySettlement } from "./actions";

type SettlementRow = DbRow<"agency_settlements">;
type SettlementMethod = Database["public"]["Enums"]["agency_settlement_method"];

const METHODS: SettlementMethod[] = ["cash", "bank", "hawala", "other"];

/**
 * Settlement history. `canRecord` (super admin only) adds the
 * record-settlement dialog — commission is computed server-side.
 */
export function AgencySettlementsPanel({
	agencyId,
	canRecord,
}: {
	agencyId: string;
	canRecord: boolean;
}) {
	const t = useTranslations("admin.agencies.settlements");
	const queryClient = useQueryClient();
	const [recordOpen, setRecordOpen] = React.useState(false);

	const settlementsQuery = useSupabase({
		table: "agency_settlements",
		selectColumns:
			"id, agency_id, gross_amount, commission_amount, net_received, method, period_start, period_end, note, created_at",
		state: {
			filters: [{ field: "agency_id", operator: "eq", value: agencyId }],
			sort: [{ field: "created_at", direction: "desc" }],
		},
	});
	const settlements = settlementsQuery.data?.data ?? [];
	const isLoading = settlementsQuery.isLoading;

	const form = useAppForm({
		defaultValues: {
			grossAmount: "",
			method: "cash" as SettlementMethod,
			note: "",
		},
		onSubmit: async ({ value }) => {
			const result = await recordAgencySettlement({
				agencyId,
				grossAmount: Number(value.grossAmount),
				method: value.method,
				note: value.note.trim() || undefined,
			});
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(t("recorded"));
			setRecordOpen(false);
			form.reset();
			queryClient.invalidateQueries({ queryKey: ["agency_settlements"] });
			queryClient.invalidateQueries({
				queryKey: ["agency_liability_summary"],
			});
		},
	});

	const columns: SimpleColumn<SettlementRow>[] = [
		{
			key: "date",
			header: t("table.date"),
			className: "text-sm text-muted-foreground",
			cell: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
		},
		{
			key: "gross",
			header: t("table.gross"),
			className: "tabular-nums font-medium",
			cell: (row) => row.gross_amount.toLocaleString(),
		},
		{
			key: "commission",
			header: t("table.commission"),
			className: "tabular-nums",
			cell: (row) => row.commission_amount.toLocaleString(),
		},
		{
			key: "net",
			header: t("table.net"),
			className: "tabular-nums",
			cell: (row) => row.net_received.toLocaleString(),
		},
		{
			key: "method",
			header: t("table.method"),
			cell: (row) => t(`methods.${row.method}` as never),
		},
		{
			key: "note",
			header: t("table.note"),
			className: "text-sm text-muted-foreground",
			cell: (row) => row.note ?? "—",
		},
	];

	return (
		<div className="space-y-4">
			{canRecord && (
				<div className="flex justify-end">
					<Button size="sm" onClick={() => setRecordOpen(true)}>
						<Plus className="size-4" />
						{t("record")}
					</Button>
				</div>
			)}

			<SimpleDataTable
				columns={columns}
				rows={settlements}
				rowKey={(row) => row.id}
				isLoading={isLoading}
				emptyText={t("empty")}
			/>

			<Dialog open={recordOpen} onOpenChange={setRecordOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("recordTitle")}</DialogTitle>
					</DialogHeader>
					<form.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-4"
						>
							<form.AppField
								name="grossAmount"
								validators={{
									onBlur: z
										.string()
										.refine(
											(v) => Number.isInteger(Number(v)) && Number(v) > 0,
											t("validation.invalidAmount")
										),
								}}
							>
								{(field) => (
									<field.TextField
										label={t("grossAmount")}
										type="number"
										min={1}
									/>
								)}
							</form.AppField>

							<form.AppField name="method">
								{(field) => (
									<field.SelectField
										label={t("table.method")}
										options={METHODS.map((method) => ({
											label: t(`methods.${method}` as never),
											value: method,
										}))}
									/>
								)}
							</form.AppField>

							<form.AppField name="note">
								{(field) => <field.TextField label={t("table.note")} />}
							</form.AppField>

							<div className="flex justify-end pt-2">
								<form.SubmitButton className="cursor-pointer">
									{t("record")}
								</form.SubmitButton>
							</div>
						</form>
					</form.AppForm>
				</DialogContent>
			</Dialog>
		</div>
	);
}
