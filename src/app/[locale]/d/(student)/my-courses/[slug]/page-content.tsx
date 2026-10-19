"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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
	findNextPendingLesson,
	flattenLessonIds,
	resolveActiveLessonId,
} from "@/components/blocks/course/learning.utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

	const activeLesson = React.useMemo(
		() =>
			data?.modules
				?.flatMap((module) => module.lessons)
				.find((lesson) => lesson.id === activeLessonId) ?? null,
		[data, activeLessonId]
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

	return (
		<div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
			{/* ── Main content ───────────────────────────────────────────────── */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Top bar */}
				<div className="flex h-11 shrink-0 items-center gap-2 border-b px-4">
					<Button asChild variant="ghost" size="sm" className="-ms-2 shrink-0">
						<Link href={routes.d.myCourses.page()}>
							<ArrowLeft className="size-4 rtl:rotate-180" />
							<span className="hidden sm:inline">{t("myCourses")}</span>
						</Link>
					</Button>
					<Separator orientation="vertical" className="h-4" />
					<p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
						{data.title}
					</p>
					<LessonSidebarToggle
						isOpen={sidebarOpen}
						onToggle={() => setSidebarOpen((v) => !v)}
					/>
				</div>

				{/* All-complete banner */}
				{allCompleted && (
					<div className="flex flex-wrap items-center gap-2 border-b bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
						<CheckCircle2 className="size-4 shrink-0" />
						<span className="flex-1">{tLearning("allComplete")}</span>
						<CertificateClaim courseId={data.id} />
					</div>
				)}

				{/* Content player — centered on the lesson to continue */}
				<div className="min-h-0 flex-1 overflow-y-auto">
					{isLoadingContent ? (
						<div className="flex items-center justify-center py-24">
							<Spinner className="size-6" />
						</div>
					) : (
						<ContentPlayer
							key={activeLessonId}
							lessonTitle={activeLesson.title}
							lessonNumber={currentIndex + 1}
							totalLessons={orderedLessonIds.length}
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
				</div>
			</div>

			{/* ── Modules/lessons accordion sidebar ──────────────────────────── */}
			<LessonSidebar
				courseTitle={data.title}
				modules={data.modules}
				activeLessonId={activeLessonId}
				totalProgress={data.enrollment.progress_percentage ?? 0}
				onLessonSelect={(id) => setLessonParam(id)}
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				className="hidden lg:flex"
			/>
		</div>
	);
}
