"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import z from "zod";
import { useAppForm } from "@/hooks/use-form";

export type ProvinceFormValues = {
	name: string;
};

export interface ProvinceFormProps {
	initialValues?: Partial<ProvinceFormValues>;
	onSubmit: (values: ProvinceFormValues) => Promise<void>;
	onCancel?: () => void;
	submitLabel?: string;
}

export function ProvinceForm({
	initialValues,
	onSubmit,
	onCancel,
	submitLabel,
}: ProvinceFormProps) {
	const t = useTranslations("provinces");

	const form = useAppForm({
		defaultValues: {
			name: initialValues?.name ?? "",
		} satisfies ProvinceFormValues,
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
							placeholder="e.g. Kabul"
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
