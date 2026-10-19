"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderIcon, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { RelatedResourcesSelector } from "@/components/blocks/RelatedResourcesSelector";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/hooks/use-form";
import { requestLibraryUpload } from "@/lib/r2/actions";
import { createClient } from "@/lib/supabase/client";

// ─── Slug helper supporting Persian/Dari/Pashto and English ──────────────────
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-")
		.replace(/^-+|-+$/g, "");
}

export type LibraryFormValues = {
	title: string;
	desc: string;
	file_path: string;
	uri: string;
	slug: string;
	book_id: string;
	category_id: string;
	grade_id: string;
	subject_id: string;
	seo_title: string;
	seo_description: string;
	related_courses_ids: string[];
	related_decks_ids: string[];
};

export interface LibraryFormProps {
	initialValues?: Partial<LibraryFormValues>;
	onSubmit: (values: LibraryFormValues) => Promise<void>;
	onCancel?: () => void;
	submitLabel?: string;
}

export function LibraryForm({
	initialValues,
	onSubmit,
	onCancel,
	submitLabel,
}: LibraryFormProps) {
	const t = useTranslations("libraries");
	const [uploadProgress, setUploadProgress] = React.useState<number | null>(
		null
	);

	// --- Reference Data Queries ---
	const client = createClient();

	const booksQuery = useQuery({
		queryKey: ["admin", "books-options"],
		queryFn: async () => {
			const { data, error } = await client
				.from("books")
				.select("id, name:full_name")
				.order("full_name");
			if (error) throw error;
			return (data ?? []).map((b) => ({ value: b.id, label: b.name ?? "" }));
		},
		staleTime: 5 * 60 * 1000,
	});

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
			title: initialValues?.title ?? "",
			desc: initialValues?.desc ?? "",
			file_path: initialValues?.file_path ?? "",
			uri: initialValues?.uri ?? "",
			slug: initialValues?.slug ?? "",
			book_id: initialValues?.book_id ?? "",
			category_id: initialValues?.category_id ?? "",
			grade_id: initialValues?.grade_id ?? "",
			subject_id: initialValues?.subject_id ?? "",
			seo_title: initialValues?.seo_title ?? "",
			seo_description: initialValues?.seo_description ?? "",
			related_courses_ids: initialValues?.related_courses_ids ?? [],
			related_decks_ids: initialValues?.related_decks_ids ?? [],
		} satisfies LibraryFormValues,
		onSubmit: async ({ value }) => {
			// Auto-generate slug and file_path if empty
			const finalValues = { ...value };
			if (!finalValues.slug.trim() && finalValues.title.trim()) {
				finalValues.slug = generateSlug(finalValues.title);
			}
			if (!finalValues.file_path.trim() && finalValues.slug.trim()) {
				finalValues.file_path = finalValues.slug;
			}
			await onSubmit(finalValues);
		},
	});

	// Detect title change to auto-fill slug/file_path if they are pristine/empty
	const handleTitleChange = (val: string, fieldChange: (v: string) => void) => {
		fieldChange(val);
		const currentSlug = form.getFieldValue("slug");
		const currentFilePath = form.getFieldValue("file_path");

		if (!currentSlug) {
			form.setFieldValue("slug", generateSlug(val));
		}
		if (!currentFilePath) {
			form.setFieldValue("file_path", generateSlug(val));
		}
	};

	// Direct upload handler using presigned URL
	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		const allowedMimes = [
			"application/pdf",
			"application/epub+zip",
			"application/x-epub+zip",
		];
		if (!allowedMimes.includes(file.type)) {
			toast.error(t("admin.uploader.errorInvalidType"));
			return;
		}

		// Max 150MB
		const maxSizeBytes = 150 * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			toast.error(t("admin.uploader.errorTooLarge"));
			return;
		}

		setUploadProgress(0);
		try {
			const currentCategoryId = form.getFieldValue("category_id");
			const requested = await requestLibraryUpload({
				filename: file.name,
				mimeType: file.type,
				sizeBytes: file.size,
				categoryId: currentCategoryId || undefined,
			});

			if (!requested.success) {
				toast.error(requested.error);
				setUploadProgress(null);
				return;
			}

			// Upload with XHR progress
			await new Promise<void>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open("PUT", requested.data.uploadUrl);
				xhr.setRequestHeader("Content-Type", file.type);
				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						setUploadProgress(Math.round((event.loaded / event.total) * 100));
					}
				};
				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) resolve();
					else reject(new Error(`Upload failed (${xhr.status})`));
				};
				xhr.onerror = () => reject(new Error("Upload failed"));
				xhr.send(file);
			});

			setUploadProgress(100);
			toast.success(t("admin.uploader.success"));

			// Auto fill form fields
			form.setFieldValue("uri", requested.data.publicUrl);
			form.setFieldValue("file_path", requested.data.storageKey);

			// Auto fill title and slug if empty
			const cleanName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
			if (!form.getFieldValue("title")) {
				form.setFieldValue("title", cleanName);
				form.setFieldValue("slug", generateSlug(cleanName));
			}
		} catch (err: any) {
			toast.error(err.message || t("admin.uploader.errorUpload"));
		} finally {
			setUploadProgress(null);
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
				className="space-y-6"
			>
				{/* File Uploader Container */}
				<div className="border border-dashed rounded-lg p-4 bg-muted/20 flex flex-col items-center justify-center gap-2">
					<div className="flex items-center gap-2">
						<Upload className="size-5 text-muted-foreground animate-pulse" />
						<span className="text-sm font-semibold">
							{t("admin.uploader.title")}
						</span>
					</div>
					<p className="text-xs text-muted-foreground text-center">
						{t("admin.uploader.description")}
					</p>
					<input
						type="file"
						accept="application/pdf,application/epub+zip,application/x-epub+zip"
						onChange={handleFileSelect}
						className="hidden"
						id="library-file-upload"
						disabled={uploadProgress !== null}
					/>
					<div className="flex items-center gap-2 mt-1">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								document.getElementById("library-file-upload")?.click()
							}
							disabled={uploadProgress !== null}
							className="cursor-pointer font-medium"
						>
							{uploadProgress !== null ? (
								<>
									<LoaderIcon className="size-4 animate-spin mr-1.5" />
									{t("admin.uploader.uploading", { progress: uploadProgress })}
								</>
							) : (
								t("admin.uploader.selectFile")
							)}
						</Button>
					</div>
					{uploadProgress !== null && (
						<div className="w-full max-w-xs bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
							<div
								className="bg-[#1461B8] h-1.5 transition-all duration-300"
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* ── Title ── */}
					<form.AppField
						name="title"
						validators={{
							onBlur: z.string().min(1, t("admin.validation.titleRequired")),
						}}
					>
						{(field) => (
							<field.TextField
								label={t("admin.fields.title")}
								placeholder="e.g. Physics Grade 12 Solved Textbook"
								value={field.state.value}
								onChange={(e) =>
									handleTitleChange(e.target.value, field.handleChange)
								}
							/>
						)}
					</form.AppField>

					{/* ── Slug ── */}
					<form.AppField name="slug">
						{(field) => (
							<field.TextField
								label={t("admin.fields.slug")}
								placeholder="e.g. physics-12-solved"
							/>
						)}
					</form.AppField>

					{/* ── URI ── */}
					<form.AppField
						name="uri"
						validators={{
							onBlur: z
								.string()
								.min(1, t("admin.validation.uriRequired"))
								.url(t("admin.validation.uriInvalid")),
						}}
					>
						{(field) => (
							<field.TextField
								label={t("admin.fields.uri")}
								placeholder="https://example.com/books/physics.pdf"
							/>
						)}
					</form.AppField>

					{/* ── File Path ── */}
					<form.AppField
						name="file_path"
						validators={{
							onBlur: z.string().min(1, t("admin.validation.filePathRequired")),
						}}
					>
						{(field) => (
							<field.TextField
								label={t("admin.fields.filePath")}
								placeholder="physics-12-file"
							/>
						)}
					</form.AppField>

					{/* ── Category ── */}
					<form.AppField name="category_id">
						{(field) => (
							<field.ComboboxField
								label={t("admin.fields.category")}
								placeholder={t("allCategories")}
								options={categoriesQuery.data ?? []}
								emptyText="No categories found"
								showClear
							/>
						)}
					</form.AppField>

					{/* ── Grade ── */}
					<form.AppField name="grade_id">
						{(field) => (
							<field.ComboboxField
								label={t("admin.fields.grade")}
								placeholder={t("allGrades")}
								options={gradesQuery.data ?? []}
								emptyText="No grades found"
								showClear
							/>
						)}
					</form.AppField>

					{/* ── Subject ── */}
					<form.AppField name="subject_id">
						{(field) => (
							<field.ComboboxField
								label={t("admin.fields.subject")}
								placeholder={t("allSubjects")}
								options={subjectsQuery.data ?? []}
								emptyText="No subjects found"
								showClear
							/>
						)}
					</form.AppField>

					{/* ── Linked Book ── */}
					<form.AppField name="book_id">
						{(field) => (
							<field.ComboboxField
								label={t("admin.fields.book")}
								placeholder={t("allBooks")}
								options={booksQuery.data ?? []}
								emptyText="No books found"
								showClear
							/>
						)}
					</form.AppField>
				</div>

				{/* ── Description ── */}
				<form.AppField name="desc">
					{(field) => (
						<field.TextareaField
							label={t("admin.fields.desc")}
							placeholder="Enter book description..."
							rows={3}
						/>
					)}
				</form.AppField>

				<Separator />
				<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
					Related Resources
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<form.AppField name="related_courses_ids">
						{(field) => (
							<RelatedResourcesSelector
								resourceType="courses"
								selectedIds={field.state.value || []}
								onChange={(ids) => field.handleChange(ids)}
								label="Related Courses"
								placeholder="Select related courses"
							/>
						)}
					</form.AppField>

					<form.AppField name="related_decks_ids">
						{(field) => (
							<RelatedResourcesSelector
								resourceType="decks"
								selectedIds={field.state.value || []}
								onChange={(ids) => field.handleChange(ids)}
								label="Related Decks"
								placeholder="Select related decks"
							/>
						)}
					</form.AppField>
				</div>

				<Separator />
				<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
					{t("admin.seoSection")}
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* ── SEO Title ── */}
					<form.AppField name="seo_title">
						{(field) => (
							<field.TextField
								label={t("admin.fields.seoTitle")}
								placeholder="e.g. Physics Grade 12 Solved Textbook | Abzar Kankor"
							/>
						)}
					</form.AppField>

					{/* ── SEO Description ── */}
					<form.AppField name="seo_description">
						{(field) => (
							<field.TextareaField
								label={t("admin.fields.seoDescription")}
								placeholder="Enter search engine snippet description..."
								rows={2}
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
