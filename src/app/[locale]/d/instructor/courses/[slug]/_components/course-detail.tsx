"use client";

import {
	ArrowLeft,
	BookOpen,
	Clock,
	Eye,
	Pencil,
	Star,
	Trash2,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { CertificateManager } from "@/components/blocks/course";
import {
	deleteCourse,
	setCoursePublished,
} from "@/components/blocks/course-builder/actions";
import type {
	DraftLesson,
	DraftModule,
} from "@/components/blocks/course-builder/types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/widgets/stat-card";
import { Link, useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import type {
	CourseCardStats,
	CourseStudent,
	InstructorCourse,
	ReviewBreakdownRow,
} from "../../../_lib/instructor-data";

// ─── Props ────────────────────────────────────────────────────────────────────

type CourseDetailViewProps = {
	course: InstructorCourse;
	stats: CourseCardStats;
	students: CourseStudent[];
	breakdown: ReviewBreakdownRow[];
	modules: DraftModule[];
	lessons: DraftLesson[];
	contentError: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string | null): string {
	if (!value) return "—";
	return new Date(value).toLocaleDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CourseDetailView({
	course,
	stats,
	students,
	breakdown,
	modules,
	lessons,
	contentError,
}: CourseDetailViewProps) {
	const t = useTranslations("courses");
	const tc = useTranslations("courseBuilder");
	const router = useRouter();

	const [isPublishing, setIsPublishing] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);

	const visibleModules = React.useMemo(
		() =>
			modules
				.filter((m) => !m._deleted)
				.sort((a, b) => a.order_index - b.order_index),
		[modules]
	);

	const lessonsByModule = React.useMemo(() => {
		const map = new Map<string, DraftLesson[]>();
		for (const lesson of lessons) {
			if (lesson._deleted) continue;
			const list = map.get(lesson.module_id ?? "") ?? [];
			list.push(lesson);
			map.set(lesson.module_id ?? "", list);
		}
		for (const list of map.values()) {
			list.sort((a, b) => a.order_index - b.order_index);
		}
		return map;
	}, [lessons]);

	const objectives = course.learning_objectives ?? [];
	const prerequisites = course.prerequisites ?? [];

	const ratingValue = course.average_rating
		? course.average_rating.toFixed(1)
		: "—";
	const maxBreakdownCount = Math.max(1, ...breakdown.map((b) => b.count));

	async function handlePublish() {
		setIsPublishing(true);
		try {
			const result = await setCoursePublished(course.id, !course.is_published);
			if (!result.success) {
				toast.error(t("publishToggleFailed"));
				return;
			}
			toast.success(course.is_published ? t("unpublished") : t("published"));
			router.refresh();
		} finally {
			setIsPublishing(false);
		}
	}

	async function handleDelete() {
		setIsDeleting(true);
		try {
			const result = await deleteCourse(course.id);
			if (!result.success) {
				toast.error(t("deleteCourseFailed"));
				return;
			}
			toast.success(t("courseDeleted"));
			router.push(routes.d.instructor.courses.page());
			router.refresh();
		} finally {
			setIsDeleting(false);
			setDeleteOpen(false);
		}
	}

	return (
		<div className="flex flex-1 flex-col">
			{/* Header */}
			<div className="flex flex-col gap-4 border-b bg-background p-6">
				<Link
					href={routes.d.instructor.courses.page()}
					className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					{t("backToCourses")}
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-xl font-bold">{course.title}</h1>
							<Badge variant={course.is_published ? "default" : "secondary"}>
								{course.is_published
									? t("status_published")
									: t("status_draft")}
							</Badge>
						</div>
						{course.subtitle && (
							<p className="mt-1 text-sm text-muted-foreground">
								{course.subtitle}
							</p>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button variant="outline" size="sm" asChild>
							<Link
								href={routes.courses.slug.page({
									slug: course.slug ?? course.id,
								})}
							>
								<Eye className="size-4 me-1.5" />
								{t("detail.preview")}
							</Link>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link
								href={routes.d.instructor.courses.new.page({
									course_id: course.id,
								})}
							>
								<Pencil className="size-4 me-1.5" />
								{t("detail.editInBuilder")}
							</Link>
						</Button>
						<Button
							size="sm"
							variant={course.is_published ? "secondary" : "default"}
							onClick={handlePublish}
							disabled={isPublishing}
						>
							{isPublishing && <Spinner className="size-4 me-1.5" />}
							{course.is_published ? t("unpublish") : t("publish")}
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => setDeleteOpen(true)}
						>
							<Trash2 className="size-4 me-1.5" />
							{t("detail.deleteCourse")}
						</Button>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="flex flex-1 flex-col">
				<div className="border-b bg-background px-6">
					<TabsList className="bg-transparent p-0">
						<TabsTrigger value="overview">{t("detail.overview")}</TabsTrigger>
						<TabsTrigger value="students">{t("detail.students")}</TabsTrigger>
						<TabsTrigger value="analytics">{t("detail.analytics")}</TabsTrigger>
						<TabsTrigger value="certificates">
							{t("detail.certificates")}
						</TabsTrigger>
					</TabsList>
				</div>

				{/* Overview */}
				<TabsContent value="overview" className="flex-1 p-6">
					<div className="max-w-3xl space-y-6">
						{course.description && (
							<section className="space-y-2">
								<h3 className="text-sm font-bold">{t("detail.about")}</h3>
								<p className="text-sm leading-6 text-muted-foreground">
									{course.description}
								</p>
							</section>
						)}

						{objectives.length > 0 && (
							<section className="space-y-2">
								<h3 className="text-sm font-bold">{t("detail.objectives")}</h3>
								<ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
									{objectives.map((objective) => (
										<li key={objective}>{objective}</li>
									))}
								</ul>
							</section>
						)}

						{prerequisites.length > 0 && (
							<section className="space-y-2">
								<h3 className="text-sm font-bold">
									{t("detail.prerequisites")}
								</h3>
								<ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
									{prerequisites.map((prerequisite) => (
										<li key={prerequisite}>{prerequisite}</li>
									))}
								</ul>
							</section>
						)}

						<section className="space-y-2">
							<h3 className="text-sm font-bold">{t("detail.curriculum")}</h3>
							{contentError ? (
								<p className="text-sm text-muted-foreground">
									{tc("contentLoadFailed")}
								</p>
							) : visibleModules.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{t("detail.noModules")}
								</p>
							) : (
								<ol className="space-y-3">
									{visibleModules.map((module, index) => (
										<li key={module.id} className="rounded-lg border p-3">
											<p className="text-sm font-medium">
												{index + 1}. {module.title || tc("module.untitled")}
											</p>
											<ul className="mt-2 space-y-1">
												{(lessonsByModule.get(module.id) ?? []).map(
													(lesson) => (
														<li
															key={lesson.id}
															className="flex items-center justify-between text-sm text-muted-foreground"
														>
															<span>
																{lesson.title || tc("lesson.untitled")}
															</span>
															{lesson.estimated_duration_minutes ? (
																<span className="text-xs">
																	{t("durationMinutes", {
																		minutes: lesson.estimated_duration_minutes,
																	})}
																</span>
															) : null}
														</li>
													)
												)}
											</ul>
										</li>
									))}
								</ol>
							)}
						</section>

						<section className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-3">
							<div>
								<p className="text-xs text-muted-foreground">
									{t("detail.language")}
								</p>
								<p className="font-medium">
									{t(`language_${course.language}`)}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{t("detail.level")}
								</p>
								<p className="font-medium">
									{course.level ? t(`level_${course.level}`) : "—"}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{t("detail.price")}
								</p>
								<p className="font-medium">
									{course.is_free
										? t("free")
										: t("priceCredits", { count: course.price_credits })}
								</p>
							</div>
						</section>
					</div>
				</TabsContent>

				{/* Students */}
				<TabsContent value="students" className="flex-1 p-6">
					<div className="max-w-3xl space-y-4">
						<p className="text-sm text-muted-foreground">
							{t("detail.totalEnrollments")}:{" "}
							<span className="font-bold text-foreground">
								{stats.enrollments_count}
							</span>
						</p>
						{students.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("detail.noStudents")}
							</p>
						) : (
							<div className="rounded-xl border bg-card">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("detail.studentName")}</TableHead>
											<TableHead>{t("detail.enrolledAt")}</TableHead>
											<TableHead>{t("detail.progress")}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{students.map((student) => (
											<TableRow key={student.student_id}>
												<TableCell className="font-medium">
													{student.full_name || "—"}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{formatDate(student.enrolled_at)}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
															<div
																className="h-full rounded-full bg-primary"
																style={{
																	width: `${Math.min(100, Math.max(0, student.progress_percentage))}%`,
																}}
															/>
														</div>
														<span className="text-xs text-muted-foreground">
															{student.progress_percentage}%
														</span>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</div>
				</TabsContent>

				{/* Certificates */}
				<TabsContent value="certificates" className="flex-1 p-6">
					<div className="max-w-3xl">
						<CertificateManager courseId={course.id} />
					</div>
				</TabsContent>

				{/* Analytics */}
				<TabsContent value="analytics" className="flex-1 p-6">
					<div className="max-w-3xl space-y-6">
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<StatCard
								icon={BookOpen}
								label={t("detail.totalLessons")}
								value={String(stats.lessons_count)}
							/>
							<StatCard
								icon={Clock}
								label={t("detail.totalDuration")}
								value={
									stats.lessons_minutes >= 60
										? t("detail.hoursMinutes", {
												hours: Math.floor(stats.lessons_minutes / 60),
												minutes: stats.lessons_minutes % 60,
											})
										: t("durationMinutes", { minutes: stats.lessons_minutes })
								}
							/>
							<StatCard
								icon={Users}
								label={t("detail.totalEnrollments")}
								value={String(stats.enrollments_count)}
							/>
							<StatCard
								icon={Star}
								label={t("detail.averageRating")}
								value={ratingValue}
							/>
						</div>

						<section className="space-y-3">
							<h3 className="text-sm font-bold">
								{t("detail.ratingBreakdown")}
							</h3>
							{breakdown.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{t("detail.notRated")}
								</p>
							) : (
								<div className="space-y-2">
									{[5, 4, 3, 2, 1].map((star) => {
										const row = breakdown.find((b) => b.rating === star);
										const count = row?.count ?? 0;
										return (
											<div key={star} className="flex items-center gap-3">
												<span className="w-10 text-xs text-muted-foreground">
													{star} ★
												</span>
												<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
													<div
														className="h-full rounded-full bg-primary"
														style={{
															width: `${(count / maxBreakdownCount) * 100}%`,
														}}
													/>
												</div>
												<span className="w-8 text-end text-xs text-muted-foreground">
													{count}
												</span>
											</div>
										);
									})}
									<p className="pt-1 text-xs text-muted-foreground">
										{t("detail.totalReviews")}: {course.total_reviews}
									</p>
								</div>
							)}
						</section>
					</div>
				</TabsContent>
			</Tabs>

			{/* Delete confirmation */}
			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("detail.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("detail.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							{tc("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								void handleDelete();
							}}
							disabled={isDeleting}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{isDeleting && <Spinner className="size-4 me-1.5" />}
							{t("detail.deleteConfirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
