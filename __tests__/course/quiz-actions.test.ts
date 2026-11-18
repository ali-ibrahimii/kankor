import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	loadQuizForEditing,
	saveQuiz,
} from "@/components/blocks/quiz-builder/actions";
import { createEmptyQuizDraft } from "@/components/blocks/quiz-builder/types";

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockRevalidatePath = vi.fn();

const insertedRows: Record<string, unknown[]> = {};
const updatedRows: Record<string, unknown[]> = {};

vi.mock("next/cache", () => ({
	revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => ({
		auth: { getUser: mockGetUser },
		rpc: mockRpc,
		from: mockFrom,
	}),
}));

function wireSupabaseMock() {
	mockFrom.mockImplementation((table: string) => ({
		insert: (payload: unknown) => {
			(insertedRows[table] ??= []).push(payload);
			if (table === "question_options") {
				return Promise.resolve({ error: null });
			}
			return {
				select: () => ({
					single: async () => ({
						data:
							table === "quizzes"
								? { id: "new-quiz-id", entrance_code: "AB12CD34" }
								: { id: "new-q-id" },
						error: null,
					}),
				}),
			};
		},
		update: (payload: unknown) => {
			(updatedRows[table] ??= []).push(payload);
			return {
				eq: () => ({
					select: () => ({
						single: async () => ({
							data: { id: "existing-quiz-id", entrance_code: "C61F0662" },
							error: null,
						}),
					}),
				}),
			};
		},
		select: () => ({
			eq: () => ({
				single: async () => ({
					data: {
						id: "existing-quiz-id",
						entrance_code: "C61F0662",
						title: "فصل اول",
						description: null,
						instructions: null,
						visibility: "private",
						course_id: "course-1",
						lesson_id: null,
						school_id: null,
						agency_id: null,
						max_attempts: 2,
						passing_score_percentage: 80,
						show_correct_answers_after: "attempt",
						shuffle_questions: true,
						time_limit_minutes: 30,
						is_free: true,
						price_credits: 0,
						related_courses_ids: [],
						related_decks_ids: [],
						book_id: null,
						subject_id: null,
						grade_id: null,
					},
					error: null,
				}),
				order: async () => ({ data: [], error: null }),
			}),
		}),
		delete: () => ({
			eq: async () => ({ error: null }),
		}),
	}));
}

beforeEach(() => {
	mockRpc.mockReset();
	mockFrom.mockReset();
	mockGetUser.mockReset();
	mockRevalidatePath.mockReset();
	for (const k of Object.keys(insertedRows)) delete insertedRows[k];
	for (const k of Object.keys(updatedRows)) delete updatedRows[k];
	mockGetUser.mockResolvedValue({ data: { user: { id: "instructor-1" } } });
	wireSupabaseMock();
});

describe("saveQuiz & loadQuizForEditing — visibility and course scoping", () => {
	it("saves a course-only quiz with selected course_id and attaches quiz_id to question_options", async () => {
		mockRpc.mockResolvedValue({ data: true, error: null });

		const draft = {
			...createEmptyQuizDraft(),
			title: "امتحان آخر فصل اول",
			visibility: "private" as const,
			course_id: "course-1",
			is_free: false,
			price_credits: 100,
			questions: [
				{
					id: "temp-q",
					quiz_id: null,
					question_text: "2 + 2 = ?",
					question_type: "multiple_choice_single_correct" as const,
					order_index: 0,
					points: 1,
					hint: null,
					explanation: null,
					image_content_block_id: null,
					_isNew: true,
					options: [
						{
							id: "temp-o1",
							question_id: null,
							option_text: "4",
							is_correct: true,
							order_index: 0,
							feedback: null,
							match_target_text: null,
							_isNew: true,
						},
					],
				},
			],
		};

		const res = await saveQuiz(draft);
		expect(res).toEqual({
			success: true,
			quizId: "new-quiz-id",
			entranceCode: "AB12CD34",
		});
		expect(mockRpc).toHaveBeenCalledWith("can_edit_course_content", {
			p_course_id: "course-1",
		});

		const quizInsert = insertedRows.quizzes?.[0] as Record<string, unknown>;
		expect(quizInsert.visibility).toBe("private");
		expect(quizInsert.course_id).toBe("course-1");
		expect(quizInsert.is_free).toBe(true);
		expect(quizInsert.price_credits).toBe(0);
		expect(quizInsert.user_id).toBe("instructor-1");

		const optInsert = insertedRows.question_options?.[0] as Record<
			string,
			unknown
		>;
		expect(optInsert.quiz_id).toBe("new-quiz-id");
		expect(optInsert.question_id).toBe("new-q-id");
	});

	it("rejects assigning a course-only quiz to a course the caller cannot manage", async () => {
		mockRpc.mockResolvedValue({ data: false, error: null });

		const res = await saveQuiz({
			...createEmptyQuizDraft(),
			title: "Unauthorized binding",
			visibility: "private",
			course_id: "other-instructors-course",
		});

		expect(res.success).toBe(false);
		expect(insertedRows.quizzes).toBeUndefined();
	});

	it("round-trips entrance_code, visibility, and course_id when loading for edit", async () => {
		const res = await loadQuizForEditing("existing-quiz-id");
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.draft.entrance_code).toBe("C61F0662");
			expect(res.draft.visibility).toBe("private");
			expect(res.draft.course_id).toBe("course-1");
		}
	});
});
