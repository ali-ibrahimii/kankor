"use client";

import { useQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { RelatedResourcesSelector } from "@/components/blocks/RelatedResourcesSelector";
import { ImageUploadField } from "@/components/blocks/shared/image-upload-field";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { useRouter } from "@/i18n/navigation";
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
import { IMAGE_ACCEPT, IMAGE_LIMITS } from "@/lib/r2/public-images";
import {
	formatImageLimit,
	uploadImageFile,
	validateImageFile,
} from "@/lib/r2/upload-client";
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
	/** Admin panel: publish as the platform ("Abzar Kankor"), not as the admin. */
	platformAuthored?: boolean;
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
	learning_objectives: "",
	prerequisites: "",
	estimated_duration_hours: "",
	promo_video_url: "",
	welcome_message: "",
	seo_title: "",
	seo_description: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NewCourseDialog({
	open,
	onOpenChange,
	basePath,
	courseId,
	onUpdated,
	agencyId,
	platformAuthored,
}: NewCourseDialogProps) {
	const t = useTranslations("courseBuilder");
	const locale = useLocale();
	const router = useRouter();
	const isEditMode = !!courseId;
	const [isPending, setIsPending] = React.useState(false);
	const [isLoadingDetails, setIsLoadingDetails] = React.useState(isEditMode);
	/** Create mode: the cover is uploaded right after the course row exists. */
	const [pendingCover, setPendingCover] = React.useState<File | null>(null);
	const [pendingCoverPreview, setPendingCoverPreview] = React.useState<
		string | null
	>(null);
	const [isUploadingCover, setIsUploadingCover] = React.useState(false);

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

	React.useEffect(() => {
		if (!pendingCover) {
			setPendingCoverPreview(null);
			return;
		}
		const url = URL.createObjectURL(pendingCover);
		setPendingCoverPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [pendingCover]);

	function handlePendingCover(files: File[]) {
		const file = files[0];
		if (!file) return;
		const invalid = validateImageFile(file);
		if (invalid) {
			toast.error(
				invalid === "invalidType"
					? t("newCourse.coverInvalidType")
					: t("newCourse.coverTooLarge", { max: formatImageLimit() })
			);
			return;
		}
		setPendingCover(file);
	}

	/**
	 * Pushes the cover chosen before the course existed into Cloudflare R2.
	 * The course is already created at this point, so a failure here must not
	 * lose the course: it is reported and the builder still opens.
	 */
	async function uploadPendingCover(courseId: string) {
		if (!pendingCover) return;
		setIsUploadingCover(true);
		try {
			await uploadImageFile({
				scope: "course",
				ownerId: courseId,
				file: pendingCover,
				target: "cover",
			});
			setPendingCover(null);
			toast.success(t("newCourse.coverUploaded"));
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : t("newCourse.coverFailed")
			);
		} finally {
			setIsUploadingCover(false);
		}
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

			const result = await createCourse(values, agencyId, {
				platformAuthored,
			});
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			await uploadPendingCover(result.data.courseId);
			onOpenChange(false);
			router.push(`${basePath}/courses/new/${result.data.courseId}`);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
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
							{/* Cover chosen before the course exists — uploaded to R2 right
							    after creation (see uploadPendingCover). */}
							{!isEditMode ? (
								<div className="space-y-1.5">
									<Label>{t("newCourse.coverLabel")}</Label>
									<Dropzone
										accept={IMAGE_ACCEPT}
										disabled={isPending || isUploadingCover}
										onFilesSelected={handlePendingCover}
										className="relative aspect-video overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 hover:border-primary/50"
									>
										{pendingCoverPreview ? (
											// biome-ignore lint/performance/noImgElement: local blob preview
											<img
												src={pendingCoverPreview}
												alt={t("newCourse.coverLabel")}
												className="size-full object-cover"
											/>
										) : (
											<div className="flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center">
												<p className="text-[11px] font-bold text-muted-foreground">
													{t("newCourse.coverHint")}
												</p>
												<p className="text-[10px] text-muted-foreground/70">
													{t("newCourse.coverFormats", {
														max: Math.round(
															IMAGE_LIMITS.maxSizeBytes / 1024 / 1024
														),
													})}
												</p>
											</div>
										)}
									</Dropzone>
									{pendingCover ? (
										<p className="text-[10px] text-muted-foreground">
											{pendingCover.name}
										</p>
									) : null}
								</div>
							) : null}

							{/* Cover (stored in Cloudflare R2) */}
							{isEditMode && courseId ? (
								<div className="space-y-1.5">
									<Label>{t("editCourse.coverLabel")}</Label>
									<ImageUploadField
										scope="course"
										ownerId={courseId}
										target="cover"
										value={values.cover_image_url}
										onUploaded={({ url }) => {
											patch("cover_image_url", url);
											router.refresh();
										}}
										onRemoved={() => {
											patch("cover_image_url", null);
											router.refresh();
										}}
									/>
								</div>
							) : null}

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

							{/* ── The rest of the course record ─────────────────────────── */}
							<div className="mt-4 space-y-4 border-t pt-4">
								<div>
									<p className="text-sm font-bold">
										{t("newCourse.moreDetails")}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{t("newCourse.moreDetailsHint")}
									</p>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label htmlFor="cb-duration">
											{t("newCourse.durationHours")}
										</Label>
										<Input
											id="cb-duration"
											type="number"
											min="0"
											step="0.5"
											value={values.estimated_duration_hours}
											onChange={(e) =>
												patch("estimated_duration_hours", e.target.value)
											}
											placeholder="8"
										/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="cb-promo">
											{t("newCourse.promoVideo")}
										</Label>
										<Input
											id="cb-promo"
											type="url"
											dir="ltr"
											value={values.promo_video_url}
											onChange={(e) => patch("promo_video_url", e.target.value)}
											placeholder="https://youtube.com/watch?v=…"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="cb-objectives">
										{t("newCourse.objectives")}
									</Label>
									<Textarea
										id="cb-objectives"
										value={values.learning_objectives}
										onChange={(e) =>
											patch("learning_objectives", e.target.value)
										}
										placeholder={t("newCourse.objectivesPlaceholder")}
										rows={3}
									/>
									<p className="text-[11px] text-muted-foreground">
										{t("newCourse.onePerLine")}
									</p>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="cb-prereqs">
										{t("newCourse.prerequisites")}
									</Label>
									<Textarea
										id="cb-prereqs"
										value={values.prerequisites}
										onChange={(e) => patch("prerequisites", e.target.value)}
										placeholder={t("newCourse.prerequisitesPlaceholder")}
										rows={3}
									/>
									<p className="text-[11px] text-muted-foreground">
										{t("newCourse.onePerLine")}
									</p>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="cb-welcome">
										{t("newCourse.welcomeMessage")}
									</Label>
									<Textarea
										id="cb-welcome"
										value={values.welcome_message}
										onChange={(e) => patch("welcome_message", e.target.value)}
										placeholder={t("newCourse.welcomePlaceholder")}
										rows={2}
									/>
								</div>

								<div className="space-y-3 rounded-xl border border-dashed p-3">
									<p className="text-xs font-bold text-muted-foreground">
										{t("newCourse.seoSection")}
									</p>
									<div className="space-y-1.5">
										<Label htmlFor="cb-seo-title">
											{t("newCourse.seoTitle")}
										</Label>
										<Input
											id="cb-seo-title"
											value={values.seo_title}
											onChange={(e) => patch("seo_title", e.target.value)}
											maxLength={60}
										/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="cb-seo-description">
											{t("newCourse.seoDescription")}
										</Label>
										<Textarea
											id="cb-seo-description"
											value={values.seo_description}
											onChange={(e) => patch("seo_description", e.target.value)}
											rows={2}
											maxLength={160}
										/>
									</div>
								</div>
							</div>

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
