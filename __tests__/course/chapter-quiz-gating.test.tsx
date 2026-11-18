import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ContentPlayer } from "@/components/blocks/course/content-player";
import {
	allLessonsCompleted,
	computeChapterLocks,
	findNextPendingLesson,
	resolveActiveLessonId,
} from "@/components/blocks/course/learning.utils";
import { LessonSidebar } from "@/components/blocks/course/lesson-sidebar";
import faMessages from "@/messages/fa.json";
import type {
	CourseDetail,
	LessonItem,
	ModuleItem,
} from "@/types/queries.types";

function wrap(ui: ReactNode) {
	return render(
		<NextIntlClientProvider locale="fa" messages={faMessages}>
			{ui}
		</NextIntlClientProvider>
	);
}

function makeLesson(
	id: string,
	order: number,
	overrides: Partial<LessonItem> = {}
): LessonItem {
	return {
		id,
		title: `درس ${id}`,
		content_type: "video",
		order_index: order,
		estimated_duration_minutes: 10,
		is_previewable: false,
		is_mandatory: true,
		has_quiz: false,
		quiz_passed: null,
		lesson_progress: null,
		...overrides,
	};
}

function makeCourse(modules: ModuleItem[]): CourseDetail {
	return {
		id: "course-1",
		title: "ریاضی کانکور",
		modules,
		enrollment: {
			progress_percentage: 0,
			last_accessed_lesson_id: null,
			completed_at: null,
			enrolled_at: "2026-11-18T00:00:00Z",
		},
	} as unknown as CourseDetail;
}

describe("chapter quiz pass-gating", () => {
	it("keeps the current chapter unlocked while locking all later chapters until the quiz is passed", () => {
		const modules: ModuleItem[] = [
			{
				id: "m1",
				title: "فصل اول",
				description: null,
				order_index: 0,
				lessons: [
					makeLesson("l1", 0, {
						lesson_progress: {
							id: "lp1",
							is_completed: true,
							completed_at: "2026-11-18T00:00:00Z",
							last_accessed_at: null,
							video_progress_seconds: null,
						},
					}),
					makeLesson("l2-quiz", 1, {
						content_type: "quiz",
						has_quiz: true,
						quiz_passed: false,
					}),
				],
			},
			{
				id: "m2",
				title: "فصل دوم",
				description: null,
				order_index: 1,
				lessons: [
					makeLesson("l3", 0),
					makeLesson("l4-quiz", 1, {
						content_type: "quiz",
						has_quiz: true,
						quiz_passed: false,
					}),
				],
			},
			{
				id: "m3",
				title: "فصل سوم",
				description: null,
				order_index: 2,
				lessons: [makeLesson("l5", 0)],
			},
		];

		const locked = computeChapterLocks(modules);
		expect(locked.blockingQuizLesson?.id).toBe("l2-quiz");
		expect(locked.blockingModule?.id).toBe("m1");
		expect(locked.lockedLessonIds.has("l1")).toBe(false);
		expect(locked.lockedLessonIds.has("l2-quiz")).toBe(false);
		expect(locked.lockedModuleIds.has("m2")).toBe(true);
		expect(locked.lockedModuleIds.has("m3")).toBe(true);
		expect([...locked.lockedLessonIds]).toEqual(["l3", "l4-quiz", "l5"]);

		// Redirects attempted jumps into Chapter 2 back to Chapter 1's exam
		const course = makeCourse(modules);
		expect(resolveActiveLessonId(course, "l3")).toBe("l2-quiz");
		expect(resolveActiveLessonId(course, "l1")).toBe("l1");

		// Passing Chapter 1's quiz unlocks Chapter 2, while Chapter 3 waits on l4-quiz
		modules[0].lessons[1].quiz_passed = true;
		modules[0].lessons[1].lesson_progress = {
			id: "lp2",
			is_completed: true,
			completed_at: "2026-11-18T01:00:00Z",
			last_accessed_at: null,
			video_progress_seconds: null,
		};

		const afterCh1Pass = computeChapterLocks(modules);
		expect(afterCh1Pass.lockedModuleIds.has("m2")).toBe(false);
		expect(afterCh1Pass.lockedLessonIds.has("l3")).toBe(false);
		expect(afterCh1Pass.lockedLessonIds.has("l4-quiz")).toBe(false);
		expect(afterCh1Pass.lockedModuleIds.has("m3")).toBe(true);
		expect(afterCh1Pass.lockedLessonIds.has("l5")).toBe(true);
		expect(resolveActiveLessonId(course, "l3")).toBe("l3");
		expect(findNextPendingLesson(course)?.id).toBe("l3");
	});

	it("does not lock chapters for optional (non-mandatory) quizzes", () => {
		const modules: ModuleItem[] = [
			{
				id: "m1",
				title: "فصل اول",
				description: null,
				order_index: 0,
				lessons: [
					makeLesson("l1", 0, {
						is_mandatory: false,
						has_quiz: true,
						quiz_passed: false,
					}),
				],
			},
			{
				id: "m2",
				title: "فصل دوم",
				description: null,
				order_index: 1,
				lessons: [makeLesson("l2", 0)],
			},
		];

		const state = computeChapterLocks(modules);
		expect(state.lockedLessonIds.size).toBe(0);
		expect(state.blockingQuizLesson).toBeNull();
	});

	it("never reports allLessonsCompleted until quiz lessons have quiz_passed = true", () => {
		const modules: ModuleItem[] = [
			{
				id: "m1",
				title: "فصل اول",
				description: null,
				order_index: 0,
				lessons: [
					makeLesson("l1", 0, {
						has_quiz: true,
						quiz_passed: false,
						lesson_progress: {
							id: "lp1",
							is_completed: true,
							completed_at: "2026-11-18T00:00:00Z",
							last_accessed_at: null,
							video_progress_seconds: null,
						},
					}),
				],
			},
		];
		expect(allLessonsCompleted(modules)).toBe(false);
		modules[0].lessons[0].quiz_passed = true;
		expect(allLessonsCompleted(modules)).toBe(true);
	});

	it("replaces manual Mark Complete with pass-quiz requirement and locks next chapter button", () => {
		const onMarkComplete = vi.fn();
		const onNextLesson = vi.fn();

		wrap(
			<ContentPlayer
				lessonTitle="امتحان آخر فصل اول"
				lessonNumber={2}
				totalLessons={4}
				contentBlocks={[]}
				isCompleted={false}
				requiresQuizPass
				isNextLessonLocked
				nextLessonTitle="درس اول فصل دوم"
				onMarkComplete={onMarkComplete}
				onNextLesson={onNextLesson}
			/>
		);

		expect(
			screen.getByText(faMessages.courses.learn.passQuizToComplete)
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: new RegExp(faMessages.courses.learn.markComplete),
			})
		).not.toBeInTheDocument();

		const nextBtn = screen.getByRole("button", {
			name: new RegExp(faMessages.courses.learn.nextChapterLocked),
		});
		expect(nextBtn).toBeDisabled();
	});

	it("disables locked chapter lessons in LessonSidebar and prevents selection", () => {
		const onSelect = vi.fn();
		const modules: ModuleItem[] = [
			{
				id: "m1",
				title: "فصل اول",
				description: null,
				order_index: 0,
				lessons: [
					makeLesson("l1", 0, { title: "مقدمه" }),
					makeLesson("l2", 1, {
						title: "امتحان فصل اول",
						content_type: "quiz",
						has_quiz: true,
						quiz_passed: false,
					}),
				],
			},
			{
				id: "m2",
				title: "فصل دوم",
				description: null,
				order_index: 1,
				lessons: [makeLesson("l3", 0, { title: "معادلات درجه دو" })],
			},
		];

		wrap(
			<LessonSidebar
				courseTitle="ریاضی"
				modules={modules}
				activeLessonId="l2"
				onLessonSelect={onSelect}
				isOpen
				onClose={vi.fn()}
			/>
		);

		const ch1Btn = screen.getByRole("button", { name: /مقدمه/ });
		const ch2Btn = screen.getByRole("button", { name: /معادلات درجه دو/ });

		expect(ch1Btn).not.toBeDisabled();
		expect(ch2Btn).toBeDisabled();

		fireEvent.click(ch2Btn);
		expect(onSelect).not.toHaveBeenCalled();

		fireEvent.click(ch1Btn);
		expect(onSelect).toHaveBeenCalledWith("l1");
	});
});
