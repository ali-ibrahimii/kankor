"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import z from "zod";
import { useAppForm } from "@/hooks/use-form";
import { createClient } from "@/lib/supabase/client";

export type SchoolFormValues = {
	name: string;
	address: string;
	provinceId: string;
};

export interface SchoolFormProps {
	initialValues?: Partial<SchoolFormValues>;
	onSubmit: (values: SchoolFormValues) => Promise<void>;
	onCancel?: () => void;
	submitLabel?: string;
}

export function SchoolForm({
	initialValues,
	onSubmit,
	onCancel,
	submitLabel,
}: SchoolFormProps) {
	const t = useTranslations("auth");
	const client = createClient();

	const provincesQuery = useQuery({
		queryKey: ["school-form-provinces"],
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
			name: initialValues?.name ?? "",
			address: initialValues?.address ?? "",
			provinceId: initialValues?.provinceId ?? "",
		} satisfies SchoolFormValues,
		onSubmit: async ({ value }) => {
			await onSubmit(value);
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
				<form.AppField
					name="name"
					validators={{
						onBlur: z.string().min(1, t("validation.required")),
					}}
				>
					{(field) => (
						<field.TextField
							label={t("common.schoolNameLabel")}
							placeholder={t("common.schoolNamePlaceholder")}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="address"
					validators={{
						onBlur: z.string().min(1, t("validation.required")),
					}}
				>
					{(field) => (
						<field.TextField
							label={t("common.schoolAddressLabel")}
							placeholder={t("common.schoolAddressPlaceholder")}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="provinceId"
					validators={{
						onBlur: z.string().min(1, t("validation.required")),
					}}
				>
					{(field) => (
						<field.ComboboxField
							label={t("common.provinceLabel")}
							placeholder={t("common.provincePlaceholder")}
							options={provincesQuery.data ?? []}
							emptyText="No provinces found"
							showClear
						/>
					)}
				</form.AppField>

				<div className="flex justify-end gap-2 pt-4">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors cursor-pointer"
						>
							Cancel
						</button>
					)}
					<form.SubmitButton className="cursor-pointer">
						{submitLabel ?? "Save"}
					</form.SubmitButton>
				</div>
			</form>
		</form.AppForm>
	);
}
