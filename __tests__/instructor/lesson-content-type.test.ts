/**
 * Content-type derivation tests — the builder used to show a VID badge and a
 * «video» chip for every lesson because createEmptyLesson() defaults
 * content_type to "video" and nothing kept it in sync with the actual blocks.
 */
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";

import {
	addBlockAtom,
	courseBuilderAtom,
	deleteBlockAtom,
	patchBlockAtom,
} from "@/components/blocks/course-builder/store";
import {
	createEmptyBlock,
	createEmptyLesson,
	type DraftContentBlock,
	type DraftLesson,
	deriveLessonContentType,
} from "@/components/blocks/course-builder/types";

function makeLesson(
	type?: Parameters<typeof createEmptyLesson>[3]
): DraftLesson {
	return createEmptyLesson("mod-1", "course-1", 0, type);
}

function makeBlock(
	lessonId: string,
	blockType: DraftContentBlock["block_type"],
	index = 0
): DraftContentBlock {
	return createEmptyBlock(lessonId, "course-1", blockType, index);
}

describe("deriveLessonContentType", () => {
	it("falls back to the stored content_type when the lesson has no blocks", () => {
		const lesson = makeLesson("pdf_document");
		expect(deriveLessonContentType(lesson, [])).toBe("pdf_document");
	});

	it("ignores deleted blocks", () => {
		const lesson = makeLesson(); // stored "video"
		const deleted = { ...makeBlock(lesson.id, "video"), _deleted: true };
		expect(deriveLessonContentType(lesson, [deleted])).toBe("video");
	});

	it("returns the only live block's type (text lesson is TXT, not VID)", () => {
		const lesson = makeLesson();
		expect(
			deriveLessonContentType(lesson, [makeBlock(lesson.id, "text")])
		).toBe("text");
		expect(
			deriveLessonContentType(lesson, [makeBlock(lesson.id, "pdf_document")])
		).toBe("pdf_document");
		expect(
			deriveLessonContentType(lesson, [
				makeBlock(lesson.id, "slide_presentation"),
			])
		).toBe("slide_presentation");
	});

	it("prefers the most prominent type among mixed blocks", () => {
		const lesson = makeLesson();
		const blocks = [
			makeBlock(lesson.id, "text", 0),
			makeBlock(lesson.id, "pdf_document", 1),
			makeBlock(lesson.id, "audio", 2),
		];
		expect(deriveLessonContentType(lesson, blocks)).toBe("pdf_document");

		const withVideo = [...blocks, makeBlock(lesson.id, "video", 3)];
		expect(deriveLessonContentType(lesson, withVideo)).toBe("video");
	});

	it("only considers blocks that belong to the lesson", () => {
		const lesson = makeLesson();
		const blocks = [
			makeBlock("other-lesson", "video", 0),
			makeBlock(lesson.id, "text", 1),
		];
		expect(deriveLessonContentType(lesson, blocks)).toBe("text");
	});
});

describe("course-builder store keeps lesson.content_type in sync", () => {
	function seed() {
		const store = createStore();
		const lesson = makeLesson(); // stored "video" — the stale default
		store.set(courseBuilderAtom, (prev) => ({
			...prev,
			courseId: "course-1",
			lessons: [lesson],
		}));
		return { store, lesson };
	}

	it("addBlockAtom derives the type from the new block", () => {
		const { store, lesson } = seed();
		store.set(addBlockAtom, makeBlock(lesson.id, "text", 0));
		expect(store.get(courseBuilderAtom).lessons[0].content_type).toBe("text");
	});

	it("patchBlockAtom re-syncs when block_type changes", () => {
		const { store, lesson } = seed();
		const block = makeBlock(lesson.id, "text", 0);
		store.set(addBlockAtom, block);
		expect(store.get(courseBuilderAtom).lessons[0].content_type).toBe("text");

		store.set(patchBlockAtom, { id: block.id, patch: { block_type: "audio" } });
		expect(store.get(courseBuilderAtom).lessons[0].content_type).toBe("audio");
	});

	it("deleteBlockAtom re-syncs to the remaining live blocks", () => {
		const { store, lesson } = seed();
		const video = makeBlock(lesson.id, "video", 0);
		const text = makeBlock(lesson.id, "text", 1);
		store.set(addBlockAtom, video);
		store.set(addBlockAtom, text);
		expect(store.get(courseBuilderAtom).lessons[0].content_type).toBe("video");

		store.set(deleteBlockAtom, video.id);
		expect(store.get(courseBuilderAtom).lessons[0].content_type).toBe("text");

		store.set(deleteBlockAtom, text.id);
		// no live blocks left → falls back to the last derived/stored value
		expect(store.get(courseBuilderAtom).lessons[0].content_type).toBe("text");
	});
});
