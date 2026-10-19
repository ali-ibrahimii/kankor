"use client";

import { useQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { RelatedResourcesSelector } from "@/components/blocks/RelatedResourcesSelector";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface FormOption {
	value: string;
	label: string;
}

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { normalizedLocale } from "@/i18n";
import { createCourse, getCourseForEdit, updateCourse } from "./actions";
import type { NewCourseFormValues } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NewCourseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Route prefix for the builder page, e.g. "/d/instructor" */
	basePath: string;
	/** When set, the dialog edits this course's details instead of creating a new one. */
	courseId?: string;
	/** Called after a successful edit save, with the updated title. */
	onUpdated?: (values: { title: string }) => void;
	/** When set, new courses are created as agency-owned (see createCourse). */
	agencyId?: string;
}

const DEFAULT_VALUES: Omit<NewCourseFormValues, "language"> = {
	title: "",
	subtitle: "",
	description: "",
	level: "all_levels",
	is_free: true,
	price_credits: "",
	visibility: "private",
	related_decks_ids: [],
	related_quizzes_ids: [],
	related_libraries_ids: [],
	book_id: null,
	subject_id: null,
	grade_id: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NewCourseDialog({
	open,
	onOpenChange,
	basePath,
	courseId,
	onUpdated,
	agencyId,
}: NewCourseDialogProps) {
	const t = useTranslations("courseBuilder");
	const locale = useLocale();
	const router = useRouter();
	const isEditMode = !!courseId;
	const [isPending, setIsPending] = React.useState(false);
	const [isLoadingDetails, setIsLoadingDetails] = React.useState(isEditMode);

	const client = createClient();

	const booksQuery = useQuery({
		queryKey: ["books-options"],
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

	const subjectsQuery = useQuery({
		queryKey: ["subjects-options"],
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

	const gradesQuery = useQuery({
		queryKey: ["grades-options"],
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

	const books = booksQuery.data ?? [];
	const subjects = subjectsQuery.data ?? [];
	const grades = gradesQuery.data ?? [];

	const [values, setValues] = React.useState<NewCourseFormValues>({
		...DEFAULT_VALUES,
		language: normalizedLocale(locale),
	});

	function patch<K extends keyof NewCourseFormValues>(
		key: K,
		value: NewCourseFormValues[K]
	) {
		setValues((prev) => ({ ...prev, [key]: value }));
	}

	// Load fresh details every time the edit dialog opens.
	React.useEffect(() => {
		if (!open || !courseId) return;
		let cancelled = false;
		setIsLoadingDetails(true);
		getCourseForEdit(courseId).then((result) => {
			if (cancelled) return;
			if (result.success) {
				setValues(result.data);
			} else {
				toast.error(result.error);
			}
			setIsLoadingDetails(false);
		});
		return () => {
			cancelled = true;
		};
	}, [open, courseId]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!values.title.trim()) {
			toast.error(t("validation.titleRequired"));
			return;
		}
		setIsPending(true);
		try {
			if (isEditMode && courseId) {
				const result = await updateCourse(courseId, values);
				if (!result.success) {
					toast.error(result.error);
					return;
				}
				toast.success(t("editCourse.saved"));
				onUpdated?.({ title: values.title });
				onOpenChange(false);
				return;
			}

			const result = await createCourse(values, agencyId);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			onOpenChange(false);
			router.push(`${basePath}/courses/new/${result.data.courseId}`);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{isEditMode ? t("editCourse.title") : t("newCourse.title")}
						</DialogTitle>
						<DialogDescription>
							{isEditMode
								? t("editCourse.description")
								: t("newCourse.description")}
						</DialogDescription>
					</DialogHeader>

					{isLoadingDetails ? (
						<div className="flex items-center justify-center py-16">
							<Spinner className="size-6" />
						</div>
					) : (
						<div className="mt-4 space-y-4">
							{/* Title */}
							<div className="space-y-1.5">
								<Label htmlFor="cb-title">
									{t("newCourse.courseTitle")}
									<span className="ms-1 text-destructive">*</span>
								</Label>
								<Input
									id="cb-title"
									value={values.title}
									onChange={(e) => patch("title", e.target.value)}
									placeholder={t("newCourse.courseTitlePlaceholder")}
									autoFocus
									maxLength={200}
								/>
							</div>

							{/* Subtitle */}
							<div className="space-y-1.5">
								<Label htmlFor="cb-subtitle">{t("newCourse.subtitle")}</Label>
								<Input
									id="cb-subtitle"
									value={values.subtitle}
									onChange={(e) => patch("subtitle", e.target.value)}
									placeholder={t("newCourse.subtitlePlaceholder")}
									maxLength={300}
								/>
							</div>

							{/* Description */}
							<div className="space-y-1.5">
								<Label htmlFor="cb-description">
									{t("newCourse.courseDescription")}
								</Label>
								<Textarea
									id="cb-description"
									value={values.description}
									onChange={(e) => patch("description", e.target.value)}
									placeholder={t("newCourse.descriptionPlaceholder")}
									rows={3}
								/>
							</div>

							{/* Language + Level row */}
							<div className="grid grid-cols-3 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="cb-language">{t("newCourse.language")}</Label>
									<Select
										value={values.language}
										onValueChange={(v) => patch("language", v)}
									>
										<SelectTrigger id="cb-language">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="fa">دری</SelectItem>
											<SelectItem value="ps">پښتو</SelectItem>
											<SelectItem value="en">English</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="cb-level">{t("newCourse.level")}</Label>
									<Select
										value={values.level}
										onValueChange={(v) => patch("level", v)}
									>
										<SelectTrigger id="cb-level">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all_levels">
												{t("level.all_levels")}
											</SelectItem>
											<SelectItem value="beginner">
												{t("level.beginner")}
											</SelectItem>
											<SelectItem value="intermediate">
												{t("level.intermediate")}
											</SelectItem>
											<SelectItem value="advanced">
												{t("level.advanced")}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<div className="flex gap-2 items-center">
										<Label htmlFor="cb-visibility">
											{t("newCourse.visibility")}
										</Label>
										<Popover>
											<PopoverTrigger>
												<InfoIcon />
											</PopoverTrigger>
											<PopoverContent>
												<p className="text-sm">
													{t("newCourse.visibilityDescription")}
												</p>
											</PopoverContent>
										</Popover>
									</div>
									<Switch
										checked={values.visibility === "public"}
										onCheckedChange={(v) =>
											patch("visibility", v ? "public" : "private")
										}
									/>
								</div>
							</div>

							{/* Book, Subject, and Grade Row */}
							<div className="grid grid-cols-3 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="cb-book">Book</Label>
									<Select
										value={values.book_id || "none"}
										onValueChange={(v) =>
											patch("book_id", v === "none" ? null : v)
										}
									>
										<SelectTrigger id="cb-book" className="w-full">
											<SelectValue placeholder="Select book" />
										</SelectTrigger>
										<SelectContent className="max-h-[300px]">
											<SelectItem value="none">None</SelectItem>
											{books.map((b) => (
												<SelectItem key={b.value} value={b.value}>
													{b.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="cb-subject">Subject</Label>
									<Select
										value={values.subject_id || "none"}
										onValueChange={(v) =>
											patch("subject_id", v === "none" ? null : v)
										}
									>
										<SelectTrigger id="cb-subject" className="w-full">
											<SelectValue placeholder="Select subject" />
										</SelectTrigger>
										<SelectContent className="max-h-[300px]">
											<SelectItem value="none">None</SelectItem>
											{subjects.map((s) => (
												<SelectItem key={s.value} value={s.value}>
													{s.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="cb-grade">Grade</Label>
									<Select
										value={values.grade_id || "none"}
										onValueChange={(v) =>
											patch("grade_id", v === "none" ? null : v)
										}
									>
										<SelectTrigger id="cb-grade" className="w-full">
											<SelectValue placeholder="Select grade" />
										</SelectTrigger>
										<SelectContent className="max-h-[300px]">
											<SelectItem value="none">None</SelectItem>
											{grades.map((g) => (
												<SelectItem key={g.value} value={g.value}>
													{g.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Free / Paid */}
							<div className="flex items-center justify-between rounded-lg border p-3">
								<div>
									<p className="text-sm font-medium">{t("newCourse.isFree")}</p>
									<p className="text-xs text-muted-foreground">
										{t("newCourse.isFreeDescription")}
									</p>
								</div>
								<Switch
									checked={values.is_free}
									onCheckedChange={(v) => patch("is_free", v)}
								/>
							</div>

							{/* Price in credits — shown when not free */}
							{!values.is_free && (
								<div className="space-y-1.5">
									<Label htmlFor="cb-price">
										{t("newCourse.priceCredits")}
									</Label>
									<Input
										id="cb-price"
										type="number"
										min="0"
										step="1"
										value={values.price_credits}
										onChange={(e) => patch("price_credits", e.target.value)}
										placeholder="0"
									/>
								</div>
							)}

							<div className="border-t pt-4 mt-4 space-y-4">
								<RelatedResourcesSelector
									resourceType="decks"
									selectedIds={values.related_decks_ids || []}
									onChange={(ids) => patch("related_decks_ids", ids)}
									label="Related Decks"
									placeholder="Select related decks"
								/>
								<RelatedResourcesSelector
									resourceType="quizzes"
									selectedIds={values.related_quizzes_ids || []}
									onChange={(ids) => patch("related_quizzes_ids", ids)}
									label="Related Quizzes"
									placeholder="Select related quizzes"
								/>
								<RelatedResourcesSelector
									resourceType="libraries"
									selectedIds={values.related_libraries_ids || []}
									onChange={(ids) => patch("related_libraries_ids", ids)}
									label="Related Books"
									placeholder="Select related books"
								/>
							</div>
						</div>
					)}

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={isPending || isLoadingDetails || !values.title.trim()}
						>
							{isPending
								? isEditMode
									? t("editCourse.saving")
									: t("common.creating")
								: isEditMode
									? t("editCourse.save")
									: t("newCourse.create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
