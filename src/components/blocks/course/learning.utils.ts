import { CourseDetail, LessonItem, ModuleItem } from "@/types/queries.types";

/** Sort modules deterministically (matches server-side SQL ordering). */
export function sortModules(modules: ModuleItem[]): ModuleItem[] {
	return modules
		.slice()
		.sort((a, b) => a.order_index - b.order_index || a.id.localeCompare(b.id));
}

/** Flatten modules into course-ordered lessons. */
export function flattenLessons(modules: ModuleItem[]): LessonItem[] {
	return sortModules(modules).flatMap((module) =>
		module.lessons.slice().sort((a, b) => a.order_index - b.order_index)
	);
}

export function flattenLessonIds(modules: ModuleItem[]): string[] {
	return flattenLessons(modules).map((lesson) => lesson.id);
}

/**
 * True when a mandatory lesson contains an exam that has not yet been passed.
 * Lessons without `has_quiz` (or optional lessons) never block chapter progress.
 */
export function isBlockingQuizLesson(lesson: LessonItem): boolean {
	const isMandatory = lesson.is_mandatory ?? true;
	return isMandatory && Boolean(lesson.has_quiz) && lesson.quiz_passed !== true;
}

export interface ChapterLockState {
	lockedLessonIds: Set<string>;
	lockedModuleIds: Set<string>;
	/** The first unpassed mandatory quiz lesson preventing advancement, if any. */
	blockingQuizLesson: LessonItem | null;
	/** The chapter containing `blockingQuizLesson`, if any. */
	blockingModule: ModuleItem | null;
}

/**
 * Compute chapter-level pass gating across a course.
 *
 * All lessons within a chapter stay accessible so learners can review chapter
 * material and take its end-of-chapter quiz, while every subsequent chapter
 * remains locked until all mandatory quizzes in earlier chapters are passed.
 */
export function computeChapterLocks(modules: ModuleItem[]): ChapterLockState {
	const lockedLessonIds = new Set<string>();
	const lockedModuleIds = new Set<string>();
	let blockingQuizLesson: LessonItem | null = null;
	let blockingModule: ModuleItem | null = null;

	for (const mod of sortModules(modules)) {
		const orderedLessons = mod.lessons
			.slice()
			.sort((a, b) => a.order_index - b.order_index);

		if (blockingQuizLesson) {
			lockedModuleIds.add(mod.id);
			for (const lesson of orderedLessons) {
				lockedLessonIds.add(lesson.id);
			}
			continue;
		}

		const firstUnpassedQuiz = orderedLessons.find(isBlockingQuizLesson);
		if (firstUnpassedQuiz) {
			blockingQuizLesson = firstUnpassedQuiz;
			blockingModule = mod;
		}
	}

	return {
		lockedLessonIds,
		lockedModuleIds,
		blockingQuizLesson,
		blockingModule,
	};
}

export function allLessonsCompleted(modules: ModuleItem[]): boolean {
	return flattenLessons(modules).every(
		(lesson) =>
			Boolean(lesson.lesson_progress?.is_completed) &&
			(!lesson.has_quiz || lesson.quiz_passed === true)
	);
}

/** First unlocked lesson (in course order) that is not yet completed. */
export function findNextPendingLesson(course: CourseDetail): LessonItem | null {
	const { lockedLessonIds, blockingQuizLesson } = computeChapterLocks(
		course.modules
	);
	for (const m of sortModules(course.modules)) {
		const lessons = m.lessons
			.slice()
			.sort((a, b) => a.order_index - b.order_index);
		for (const l of lessons) {
			if (lockedLessonIds.has(l.id)) continue;
			const done =
				Boolean(l.lesson_progress?.is_completed) &&
				(!l.has_quiz || l.quiz_passed === true);
			if (!done) return l;
		}
	}
	return blockingQuizLesson;
}

/**
 * Pick the lesson to show: explicit selection wins (when unlocked), then the
 * enrollment's last-accessed lesson (when unlocked), then the next pending
 * lesson, then the first lesson. Locked chapter requests fall back to the
 * blocking chapter quiz.
 */
export function resolveActiveLessonId(
	course: CourseDetail,
	requestedLessonId?: string | null
): string | null {
	const orderedLessonIds = flattenLessonIds(course.modules);
	const { lockedLessonIds, blockingQuizLesson } = computeChapterLocks(
		course.modules
	);

	if (requestedLessonId && orderedLessonIds.includes(requestedLessonId)) {
		if (!lockedLessonIds.has(requestedLessonId)) {
			return requestedLessonId;
		}
		return blockingQuizLesson?.id ?? orderedLessonIds[0] ?? null;
	}

	const lastAccessed = course.enrollment?.last_accessed_lesson_id;
	if (
		lastAccessed &&
		orderedLessonIds.includes(lastAccessed) &&
		!lockedLessonIds.has(lastAccessed)
	) {
		return lastAccessed;
	}

	return findNextPendingLesson(course)?.id ?? orderedLessonIds[0] ?? null;
}
