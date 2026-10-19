"use client";

import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { RelatedResourcesSelector } from "@/components/blocks/RelatedResourcesSelector";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/hooks/use-form";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { createDeck } from "./actions";
import type { NewDeckFormValues } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NewDeckDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Route prefix, e.g. "/d/instructor" */
	basePath: string;
	/** When set, new decks are created as agency-owned (see createDeck). */
	agencyId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewDeckDialog({
	open,
	onOpenChange,
	basePath,
	agencyId,
}: NewDeckDialogProps) {
	const t = useTranslations("flashcardBuilder");
	const router = useRouter();
	const [advancedOpen, setAdvancedOpen] = React.useState(false);

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

	const form = useAppForm({
		defaultValues: {
			name: "",
			description: "",
			visibility: "private",
			algorithm: "fsrs",
			is_free: true,
			price_credits: "",
			fsrs_maximum_interval: "36500",
			fsrs_request_retention: "0.9",
			sm2_easy_bonus: "1.3",
			sm2_interval_modifier: "1.0",
			sm2_starting_ease: "2.5",
			related_courses_ids: [] as string[],
			related_libraries_ids: [] as string[],
			book_id: null as string | null,
			subject_id: null as string | null,
			grade_id: null as string | null,
		} satisfies NewDeckFormValues,
		onSubmit: async ({ value }) => {
			const result = await createDeck(value, agencyId);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			onOpenChange(false);
			// Admin's deck-edit route wasn't migrated to slug-based URLs — every
			// other role's [slug] folder expects the real slug.
			const routeParam = basePath.startsWith("/d/admin")
				? result.data.deckId
				: result.data.slug;
			router.push(`${basePath}/decks/${routeParam}/edit`);
		},
	});

	// Subscribe to algorithm to conditionally render advanced fields
	const algorithm = useStore(form.baseStore, (s) => s.values.algorithm);
	// Subscribe to is_free to conditionally render the price field
	const isFree = useStore(form.baseStore, (s) => s.values.is_free);

	// Reset advanced panel when dialog closes
	React.useEffect(() => {
		if (!open) setAdvancedOpen(false);
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[92vh] flex-col sm:max-w-lg p-0">
				<DialogHeader className="px-6 pt-6 pb-2 shrink-0">
					<DialogTitle>{t("newDeck.title")}</DialogTitle>
					<DialogDescription>{t("newDeck.description")}</DialogDescription>
				</DialogHeader>

				<form.AppForm>
					<form
						className="flex min-h-0 flex-1 flex-col"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<ScrollArea className="flex-1">
							<div className="space-y-4 px-6 pb-4 pt-2">
								{/* ── Name ── */}
								<form.AppField
									name="name"
									validators={{
										onBlur: z
											.string()
											.min(1, t("validation.nameRequired"))
											.max(200),
									}}
								>
									{(field) => (
										<field.TextField
											label={t("newDeck.nameLabel")}
											placeholder={t("newDeck.namePlaceholder")}
											autoFocus
											maxLength={200}
										/>
									)}
								</form.AppField>

								{/* ── Description ── */}
								<form.AppField name="description">
									{(field) => (
										<field.TextareaField
											label={t("newDeck.descriptionLabel")}
											placeholder={t("newDeck.descriptionPlaceholder")}
											rows={2}
										/>
									)}
								</form.AppField>

								{/* ── Related Resources ── */}
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

								<form.AppField name="related_libraries_ids">
									{(field) => (
										<RelatedResourcesSelector
											resourceType="libraries"
											selectedIds={field.state.value || []}
											onChange={(ids) => field.handleChange(ids)}
											label="Related Books"
											placeholder="Select related books"
										/>
									)}
								</form.AppField>

								{/* ── Book, Subject, Grade ── */}
								<div className="grid grid-cols-3 gap-3">
									<form.AppField name="book_id">
										{(field) => (
											<field.SelectField
												label="Book"
												options={[
													{ value: "", label: "Select book" },
													...(booksQuery.data ?? []),
												]}
											/>
										)}
									</form.AppField>

									<form.AppField name="subject_id">
										{(field) => (
											<field.SelectField
												label="Subject"
												options={[
													{ value: "", label: "Select subject" },
													...(subjectsQuery.data ?? []),
												]}
											/>
										)}
									</form.AppField>

									<form.AppField name="grade_id">
										{(field) => (
											<field.SelectField
												label="Grade"
												options={[
													{ value: "", label: "Select grade" },
													...(gradesQuery.data ?? []),
												]}
											/>
										)}
									</form.AppField>
								</div>

								{/* ── Visibility + Algorithm ── */}
								<div className="grid grid-cols-2 gap-3">
									<form.AppField name="visibility">
										{(field) => (
											<field.SelectField
												label={t("newDeck.visibilityLabel")}
												options={[
													{ value: "private", label: t("visibility.private") },
													{ value: "public", label: t("visibility.public") },
													{
														value: "classmate",
														label: t("visibility.classmate"),
													},
												]}
											/>
										)}
									</form.AppField>

									<form.AppField name="algorithm">
										{(field) => (
											<field.SelectField
												label={t("newDeck.algorithmLabel")}
												options={[
													{ value: "fsrs", label: t("algorithm.fsrs") },
													{ value: "sm2", label: t("algorithm.sm2") },
													{ value: "leitner", label: t("algorithm.leitner") },
												]}
											/>
										)}
									</form.AppField>
								</div>

								{/* ── Free Access ── */}
								<form.AppField name="is_free">
									{(field) => (
										<field.SwitchField
											label={t("newDeck.isFreeLabel")}
											description={t("newDeck.isFreeDescription")}
										/>
									)}
								</form.AppField>

								{/* ── Price in credits — shown when not free ── */}
								{!isFree && (
									<form.AppField
										name="price_credits"
										validators={{
											onBlur: z.string().refine((v) => !v || Number(v) >= 0, {
												message: "Must be ≥ 0.",
											}),
										}}
									>
										{(field) => (
											<field.TextField
												label={t("newDeck.priceCreditsLabel")}
												type="number"
												min="0"
												step="1"
												placeholder="0"
											/>
										)}
									</form.AppField>
								)}

								<Separator />

								{/* ── Advanced Settings ── */}
								<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
									<CollapsibleTrigger asChild>
										<button
											type="button"
											className="flex w-full items-center justify-between rounded-md px-1 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										>
											{t("advancedSettings.title")}
											<ChevronDownIcon
												className={cn(
													"size-4 transition-transform duration-200",
													advancedOpen && "rotate-180"
												)}
											/>
										</button>
									</CollapsibleTrigger>

									<CollapsibleContent className="space-y-4 pt-3 data-[state=closed]:animate-none">
										{algorithm === "fsrs" && (
											<>
												<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
													{t("advancedSettings.fsrsSection")}
												</p>

												<form.AppField
													name="fsrs_maximum_interval"
													validators={{
														onBlur: z
															.string()
															.refine(
																(v) =>
																	!v ||
																	(Number(v) >= 1 &&
																		Number.isInteger(Number(v))),
																{ message: "Must be a whole number ≥ 1." }
															),
													}}
												>
													{(field) => (
														<field.TextField
															label={t("advancedSettings.fsrsMaxIntervalLabel")}
															description={t(
																"advancedSettings.fsrsMaxIntervalDescription"
															)}
															type="number"
															min="1"
															step="1"
															placeholder="36500"
														/>
													)}
												</form.AppField>

												<form.AppField
													name="fsrs_request_retention"
													validators={{
														onBlur: z
															.string()
															.refine(
																(v) =>
																	!v || (Number(v) >= 0.7 && Number(v) <= 0.99),
																{ message: "Must be between 0.70 and 0.99." }
															),
													}}
												>
													{(field) => (
														<field.TextField
															label={t("advancedSettings.fsrsRetentionLabel")}
															description={t(
																"advancedSettings.fsrsRetentionDescription"
															)}
															type="number"
															min="0.70"
															max="0.99"
															step="0.01"
															placeholder="0.9"
														/>
													)}
												</form.AppField>
											</>
										)}

										{algorithm === "sm2" && (
											<>
												<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
													{t("advancedSettings.sm2Section")}
												</p>

												<form.AppField
													name="sm2_easy_bonus"
													validators={{
														onBlur: z
															.string()
															.refine((v) => !v || Number(v) >= 1.0, {
																message: "Must be ≥ 1.0.",
															}),
													}}
												>
													{(field) => (
														<field.TextField
															label={t("advancedSettings.sm2EasyBonusLabel")}
															description={t(
																"advancedSettings.sm2EasyBonusDescription"
															)}
															type="number"
															min="1.0"
															step="0.1"
															placeholder="1.3"
														/>
													)}
												</form.AppField>

												<form.AppField
													name="sm2_interval_modifier"
													validators={{
														onBlur: z
															.string()
															.refine((v) => !v || Number(v) > 0, {
																message: "Must be greater than 0.",
															}),
													}}
												>
													{(field) => (
														<field.TextField
															label={t(
																"advancedSettings.sm2IntervalModifierLabel"
															)}
															description={t(
																"advancedSettings.sm2IntervalModifierDescription"
															)}
															type="number"
															min="0.01"
															step="0.1"
															placeholder="1.0"
														/>
													)}
												</form.AppField>

												<form.AppField
													name="sm2_starting_ease"
													validators={{
														onBlur: z
															.string()
															.refine((v) => !v || Number(v) >= 1.3, {
																message: "Must be ≥ 1.3.",
															}),
													}}
												>
													{(field) => (
														<field.TextField
															label={t("advancedSettings.sm2StartingEaseLabel")}
															description={t(
																"advancedSettings.sm2StartingEaseDescription"
															)}
															type="number"
															min="1.3"
															step="0.1"
															placeholder="2.5"
														/>
													)}
												</form.AppField>
											</>
										)}

										{algorithm === "leitner" && (
											<p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
												{t("advancedSettings.leitnerNote")}
											</p>
										)}
									</CollapsibleContent>
								</Collapsible>
							</div>
						</ScrollArea>

						<DialogFooter className="shrink-0 border-t px-6 py-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{t("common.cancel")}
							</Button>
							<form.SubmitButton>{t("newDeck.create")}</form.SubmitButton>
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}
