"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronRight, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import {
	CertificateClaim,
	ContentPlayer,
	LessonSidebar,
	LessonSidebarToggle,
} from "@/components/blocks/course";
import type { ContentBlock } from "@/components/blocks/course/content-player";
import {
	allLessonsCompleted,
	flattenLessonIds,
	resolveActiveLessonId,
} from "@/components/blocks/course/learning.utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { CourseDetail } from "@/types/queries.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchCourseLearningData(slug: string) {
	const client = createClient();

	const { data, error } = await client.rpc("get_course_details", {
		p_course_slug: slug,
	});

	if (error) throw error;

	return data?.[0] as CourseDetail;
}

async function fetchLessonContentBlocks(lessonId: string) {
	const client = createClient();
	const { data, error } = await client
		.from("lesson_content_blocks")
		.select(
			"id, block_type, order_index, text_content, video_url, video_provider, video_storage_key, audio_url, audio_storage_key, document_url, document_storage_key, external_resource_url, external_resource_title, image_url"
		)
		.eq("lesson_id", lessonId)
		.order("order_index");
	if (error) throw error;
	return (data ?? []) as ContentBlock[];
}

/** Modules created by the course builder may still carry a raw `__DEFAULT__`. */
function readableModuleTitle(title?: string | null) {
	const trimmed = (title ?? "").trim();
	if (!trimmed || /^__.*__$/.test(trimmed)) return null;
	return trimmed;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseLearningContent({
	course,
	slug,
}: {
	course: CourseDetail | null;
	slug: string;
}) {
	const t = useTranslations("courses");
	const tLearning = useTranslations("courses.learning");
	const tLearn = useTranslations("courses.learn");

	const queryClient = useQueryClient();

	const [lessonParam, setLessonParam] = useQueryState("lesson");
	const [sidebarOpen, setSidebarOpen] = React.useState(false);

	const { data, isLoading } = useQuery({
		initialData: course,
		queryKey: ["course-learning", slug],
		queryFn: () => fetchCourseLearningData(slug),
		enabled: !!slug,
	});

	// ── Derived lesson ordering / selection ──────────────────────────────────
	const orderedLessonIds = React.useMemo(
		() => (data ? flattenLessonIds(data.modules) : []),
		[data]
	);

	const activeLessonId = React.useMemo(
		() => (data ? resolveActiveLessonId(data, lessonParam) : null),
		[data, lessonParam]
	);

	const activeModule = React.useMemo(
		() =>
			data?.modules?.find((module) =>
				module.lessons.some((lesson) => lesson.id === activeLessonId)
			) ?? null,
		[data, activeLessonId]
	);

	const activeLesson = React.useMemo(
		() =>
			activeModule?.lessons.find((lesson) => lesson.id === activeLessonId) ??
			data?.modules
				?.flatMap((module) => module.lessons)
				.find((lesson) => lesson.id === activeLessonId) ??
			null,
		[data, activeModule, activeLessonId]
	);

	const currentIndex = activeLessonId
		? orderedLessonIds.indexOf(activeLessonId)
		: -1;
	const prevLessonId =
		currentIndex > 0 ? orderedLessonIds[currentIndex - 1] : null;
	const nextLessonId =
		currentIndex >= 0 && currentIndex < orderedLessonIds.length - 1
			? orderedLessonIds[currentIndex + 1]
			: null;

	const lessonById = React.useMemo(() => {
		const map = new Map<string, string>();
		for (const module of data?.modules ?? []) {
			for (const lesson of module.lessons) map.set(lesson.id, lesson.title);
		}
		return map;
	}, [data]);

	const prevLessonTitle = prevLessonId ? lessonById.get(prevLessonId) : null;
	const nextLessonTitle = nextLessonId ? lessonById.get(nextLessonId) : null;

	const allCompleted = !data?.modules?.length
		? false
		: allLessonsCompleted(data?.modules ?? []);

	// ── Active lesson content ─────────────────────────────────────────────────
	const { data: contentBlocks, isLoading: isLoadingContent } = useQuery({
		queryKey: ["lesson-content-blocks", activeLessonId],
		queryFn: () => fetchLessonContentBlocks(activeLessonId!),
		enabled: !!activeLessonId,
	});

	// ── Mark complete ─────────────────────────────────────────────────────────
	// `advance: false` is used by video auto-complete so the user isn't pulled
	// away from the lesson while the video is still playing.
	const markCompleteMutation = useMutation({
		mutationFn: async (_options: { advance: boolean }) => {
			const client = createClient();
			const { error } = await client.rpc("complete_lesson_for_user", {
				p_lesson_id: activeLessonId!,
			});
			if (error) throw error;
		},
		onSuccess: (_data, { advance }) => {
			queryClient.invalidateQueries({
				queryKey: ["course-learning", slug],
			});
			queryClient.invalidateQueries({ queryKey: ["enrollments"] });
			toast.success(t("learn.completed"));
			if (advance && nextLessonId) setLessonParam(nextLessonId);
		},
		onError: () => {
			toast.error(tLearning("markCompleteFailed"));
		},
	});

	// ── Loading / guard states ────────────────────────────────────────────────
	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center py-24">
				<Spinner className="size-6" />
			</div>
		);
	}

	if (!data) {
		return (
			<div className="p-6 text-center">
				<p className="text-sm text-muted-foreground">{t("courseNotFound")}</p>
				<Button asChild variant="outline" size="sm" className="mt-3">
					<Link href={routes.d.myCourses.page()}>
						<ArrowLeft className="size-4 rtl:rotate-180" />
						{t("myCourses")}
					</Link>
				</Button>
			</div>
		);
	}

	if (!data.enrollment) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 p-6 py-24 text-center">
				<p className="text-sm font-medium">{tLearning("notEnrolledTitle")}</p>
				<p className="text-xs text-muted-foreground">
					{tLearning("notEnrolledDescription")}
				</p>
				<Button asChild size="sm" className="mt-2">
					<Link href={routes.d.courses.slug.page({ slug: slug })}>
						{t("view")}
					</Link>
				</Button>
			</div>
		);
	}

	if (!activeLessonId || !activeLesson) {
		return (
			<div className="p-6 text-center text-sm text-muted-foreground">
				{tLearning("lessonNotFound")}
			</div>
		);
	}

	const progress = Math.round(data.enrollment.progress_percentage ?? 0);
	const moduleTitle = readableModuleTitle(activeModule?.title) ?? null;

	return (
		<div className="flex h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden bg-background">
			{/* ── Main column ─────────────────────────────────────────────────── */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Toolbar */}
				<div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/70 bg-background px-3 md:px-5">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="-ms-1 h-8 shrink-0 gap-1 rounded-xl px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
					>
						<Link href={routes.d.myCourses.page()}>
							<ArrowLeft className="size-4 rtl:rotate-180" />
							<span className="hidden sm:inline">{t("myCourses")}</span>
						</Link>
					</Button>

					<ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 rtl:rotate-180 sm:block" />

					<div className="flex min-w-0 flex-1 items-center gap-1.5">
						<p className="truncate text-[13px] font-bold md:text-sm">
							{data.title}
						</p>
						{moduleTitle && (
							<>
								<ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 rtl:rotate-180 md:block" />
								<p className="hidden min-w-0 truncate text-xs text-muted-foreground md:block">
									{moduleTitle}
								</p>
							</>
						)}
					</div>

					{/* Course progress pill */}
					<div className="hidden shrink-0 items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 sm:flex">
						<span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
							<span
								className="block h-full rounded-full bg-primary transition-[width] duration-500"
								style={{ width: `${progress}%` }}
							/>
						</span>
						<span className="text-[10px] font-black tabular-nums">
							{progress}%
						</span>
					</div>

					<div className="lg:hidden">
						<LessonSidebarToggle
							isOpen={sidebarOpen}
							onToggle={() => setSidebarOpen((v) => !v)}
						/>
					</div>
				</div>

				{/* All-complete banner */}
				{allCompleted && (
					<div className="flex flex-wrap items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
						<Trophy className="size-4 shrink-0" />
						<span className="flex-1">{tLearning("allComplete")}</span>
						<CertificateClaim courseId={data.id} />
					</div>
				)}

				{/* Player */}
				{isLoadingContent ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : (
					<ContentPlayer
						key={activeLessonId}
						lessonTitle={activeLesson.title}
						moduleTitle={moduleTitle}
						lessonNumber={currentIndex + 1}
						totalLessons={orderedLessonIds.length}
						durationMinutes={activeLesson.estimated_duration_minutes}
						prevLessonTitle={prevLessonTitle}
						nextLessonTitle={nextLessonTitle}
						contentBlocks={contentBlocks ?? []}
						isCompleted={activeLesson.lesson_progress?.is_completed ?? false}
						isMarkingComplete={markCompleteMutation.isPending}
						onMarkComplete={() =>
							markCompleteMutation.mutate({ advance: true })
						}
						onAutoComplete={() =>
							markCompleteMutation.mutate({ advance: false })
						}
						onPrevLesson={
							prevLessonId ? () => setLessonParam(prevLessonId) : undefined
						}
						onNextLesson={
							nextLessonId ? () => setLessonParam(nextLessonId) : undefined
						}
					/>
				)}

				{/* Completion hint for the whole course */}
				{!allCompleted && currentIndex === orderedLessonIds.length - 1 && (
					<div className="border-t border-border/70 bg-emerald-500/5 px-4 py-2 text-center text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
						<span className="inline-flex items-center gap-1.5">
							<CheckCircle2 className="size-3.5" />
							{tLearn("lastLessonHint")}
						</span>
					</div>
				)}
			</div>

			{/* ── Lesson list ─────────────────────────────────────────────────── */}
			<LessonSidebar
				courseTitle={data.title}
				modules={data.modules}
				activeLessonId={activeLessonId}
				totalProgress={data.enrollment.progress_percentage ?? 0}
				onLessonSelect={(id) => setLessonParam(id)}
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>
		</div>
	);
}
