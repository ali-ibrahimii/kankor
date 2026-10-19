"use client";

import { atom } from "jotai";
import type {
	CourseBuilderState,
	DraftContentBlock,
	DraftLesson,
	DraftModule,
} from "./types";

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: CourseBuilderState = {
	courseId: "",
	activeLessonId: null,
	activeBlockId: null,
	modules: [],
	lessons: [],
	blocks: [],
	isSaving: false,
	isPublishing: false,
	expandedModuleIds: new Set(),
};

// ─── Root atom ────────────────────────────────────────────────────────────────

export const courseBuilderAtom = atom<CourseBuilderState>(INITIAL_STATE);

// ─── Derived read atoms ───────────────────────────────────────────────────────

export const activeModulesAtom = atom((get) =>
	get(courseBuilderAtom).modules.filter((m) => !m._deleted)
);

export const activeLessonsAtom = atom((get) =>
	get(courseBuilderAtom).lessons.filter((l) => !l._deleted)
);

export const activeBlocksAtom = atom((get) => {
	const { blocks, activeLessonId } = get(courseBuilderAtom);
	return blocks
		.filter((b) => !b._deleted && b.lesson_id === activeLessonId)
		.sort((a, b) => a.order_index - b.order_index);
});

export const activeLessonAtom = atom((get) => {
	const { lessons, activeLessonId } = get(courseBuilderAtom);
	return lessons.find((l) => l.id === activeLessonId) ?? null;
});

export const expandedModuleIdsAtom = atom(
	(get) => get(courseBuilderAtom).expandedModuleIds
);

// ─── Initializer ─────────────────────────────────────────────────────────────

export const initBuilderAtom = atom(
	null,
	(
		_get,
		set,
		payload: Pick<
			CourseBuilderState,
			"courseId" | "modules" | "lessons" | "blocks"
		>
	) => {
		const expandedModuleIds = new Set<string>(
			payload.modules.slice(0, 1).map((m) => m.id)
		);
		set(courseBuilderAtom, {
			...INITIAL_STATE,
			...payload,
			expandedModuleIds,
		});
	}
);

// ─── Navigation atoms ─────────────────────────────────────────────────────────

export const setActiveLessonAtom = atom(
	null,
	(_get, set, lessonId: string | null) => {
		set(courseBuilderAtom, (prev) => ({
			...prev,
			activeLessonId: lessonId,
			activeBlockId: null,
		}));
	}
);

export const setActiveBlockAtom = atom(
	null,
	(_get, set, blockId: string | null) => {
		set(courseBuilderAtom, (prev) => ({ ...prev, activeBlockId: blockId }));
	}
);

export const toggleModuleExpandAtom = atom(
	null,
	(_get, set, moduleId: string) => {
		set(courseBuilderAtom, (prev) => {
			const next = new Set(prev.expandedModuleIds);
			if (next.has(moduleId)) next.delete(moduleId);
			else next.add(moduleId);
			return { ...prev, expandedModuleIds: next };
		});
	}
);

// ─── Module write atoms ───────────────────────────────────────────────────────

export const addModuleAtom = atom(null, (_get, set, module: DraftModule) => {
	set(courseBuilderAtom, (prev) => ({
		...prev,
		modules: [...prev.modules, module],
		expandedModuleIds: new Set([...prev.expandedModuleIds, module.id]),
	}));
});

export const patchModuleAtom = atom(
	null,
	(_get, set, { id, patch }: { id: string; patch: Partial<DraftModule> }) => {
		set(courseBuilderAtom, (prev) => ({
			...prev,
			modules: prev.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)),
		}));
	}
);

export const deleteModuleAtom = atom(null, (_get, set, moduleId: string) => {
	set(courseBuilderAtom, (prev) => ({
		...prev,
		modules: prev.modules.map((m) =>
			m.id === moduleId ? { ...m, _deleted: true } : m
		),
		lessons: prev.lessons.map((l) =>
			l.module_id === moduleId ? { ...l, _deleted: true } : l
		),
		activeLessonId:
			prev.lessons.find((l) => l.id === prev.activeLessonId)?.module_id ===
			moduleId
				? null
				: prev.activeLessonId,
	}));
});

export const reorderModulesAtom = atom(
	null,
	(_get, set, reordered: DraftModule[]) => {
		set(courseBuilderAtom, (prev) => ({
			...prev,
			modules: [
				...reordered.map((m, i) => ({ ...m, order_index: i })),
				...prev.modules.filter((m) => m._deleted),
			],
		}));
	}
);

// ─── Lesson write atoms ───────────────────────────────────────────────────────

export const addLessonAtom = atom(null, (_get, set, lesson: DraftLesson) => {
	set(courseBuilderAtom, (prev) => ({
		...prev,
		lessons: [...prev.lessons, lesson],
		activeLessonId: lesson.id,
	}));
});

export const patchLessonAtom = atom(
	null,
	(_get, set, { id, patch }: { id: string; patch: Partial<DraftLesson> }) => {
		set(courseBuilderAtom, (prev) => ({
			...prev,
			lessons: prev.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)),
		}));
	}
);

export const deleteLessonAtom = atom(null, (_get, set, lessonId: string) => {
	set(courseBuilderAtom, (prev) => ({
		...prev,
		lessons: prev.lessons.map((l) =>
			l.id === lessonId ? { ...l, _deleted: true } : l
		),
		activeLessonId:
			prev.activeLessonId === lessonId ? null : prev.activeLessonId,
	}));
});

export const reorderLessonsInModuleAtom = atom(
	null,
	(
		_get,
		set,
		{ moduleId, reordered }: { moduleId: string; reordered: DraftLesson[] }
	) => {
		set(courseBuilderAtom, (prev) => {
			const withUpdatedIndex = reordered.map((l, i) => ({
				...l,
				order_index: i,
			}));
			const otherLessons = prev.lessons.filter(
				(l) => l.module_id !== moduleId || l._deleted
			);
			return { ...prev, lessons: [...otherLessons, ...withUpdatedIndex] };
		});
	}
);

// ─── Content block write atoms ────────────────────────────────────────────────

export const addBlockAtom = atom(
	null,
	(_get, set, block: DraftContentBlock) => {
		set(courseBuilderAtom, (prev) => ({
			...prev,
			blocks: [...prev.blocks, block],
			activeBlockId: block.id,
		}));
	}
);

export const patchBlockAtom = atom(
	null,
	(
		_get,
		set,
		{ id, patch }: { id: string; patch: Partial<DraftContentBlock> }
	) => {
		set(courseBuilderAtom, (prev) => ({
			...prev,
			blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
		}));
	}
);

export const deleteBlockAtom = atom(null, (_get, set, blockId: string) => {
	set(courseBuilderAtom, (prev) => ({
		...prev,
		blocks: prev.blocks.map((b) =>
			b.id === blockId ? { ...b, _deleted: true } : b
		),
		activeBlockId: prev.activeBlockId === blockId ? null : prev.activeBlockId,
	}));
});

export const reorderBlocksAtom = atom(
	null,
	(_get, set, reordered: DraftContentBlock[]) => {
		set(courseBuilderAtom, (prev) => {
			const activeLessonId = prev.activeLessonId;
			const withIndex = reordered.map((b, i) => ({ ...b, order_index: i }));
			const others = prev.blocks.filter(
				(b) => b.lesson_id !== activeLessonId || b._deleted
			);
			return { ...prev, blocks: [...others, ...withIndex] };
		});
	}
);

// ─── Save/publish flag atoms ──────────────────────────────────────────────────

export const setSavingAtom = atom(null, (_get, set, isSaving: boolean) => {
	set(courseBuilderAtom, (prev) => ({ ...prev, isSaving }));
});

export const setPublishingAtom = atom(
	null,
	(_get, set, isPublishing: boolean) => {
		set(courseBuilderAtom, (prev) => ({ ...prev, isPublishing }));
	}
);
