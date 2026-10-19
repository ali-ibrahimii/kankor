"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import z from "zod";
import { useAppForm } from "@/hooks/use-form";
import { createClient } from "@/lib/supabase/client";

export type GradeFormValues = {
	name: string;
	ordering: number;
	category_id: string;
};

type GradeFormValuesLocal = {
	name: string;
	ordering: string;
	category_id: string;
};

export interface GradeFormProps {
	initialValues?: Partial<GradeFormValues>;
	onSubmit: (values: GradeFormValues) => Promise<void>;
	onCancel?: () => void;
	submitLabel?: string;
}

export function GradeForm({
	initialValues,
	onSubmit,
	onCancel,
	submitLabel,
}: GradeFormProps) {
	const t = useTranslations("grades");
	const client = createClient();

	const categoriesQuery = useQuery({
		queryKey: ["admin", "categories-options"],
		queryFn: async () => {
			const { data, error } = await client
				.from("categories")
				.select("id, name")
				.order("name");
			if (error) throw error;
			return (data ?? []).map((c) => ({ value: c.id, label: c.name }));
		},
		staleTime: 5 * 60 * 1000,
	});

	const form = useAppForm({
		defaultValues: {
			name: initialValues?.name ?? "",
			ordering: initialValues?.ordering?.toString() ?? "0",
			category_id: initialValues?.category_id ?? "",
		} satisfies GradeFormValuesLocal,
		onSubmit: async ({ value }) => {
			await onSubmit({
				name: value.name,
				ordering: Number(value.ordering) || 0,
				category_id: value.category_id,
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
						onBlur: z.string().min(1, t("admin.validation.nameRequired")),
					}}
				>
					{(field) => (
						<field.TextField
							label={t("admin.fields.name")}
							placeholder="e.g. Grade 12"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="ordering"
					validators={{
						onBlur: z
							.string()
							.refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
								message: t("admin.validation.orderingRequired"),
							}),
					}}
				>
					{(field) => (
						<field.TextField
							label={t("admin.fields.ordering")}
							type="number"
							placeholder="e.g. 12"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					)}
				</form.AppField>

				<form.AppField name="category_id">
					{(field) => (
						<field.ComboboxField
							label={t("admin.fields.category")}
							placeholder={t("admin.fields.category")}
							options={categoriesQuery.data ?? []}
							emptyText="No categories found"
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
							{t("admin.buttons.cancel")}
						</button>
					)}
					<form.SubmitButton className="cursor-pointer">
						{submitLabel ?? t("admin.buttons.save")}
					</form.SubmitButton>
				</div>
			</form>
		</form.AppForm>
	);
}
