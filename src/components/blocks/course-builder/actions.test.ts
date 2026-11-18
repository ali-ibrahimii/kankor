import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DraftContentBlock, DraftLesson, DraftModule } from "./types";

// ─── Mocks ──────────────────────────────────────────────────────────────────
// Chainable query-builder mock. Each `from(table)` returns a builder whose
// methods log `table.method` into callLog (so tests can assert call ORDER —
// the FK contract depends on it) and whose await resolves a configurable
// `{ data, error }` keyed by `table.method` (falling back to `table`).

const mockGetUser = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { getUser: mockGetUser },
		from: mockFrom,
		rpc: vi.fn(),
	}),
}));

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
}));

// Import after the mocks so the module under test picks them up.
const { saveCourseContent } = await import("./actions");

type QueryResult = { data: unknown; error: unknown };

const callLog: string[] = [];
const inCalls: Array<{ table: string; args: unknown[] }> = [];
const resultsByKey: Record<string, QueryResult> = {};

const FILTERS = new Set(["eq", "in", "order"]);

function makeBuilder(table: string) {
	let opMethod = "";
	const builder: Record<string, ReturnType<typeof vi.fn>> = {};
	const record = (method: string) => {
		if (!FILTERS.has(method) && !opMethod) opMethod = method;
		callLog.push(`${table}.${method}`);
	};
	for (const method of [
		"insert",
		"update",
		"delete",
		"select",
		"eq",
		"order",
		"upsert",
		"single",
	]) {
		builder[method] = vi.fn(() => {
			record(method);
			return builder;
		});
	}
	builder.in = vi.fn((...args: unknown[]) => {
		record("in");
		inCalls.push({ table, args });
		return builder;
	});
	// Awaiting the builder resolves the configured result for its operation
	// (e.g. `.delete().in(...)` → key `lessons.delete`).
	(builder as unknown as { then: unknown }).then = (
		onFulfilled: (value: QueryResult) => unknown
	) => {
		const key = `${table}.${opMethod || "single"}`;
		const result = resultsByKey[key] ?? { data: null, error: null };
		return Promise.resolve(result).then(onFulfilled);
	};
	return builder;
}

function mod(id: string, over: Partial<DraftModule> = {}): DraftModule {
	return {
		id,
		course_id: "course-1",
		title: "Module",
		description: null,
		order_index: 0,
		start_page: null,
		end_page: null,
		...over,
	};
}

function lesson(
	id: string,
	moduleId: string | null,
	over: Partial<DraftLesson> = {}
): DraftLesson {
	return {
		id,
		module_id: moduleId,
		course_id: "course-1",
		title: "Lesson",
		description: null,
		content_type: "text",
		order_index: 0,
		is_previewable: false,
		is_mandatory: true,
		estimated_duration_minutes: null,
		slug: null,
		...over,
	};
}

function block(
	id: string,
	lessonId: string | null,
	over: Partial<DraftContentBlock> = {}
): DraftContentBlock {
	return {
		id,
		lesson_id: lessonId,
		course_id: "course-1",
		block_type: "text",
		order_index: 0,
		text_content: null,
		video_url: null,
		video_provider: null,
		video_transcript: null,
		video_storage_key: null,
		audio_url: null,
		audio_transcript: null,
		audio_storage_key: null,
		document_url: null,
		document_storage_key: null,
		image_url: null,
		code_language: null,
		default_code: null,
		solution_code: null,
		external_resource_url: null,
		external_resource_title: null,
		playlist: null,
		slug: null,
		...over,
	};
}

beforeEach(() => {
	mockGetUser.mockReset();
	mockFrom.mockReset();
	mockRevalidatePath.mockReset();
	callLog.length = 0;
	inCalls.length = 0;
	for (const key of Object.keys(resultsByKey)) delete resultsByKey[key];
	mockFrom.mockImplementation((table: string) => makeBuilder(table));
});

// ─── Delete-order contract ───────────────────────────────────────────────────

describe("saveCourseContent (FK-safe delete order)", () => {
	it("deletes children-first (blocks → lessons → modules) and upserts parents-first", async () => {
		const deleted = true;
		const isNew = true;

		const result = await saveCourseContent(
			"course-1",
			[
				mod("m-del", { _deleted: deleted, _isNew: !isNew }),
				mod("m-keep", { order_index: 1 }),
			],
			[
				lesson("l-del", "m-del", { _deleted: deleted, _isNew: !isNew }),
				lesson("l-keep", "m-keep", { order_index: 1 }),
			],
			[
				block("b-del", "l-del", { _deleted: deleted, _isNew: !isNew }),
				block("b-keep", "l-keep", { order_index: 1 }),
			]
		);

		expect(result).toEqual({ success: true, data: undefined });

		const delBlock = callLog.indexOf("lesson_content_blocks.delete");
		const delLesson = callLog.indexOf("lessons.delete");
		const delModule = callLog.indexOf("modules.delete");
		expect(delBlock).toBeGreaterThanOrEqual(0);
		expect(delLesson).toBeGreaterThan(delBlock);
		expect(delModule).toBeGreaterThan(delLesson);

		const upModule = callLog.indexOf("modules.upsert");
		const upLesson = callLog.indexOf("lessons.upsert");
		const upBlock = callLog.indexOf("lesson_content_blocks.upsert");
		expect(upModule).toBeGreaterThanOrEqual(0);
		expect(upLesson).toBeGreaterThan(upModule);
		expect(upBlock).toBeGreaterThan(upLesson);

		// All deletes strictly before all upserts: a child row must never be
		// deleted after its parent is gone, and never upserted before the
		// parent exists.
		expect(delModule).toBeLessThan(upModule);
	});

	it("cascade-deletes lessons of deleted modules and blocks of deleted lessons even when not flagged", async () => {
		await saveCourseContent(
			"course-1",
			[mod("m-del", { _deleted: true, _isNew: false })],
			// Lesson under the deleted module: NOT marked deleted itself.
			[lesson("l-dangling", "m-del")],
			// Block under that lesson: NOT marked deleted either.
			[block("b-dangling", "l-dangling")]
		);

		const lessonIds = inCalls.find(
			(c) => c.table === "lessons" && callLog.includes("lessons.in")
		);
		const blockIds = inCalls.find((c) => c.table === "lesson_content_blocks");

		expect(
			inCalls.some(
				(c) =>
					c.table === "lessons" &&
					Array.isArray(c.args[1]) &&
					(c.args[1] as string[]).includes("l-dangling")
			)
		).toBe(true);
		expect(
			inCalls.some(
				(c) =>
					c.table === "lesson_content_blocks" &&
					Array.isArray(c.args[1]) &&
					(c.args[1] as string[]).includes("b-dangling")
			)
		).toBe(true);
		expect(lessonIds).toBeDefined();
		expect(blockIds).toBeDefined();

		// Nothing dangling is upserted again.
		expect(callLog).not.toContain("lessons.upsert");
		expect(callLog).not.toContain("lesson_content_blocks.upsert");
	});

	it("clears lesson dependents (quizzes, progress, threads) before deleting lessons", async () => {
		resultsByKey["quizzes.select"] = { data: [{ id: "quiz-1" }], error: null };
		resultsByKey["questions.select"] = {
			data: [{ id: "question-1" }],
			error: null,
		};
		resultsByKey["quiz_attempts.select"] = {
			data: [{ id: "attempt-1" }],
			error: null,
		};

		const result = await saveCourseContent(
			"course-1",
			[mod("m-del", { _deleted: true, _isNew: false })],
			[lesson("l-del", "m-del", { _deleted: true, _isNew: false })],
			[]
		);
		expect(result).toEqual({ success: true, data: undefined });

		const idx = (entry: string) => callLog.indexOf(entry);
		expect(idx("answers.delete")).toBeGreaterThanOrEqual(0);
		expect(idx("question_options.delete")).toBeLessThan(
			idx("questions.delete")
		);
		expect(idx("answers.delete")).toBeLessThan(idx("quiz_attempts.delete"));
		expect(idx("questions.delete")).toBeLessThan(idx("quizzes.delete"));
		expect(idx("quiz_attempts.delete")).toBeLessThan(idx("quizzes.delete"));
		expect(idx("quizzes.delete")).toBeLessThan(idx("lessons.delete"));
		expect(idx("lesson_progress.delete")).toBeLessThan(idx("lessons.delete"));
		// Discussions are user content: detach the lesson link, never delete.
		expect(idx("discussion_threads.update")).toBeLessThan(
			idx("lessons.delete")
		);
		expect(callLog).not.toContain("discussion_threads.delete");
		expect(callLog).not.toContain("discussion_posts.delete");
	});

	it("detaches quiz-question image references before deleting blocks", async () => {
		const result = await saveCourseContent(
			"course-1",
			[],
			[lesson("l-keep", null)],
			[block("b-del", "l-keep", { _deleted: true, _isNew: false })]
		);
		expect(result).toEqual({ success: true, data: undefined });

		expect(callLog.indexOf("questions.update")).toBeGreaterThanOrEqual(0);
		expect(callLog.indexOf("questions.update")).toBeLessThan(
			callLog.indexOf("lesson_content_blocks.delete")
		);
		expect(
			inCalls.some(
				(c) =>
					c.table === "questions" &&
					Array.isArray(c.args[1]) &&
					(c.args[1] as string[]).includes("b-del")
			)
		).toBe(true);
	});

	it("never throws on database errors — returns a mapped failure code instead", async () => {
		resultsByKey["lessons.delete"] = {
			data: null,
			error: {
				message:
					'update or delete on table "modules" violates foreign key constraint "lessons_module_id_fkey"',
			},
		};

		const result = await saveCourseContent(
			"course-1",
			[mod("m-del", { _deleted: true, _isNew: false })],
			[lesson("l-del", "m-del", { _deleted: true, _isNew: false })],
			[]
		);

		// The existing failure() contract maps FK/unique/null/check violations
		// to `invalid` — either way the caller gets a stable, localizable code
		// instead of a thrown raw English database message.
		expect(result).toMatchObject({ success: false, code: "invalid" });
		expect(typeof (result as { error?: unknown }).error).toBe("string");
	});

	it("surfaces unauthenticated database errors as code unauthorized", async () => {
		resultsByKey["modules.delete"] = {
			data: null,
			error: { message: "JWT expired: invalid claim" },
		};

		const result = await saveCourseContent(
			"course-1",
			[mod("m-del", { _deleted: true, _isNew: false })],
			[],
			[]
		);

		expect(result).toMatchObject({ success: false, code: "unauthorized" });
	});
});
