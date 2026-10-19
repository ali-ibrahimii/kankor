import { CourseDetail, LessonItem, ModuleItem } from "@/types/queries.types";

/** Flatten modules into course-ordered lesson ids. */
export function flattenLessons(modules: ModuleItem[]): LessonItem[] {
	return modules
		.slice()
		.sort((a, b) => a.order_index - b.order_index)
		.flatMap((module) =>
			module.lessons.slice().sort((a, b) => a.order_index - b.order_index)
		);
}
export function flattenLessonIds(modules: ModuleItem[]): string[] {
	return flattenLessons(modules).map((lesson) => lesson.id);
}
export function allLessonsCompleted(modules: ModuleItem[]): boolean {
	return flattenLessons(modules).every(
		(lesson) => lesson.lesson_progress?.is_completed
	);
}

/** First lesson (in course order) that is not yet completed. */
export function findNextPendingLesson(course: CourseDetail): LessonItem | null {
	for (const m of course.modules) {
		for (const l of m.lessons) {
			if (!l.lesson_progress?.is_completed) return l;
		}
	}
	return null;
}

/**
 * Pick the lesson to show: explicit selection wins, then the enrollment's
 * last-accessed lesson, then the next pending lesson, then the first lesson.
 */
export function resolveActiveLessonId(
	course: CourseDetail,
	requestedLessonId?: string | null
): string | null {
	const orderedLessonIds = flattenLessonIds(course.modules);

	if (requestedLessonId && orderedLessonIds.includes(requestedLessonId)) {
		return requestedLessonId;
	}

	if (
		course.enrollment?.last_accessed_lesson_id &&
		orderedLessonIds.includes(course.enrollment.last_accessed_lesson_id)
	) {
		return course.enrollment.last_accessed_lesson_id;
	}

	return findNextPendingLesson(course)?.id ?? orderedLessonIds[0] ?? null;
}
