"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { useAppForm } from "@/hooks/use-form";
import { createClient } from "@/lib/supabase/client";
import {
	type SchoolSettingsValues,
	updateSchoolSettings,
} from "./school-settings-actions";

/**
 * School identity form (name, address, province, admin email). Saves through a
 * server action so RLS — not the client — decides who may edit the school.
 */
export function SchoolSettingsForm({
	schoolId,
	initialValues,
}: {
	schoolId: string;
	initialValues: SchoolSettingsValues;
}) {
	const t = useTranslations("schoolSettings");
	const client = createClient();
	const [isSaving, setIsSaving] = React.useState(false);

	const provincesQuery = useQuery({
		queryKey: ["school-settings-provinces"],
		queryFn: async () => {
			const { data, error } = await client
				.from("provinces")
				.select("id, name")
				.order("name");
			if (error) throw error;
			return (data ?? []).map((p) => ({ value: p.id, label: p.name }));
		},
		staleTime: 5 * 60 * 1000,
	});

	const form = useAppForm({
		defaultValues: {
			name: initialValues.name,
			address: initialValues.address,
			provinceId: initialValues.provinceId,
			adminEmail: initialValues.adminEmail,
		} satisfies SchoolSettingsValues,
		onSubmit: async ({ value }) => {
			setIsSaving(true);
			try {
				const result = await updateSchoolSettings(schoolId, value);
				if (result.success) {
					toast.success(t("saveSuccess"));
				} else {
					// Technical detail stays in the console; the toast stays local.
					console.error("updateSchoolSettings failed:", result.error);
					toast.error(t("saveError"));
				}
			} catch (error) {
				console.error("updateSchoolSettings failed:", error);
				toast.error(t("saveError"));
			} finally {
				setIsSaving(false);
			}
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
				className="space-y-4 text-start"
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField
						name="name"
						validators={{
							onBlur: z.string().min(1, t("validationRequired")),
						}}
					>
						{(field) => (
							<field.TextField
								label={t("nameLabel")}
								placeholder={t("namePlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="adminEmail"
						validators={{
							onBlur: z.string().email(t("validationEmail")).or(z.literal("")),
						}}
					>
						{(field) => (
							<field.TextField
								label={t("adminEmailLabel")}
								placeholder={t("adminEmailPlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="address"
						validators={{
							onBlur: z.string().min(1, t("validationRequired")),
						}}
					>
						{(field) => (
							<field.TextField
								label={t("addressLabel")}
								placeholder={t("addressPlaceholder")}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="provinceId"
						validators={{
							onBlur: z.string().min(1, t("validationRequired")),
						}}
					>
						{(field) => (
							<field.ComboboxField
								label={t("provinceLabel")}
								placeholder={t("provincePlaceholder")}
								options={provincesQuery.data ?? []}
								emptyText={t("provincesEmpty")}
								showClear
							/>
						)}
					</form.AppField>
				</div>

				<div className="flex justify-end pt-2">
					<form.SubmitButton disabled={isSaving}>{t("save")}</form.SubmitButton>
				</div>
			</form>
		</form.AppForm>
	);
}
