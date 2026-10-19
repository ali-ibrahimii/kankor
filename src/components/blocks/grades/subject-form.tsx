"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import z from "zod";
import { useAppForm } from "@/hooks/use-form";

export type SubjectFormValues = {
	name: string;
};

export interface SubjectFormProps {
	initialValues?: Partial<SubjectFormValues>;
	onSubmit: (values: SubjectFormValues) => Promise<void>;
	onCancel?: () => void;
	submitLabel?: string;
}

export function SubjectForm({
	initialValues,
	onSubmit,
	onCancel,
	submitLabel,
}: SubjectFormProps) {
	const t = useTranslations("grades");

	const form = useAppForm({
		defaultValues: {
			name: initialValues?.name ?? "",
		} satisfies SubjectFormValues,
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
							placeholder="e.g. Mathematics"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
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
