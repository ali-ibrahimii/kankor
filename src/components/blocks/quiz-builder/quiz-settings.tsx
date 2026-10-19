"use client";

import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { CopyIcon, InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RelatedResourcesSelector } from "@/components/blocks/RelatedResourcesSelector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { withForm } from "@/hooks/use-form";
import { createClient } from "@/lib/supabase/client";
import { entranceCodeAtom } from "./store";
import type { QuizSettingsValues } from "./types";

export const QuizSettings = withForm({
	defaultValues: {} as QuizSettingsValues,
	render({ form }) {
		const t = useTranslations("quizBuilder");
		const entranceCode = useAtomValue(entranceCodeAtom);
		const isFree = useStore(form.baseStore, (s) => s.values.is_free);

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

		function copyCode() {
			if (!entranceCode) return;
			navigator.clipboard.writeText(entranceCode);
			toast.success(t("toast.codeCopied"));
		}

		return (
			<div className="space-y-4">
				{/* Basic Information */}
				<Card>
					<CardHeader className="border-b">
						<CardTitle>{t("settings.basicInfo")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 pt-4">
						<form.AppField
							name="title"
							validators={{
								onChange: ({ value }) =>
									!value.trim() ? t("validation.titleRequired") : undefined,
							}}
						>
							{(field) => (
								<field.TextField
									label={`${t("settings.titleLabel")} *`}
									placeholder={t("settings.titlePlaceholder")}
								/>
							)}
						</form.AppField>

						<form.AppField name="description">
							{(field) => (
								<field.TextareaField
									label={t("settings.description")}
									placeholder={t("settings.descriptionPlaceholder")}
									rows={3}
								/>
							)}
						</form.AppField>

						<form.AppField name="instructions">
							{(field) => (
								<field.TextareaField
									label={t("settings.instructions")}
									placeholder={t("settings.instructionsPlaceholder")}
									rows={3}
								/>
							)}
						</form.AppField>

						{entranceCode && (
							<div className="space-y-1.5">
								<Label>{t("settings.entranceCode")}</Label>
								<div className="flex items-center gap-2">
									<Badge
										variant="secondary"
										className="h-8 gap-2 px-3 font-mono text-base tracking-widest"
									>
										{entranceCode}
									</Badge>
									<button
										type="button"
										onClick={copyCode}
										className="text-muted-foreground hover:text-foreground transition-colors"
										title={t("actions.copyCode")}
									>
										<CopyIcon className="size-4" />
									</button>
								</div>
								<p className="flex items-center gap-1 text-xs text-muted-foreground">
									<InfoIcon className="size-3 shrink-0" />
									{t("settings.entranceCodeHint")}
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Related Resources */}
				<Card>
					<CardHeader className="border-b">
						<CardTitle>Related Resources</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 pt-4">
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

						{/* ── Book, Subject, Grade ── */}
						<div className="grid grid-cols-3 gap-3 pt-2">
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
					</CardContent>
				</Card>

				{/* Timing & Attempts */}
				<Card>
					<CardHeader className="border-b">
						<CardTitle>{t("settings.timingAndAttempts")}</CardTitle>
					</CardHeader>
					<CardContent className="pt-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<form.AppField name="time_limit_minutes">
								{(field) => (
									<field.TextField
										label={t("settings.timeLimit")}
										type="number"
										min={1}
										placeholder={t("settings.timeLimitPlaceholder")}
									/>
								)}
							</form.AppField>

							<form.AppField name="max_attempts">
								{(field) => (
									<field.TextField
										label={t("settings.maxAttempts")}
										type="number"
										min={1}
										placeholder={t("settings.maxAttemptsPlaceholder")}
									/>
								)}
							</form.AppField>

							<form.AppField name="passing_score_percentage">
								{(field) => (
									<field.TextField
										label={t("settings.passingScore")}
										type="number"
										min={0}
										max={100}
										placeholder="70"
									/>
								)}
							</form.AppField>
						</div>
					</CardContent>
				</Card>

				{/* Behavior */}
				<Card>
					<CardHeader className="border-b">
						<CardTitle>{t("settings.behavior")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-0 pt-4">
						<form.AppField name="shuffle_questions">
							{(field) => (
								<field.SwitchField
									label={t("settings.shuffleQuestions")}
									description={t("settings.shuffleQuestionsDesc")}
								/>
							)}
						</form.AppField>

						<Separator className="my-3" />

						<form.AppField name="show_correct_answers_after">
							{(field) => (
								<field.SelectField
									label={t("settings.showAnswers")}
									description={t("settings.showAnswersHint")}
									options={[
										{
											value: "attempt",
											label: t("settings.showAnswersAfterAttempt"),
										},
										{
											value: "quiz_end_time",
											label: t("settings.showAnswersAfterClose"),
										},
										{
											value: "never",
											label: t("settings.showAnswersNever"),
										},
									]}
								/>
							)}
						</form.AppField>
					</CardContent>
				</Card>

				{/* Pricing */}
				<Card>
					<CardHeader className="border-b">
						<CardTitle>{t("settings.pricing")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 pt-4">
						<form.AppField name="is_free">
							{(field) => (
								<field.SwitchField
									label={t("settings.isFreeLabel")}
									description={t("settings.isFreeDescription")}
								/>
							)}
						</form.AppField>

						{!isFree && (
							<form.AppField name="price_credits">
								{(field) => (
									<field.TextField
										label={t("settings.priceCreditsLabel")}
										type="number"
										min={0}
										step={1}
										placeholder="0"
									/>
								)}
							</form.AppField>
						)}
					</CardContent>
				</Card>
			</div>
		);
	},
});
