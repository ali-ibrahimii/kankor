"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import z from "zod";
import { useAppForm } from "@/hooks/use-form";
import { createClient } from "@/lib/supabase/client";

// ─── Slug helper supporting Persian/Dari/Pashto and English ──────────────────
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-")
		.replace(/^-+|-+$/g, "");
}

export type BookFormValues = {
	name: string;
	full_name: string;
	file_path: string;
	grade_id: string;
	subject_id: string;
};

export interface BookFormProps {
	initialValues?: Partial<BookFormValues>;
	onSubmit: (values: BookFormValues) => Promise<void>;
	onCancel?: () => void;
	submitLabel?: string;
}

export function BookForm({
	initialValues,
	onSubmit,
	onCancel,
	submitLabel,
}: BookFormProps) {
	const t = useTranslations("grades");
	const client = createClient();

	const gradesQuery = useQuery({
		queryKey: ["admin", "grades-options"],
		queryFn: async () => {
			const { data, error } = await client
				.from("grades")
				.select("id, name")
				.order("ordering");
			if (error) throw error;
			return (data ?? []).map((g) => ({ value: g.id, label: g.name }));
		},
		staleTime: 5 * 60 * 1000,
	});

	const subjectsQuery = useQuery({
		queryKey: ["admin", "subjects-options"],
		queryFn: async () => {
			const { data, error } = await client
				.from("subjects")
				.select("id, name")
				.order("name");
			if (error) throw error;
			return (data ?? []).map((s) => ({ value: s.id, label: s.name }));
		},
		staleTime: 5 * 60 * 1000,
	});

	const form = useAppForm({
		defaultValues: {
			name: initialValues?.name ?? "",
			full_name: initialValues?.full_name ?? "",
			file_path: initialValues?.file_path ?? "",
			grade_id: initialValues?.grade_id ?? "",
			subject_id: initialValues?.subject_id ?? "",
		} satisfies BookFormValues,
		onSubmit: async ({ value }) => {
			// Auto fill file_path if empty
			const finalValues = { ...value };
			if (!finalValues.file_path.trim() && finalValues.name.trim()) {
				finalValues.file_path = generateSlug(finalValues.name);
			}
			await onSubmit(finalValues);
		},
	});

	// Auto generate file_path on name change if pristine
	const handleNameChange = (val: string, fieldChange: (v: string) => void) => {
		fieldChange(val);
		const currentPath = form.getFieldValue("file_path");
		if (!currentPath) {
			form.setFieldValue("file_path", generateSlug(val));
		}
	};

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
							placeholder="e.g. Mathematics Grade 12"
							value={field.state.value}
							onChange={(e) =>
								handleNameChange(e.target.value, field.handleChange)
							}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="full_name"
					validators={{
						onBlur: z.string().min(1, t("admin.validation.fullNameRequired")),
					}}
				>
					{(field) => (
						<field.TextField
							label={t("admin.fields.fullName")}
							placeholder="e.g. Mathematics - Grade 12 (Ministry of Education)"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="file_path"
					validators={{
						onBlur: z.string().min(1, t("admin.validation.filePathRequired")),
					}}
				>
					{(field) => (
						<field.TextField
							label={t("admin.fields.filePath")}
							placeholder="e.g. mathematics-grade-12"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					)}
				</form.AppField>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<form.AppField name="grade_id">
						{(field) => (
							<field.ComboboxField
								label={t("admin.fields.grade")}
								placeholder={t("admin.fields.grade")}
								options={gradesQuery.data ?? []}
								emptyText="No grades found"
								showClear
							/>
						)}
					</form.AppField>

					<form.AppField name="subject_id">
						{(field) => (
							<field.ComboboxField
								label={t("admin.fields.subject")}
								placeholder={t("admin.fields.subject")}
								options={subjectsQuery.data ?? []}
								emptyText="No subjects found"
								showClear
							/>
						)}
					</form.AppField>
				</div>

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
