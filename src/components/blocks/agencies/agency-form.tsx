"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import z from "zod";
import { useAppForm } from "@/hooks/use-form";
import { useSupabase } from "@/hooks/use-supabase";
import type { AgencyUpsertValues } from "./actions";

export interface AgencyFormProps {
	initialValues?: Partial<AgencyUpsertValues>;
	onSubmit: (values: AgencyUpsertValues) => Promise<void>;
	onCancel?: () => void;
	submitLabel?: string;
}

/** Create/edit form for an agency (super admin only). */
export function AgencyForm({
	initialValues,
	onSubmit,
	onCancel,
	submitLabel,
}: AgencyFormProps) {
	const t = useTranslations("admin.agencies.form");

	const provincesQuery = useSupabase({
		table: "provinces",
		selectColumns: "id, name",
		staleTime: Infinity,
	});
	const provinces = provincesQuery.data?.data ?? [];

	const form = useAppForm({
		defaultValues: {
			name: initialValues?.name ?? "",
			province_id: initialValues?.province_id ?? "",
			contact_email: initialValues?.contact_email ?? "",
			contact_phone: initialValues?.contact_phone ?? "",
			address: initialValues?.address ?? "",
			// stored as a fraction (0.05); edited as a percentage (5)
			commission_percent:
				initialValues?.commission_rate != null
					? String(initialValues.commission_rate * 100)
					: "0",
			liability_limit:
				initialValues?.liability_limit != null
					? String(initialValues.liability_limit)
					: "",
		},
		onSubmit: async ({ value }) => {
			await onSubmit({
				name: value.name.trim(),
				province_id: value.province_id || null,
				contact_email: value.contact_email.trim() || null,
				contact_phone: value.contact_phone.trim() || null,
				address: value.address.trim() || null,
				commission_rate: Number(value.commission_percent) / 100,
				liability_limit: Number(value.liability_limit),
			});
		},
	});

	return (
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
					name="name"
					validators={{
						onBlur: z.string().min(1, t("validation.nameRequired")),
					}}
				>
					{(field) => <field.TextField label={t("name")} />}
				</form.AppField>

				<form.AppField name="province_id">
					{(field) => (
						<field.SelectField
							label={t("province")}
							options={provinces.map((p) => ({
								label: p.name ?? "",
								value: p.id,
							}))}
						/>
					)}
				</form.AppField>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<form.AppField
						name="contact_email"
						validators={{
							onBlur: z
								.string()
								.email(t("validation.invalidEmail"))
								.or(z.literal("")),
						}}
					>
						{(field) => <field.TextField label={t("contactEmail")} />}
					</form.AppField>

					<form.AppField name="contact_phone">
						{(field) => <field.TextField label={t("contactPhone")} />}
					</form.AppField>
				</div>

				<form.AppField name="address">
					{(field) => <field.TextField label={t("address")} />}
				</form.AppField>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<form.AppField
						name="commission_percent"
						validators={{
							onBlur: z
								.string()
								.refine(
									(v) => Number(v) >= 0 && Number(v) < 100,
									t("validation.invalidCommission")
								),
						}}
					>
						{(field) => (
							<field.TextField
								label={t("commissionPercent")}
								type="number"
								min={0}
								max={99}
								step={0.5}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="liability_limit"
						validators={{
							onBlur: z
								.string()
								.refine(
									(v) => Number.isInteger(Number(v)) && Number(v) > 0,
									t("validation.invalidLiabilityLimit")
								),
						}}
					>
						{(field) => (
							<field.TextField
								label={t("liabilityLimit")}
								type="number"
								min={1}
							/>
						)}
					</form.AppField>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
						>
							{t("cancel")}
						</button>
					)}
					<form.SubmitButton className="cursor-pointer">
						{submitLabel ?? t("save")}
					</form.SubmitButton>
				</div>
			</form>
		</form.AppForm>
	);
}
