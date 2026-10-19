"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import { useAppForm } from "@/hooks/use-form";
import { type AgencyChargeReceipt, chargeStudent } from "./actions";

/**
 * The core agency flow: student pays cash (1 credit = 1 AFN), the agency
 * charges their account by email. Shows a receipt with the student's name
 * and masked email — never full profile data.
 */
export function ChargeStudentForm({ agencyId }: { agencyId: string }) {
	const t = useTranslations("dashboard.agency.charge");
	const queryClient = useQueryClient();
	const [receipt, setReceipt] = React.useState<AgencyChargeReceipt | null>(
		null
	);

	const form = useAppForm({
		defaultValues: { email: "", amount: "", note: "" },
		onSubmit: async ({ value }) => {
			const result = await chargeStudent({
				agencyId,
				studentEmail: value.email.trim(),
				amount: Number(value.amount),
				note: value.note.trim() || undefined,
			});
			if (!result.success) {
				toast.error(translateChargeError(result.error, t));
				return;
			}
			setReceipt(result.data);
			form.reset();
			queryClient.invalidateQueries({ queryKey: ["agency_topups_view"] });
		},
	});

	if (receipt) {
		return (
			<div className="space-y-4 rounded-lg border p-6">
				<div className="flex items-center gap-2 text-green-600 dark:text-green-500">
					<CheckCircle2 className="size-5" />
					<h2 className="font-semibold">{t("receipt.title")}</h2>
				</div>
				<dl className="space-y-2 text-sm">
					<div className="flex justify-between gap-4">
						<dt className="text-muted-foreground">{t("receipt.student")}</dt>
						<dd className="font-medium">
							{receipt.student_name} ({receipt.student_email_masked})
						</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-muted-foreground">{t("receipt.amount")}</dt>
						<dd className="font-medium tabular-nums">
							{receipt.amount.toLocaleString()} {t("receipt.currency")}
						</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-muted-foreground">{t("receipt.newBalance")}</dt>
						<dd className="font-medium tabular-nums">
							{receipt.balance_after.toLocaleString()} {t("receipt.currency")}
						</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-muted-foreground">{t("receipt.reference")}</dt>
						<dd className="font-mono text-xs">{receipt.topup_id}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-muted-foreground">{t("receipt.date")}</dt>
						<dd>{new Date(receipt.created_at).toLocaleString()}</dd>
					</div>
				</dl>
				<div className="flex justify-end">
					<Button onClick={() => setReceipt(null)}>
						{t("receipt.chargeAnother")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4 rounded-lg border p-6"
			>
				<form.AppField
					name="email"
					validators={{
						onBlur: z.string().email(t("validation.invalidEmail")),
					}}
				>
					{(field) => (
						<field.TextField
							label={t("studentEmail")}
							placeholder={t("studentEmailPlaceholder")}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="amount"
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
						<field.TextField label={t("amount")} type="number" min={1} />
					)}
				</form.AppField>

				<form.AppField name="note">
					{(field) => <field.TextField label={t("note")} />}
				</form.AppField>

				<div className="flex justify-end pt-2">
					<form.SubmitButton className="cursor-pointer">
						{t("submit")}
					</form.SubmitButton>
				</div>
			</form>
		</form.AppForm>
	);
}

/** Maps the RPC's machine-readable errors to localized user messages. */
function translateChargeError(
	error: string,
	t: ReturnType<typeof useTranslations<"dashboard.agency.charge">>
): string {
	if (error.includes("student_not_found")) return t("errors.studentNotFound");
	if (error.includes("permission_denied")) return t("errors.permissionDenied");
	if (error.includes("liability_limit_exceeded"))
		return t("errors.liabilityLimitExceeded");
	if (error.includes("invalid_amount")) return t("errors.invalidAmount");
	return error;
}
