"use client";

import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import {
	CopyIcon,
	GlobeIcon,
	InfoIcon,
	LockIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RelatedResourcesSelector } from "@/components/blocks/RelatedResourcesSelector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { withForm } from "@/hooks/use-form";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { listManageableCoursesForQuiz } from "./actions";
import { entranceCodeAtom, quizAgencyIdAtom, quizSchoolIdAtom } from "./store";
import type { QuizSettingsValues, QuizVisibility } from "./types";

const ANY_COURSE_VALUE = "__any_course__";

export const QuizSettings = withForm({
	defaultValues: {} as QuizSettingsValues,
	render({ form }) {
		const t = useTranslations("quizBuilder");
		const entranceCode = useAtomValue(entranceCodeAtom);
		const schoolId = useAtomValue(quizSchoolIdAtom);
		const agencyId = useAtomValue(quizAgencyIdAtom);
		const isFree = useStore(form.baseStore, (s) => s.values.is_free);
		const visibility = useStore(form.baseStore, (s) => s.values.visibility);
		const courseId = useStore(form.baseStore, (s) => s.values.course_id);
		const isCourseOnly = visibility === "private";

		const client = createClient();

		const coursesQuery = useQuery({
			queryKey: [
				"manageable-courses-for-quiz",
				schoolId ?? null,
				agencyId ?? null,
			],
			queryFn: () =>
				listManageableCoursesForQuiz({
					schoolId: schoolId ?? null,
					agencyId: agencyId ?? null,
				}),
			enabled: isCourseOnly,
			staleTime: 2 * 60 * 1000,
		});

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

				{/* Visibility & Course Access */}
				<Card>
					<CardHeader className="border-b">
						<CardTitle>{t("settings.visibilitySection")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 pt-4">
						<form.AppField name="visibility">
							{(field) => {
								const current: QuizVisibility = field.state.value || "public";
								const options: {
									value: QuizVisibility;
									title: string;
									description: string;
									icon: typeof GlobeIcon;
								}[] = [
									{
										value: "public",
										title: t("settings.visibilityPublic"),
										description: t("settings.visibilityPublicDesc"),
										icon: GlobeIcon,
									},
									{
										value: "private",
										title: t("settings.visibilityCourseOnly"),
										description: t("settings.visibilityCourseOnlyDesc"),
										icon: LockIcon,
									},
									...(current === "classmate"
										? [
												{
													value: "classmate" as QuizVisibility,
													title: t("settings.visibilityClassmate"),
													description: t("settings.visibilityClassmateDesc"),
													icon: UsersIcon,
												},
											]
										: []),
								];

								return (
									<div
										role="radiogroup"
										aria-label={t("settings.visibilitySection")}
										className="grid grid-cols-1 gap-3 sm:grid-cols-2"
									>
										{options.map((opt) => {
											const Icon = opt.icon;
											const selected = current === opt.value;
											return (
												<button
													key={opt.value}
													type="button"
													role="radio"
													aria-checked={selected}
													onClick={() => {
														field.handleChange(opt.value);
														if (opt.value !== "private") {
															form.setFieldValue("course_id", null);
														}
													}}
													className={cn(
														"flex items-start gap-3 rounded-lg border p-3.5 text-start transition-colors",
														selected
															? "border-primary bg-primary/5 ring-1 ring-primary/30"
															: "border-border hover:bg-muted/50"
													)}
												>
													<div
														className={cn(
															"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
															selected
																? "bg-primary text-primary-foreground"
																: "bg-muted text-muted-foreground"
														)}
													>
														<Icon className="size-4" />
													</div>
													<div className="min-w-0 space-y-1">
														<p className="text-sm font-medium leading-tight">
															{opt.title}
														</p>
														<p className="text-xs leading-relaxed text-muted-foreground">
															{opt.description}
														</p>
													</div>
												</button>
											);
										})}
									</div>
								);
							}}
						</form.AppField>

						{isCourseOnly && (
							<form.AppField name="course_id">
								{(field) => {
									const courseOptions = coursesQuery.data ?? [];
									return (
										<div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3.5">
											<Label htmlFor="quiz-course-select">
												{t("settings.associatedCourseLabel")}
											</Label>
											<Select
												value={field.state.value || ANY_COURSE_VALUE}
												onValueChange={(val) =>
													field.handleChange(
														val === ANY_COURSE_VALUE ? null : val
													)
												}
											>
												<SelectTrigger
													id="quiz-course-select"
													className="bg-background"
												>
													<SelectValue
														placeholder={t("settings.anyCourseByCode")}
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={ANY_COURSE_VALUE}>
														{t("settings.anyCourseByCode")}
													</SelectItem>
													{courseOptions.map((course) => (
														<SelectItem key={course.id} value={course.id}>
															{course.is_published
																? course.title
																: `${course.title} (${t("settings.draftCourseBadge")})`}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<p className="flex items-start gap-1.5 text-xs text-muted-foreground">
												<InfoIcon className="mt-0.5 size-3.5 shrink-0" />
												<span>
													{courseId
														? t("settings.selectedCourseHint")
														: t("settings.anyCourseByCodeHint")}
												</span>
											</p>
										</div>
									);
								}}
							</form.AppField>
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

				{/* Pricing (public quizzes only — course-only quizzes are accessed via the course) */}
				{!isCourseOnly && (
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
				)}
			</div>
		);
	},
});
