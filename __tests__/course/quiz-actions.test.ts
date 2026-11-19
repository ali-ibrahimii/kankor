import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteQuiz,
	loadQuizForEditing,
	saveQuiz,
} from "@/components/blocks/quiz-builder/actions";
import { createEmptyQuizDraft } from "@/components/blocks/quiz-builder/types";

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockServiceFrom = vi.fn();
const mockHasServiceRoleKey = vi.fn();
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
	hasServiceRoleKey: () => mockHasServiceRoleKey(),
	createServiceRoleClient: () => ({
		from: mockServiceFrom,
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
				in: async () => ({ data: [], error: null }),
			}),
		}),
		delete: () => ({
			eq: () => ({
				error: null,
				in: async () => ({ error: null }),
			}),
			in: async () => ({ error: null }),
		}),
	}));
}

beforeEach(() => {
	mockRpc.mockReset();
	mockFrom.mockReset();
	mockServiceFrom.mockReset();
	mockHasServiceRoleKey.mockReset();
	mockGetUser.mockReset();
	mockRevalidatePath.mockReset();
	for (const k of Object.keys(insertedRows)) delete insertedRows[k];
	for (const k of Object.keys(updatedRows)) delete updatedRows[k];
	mockHasServiceRoleKey.mockReturnValue(false);
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

	it("deletes answers and question_options before deleting removed questions", async () => {
		const operations: string[] = [];

		mockFrom.mockImplementation((table: string) => ({
			update: () => ({
				eq: () => ({
					select: () => ({
						single: async () => ({
							data: { id: "quiz-1", entrance_code: "AA11BB22" },
							error: null,
						}),
					}),
				}),
			}),
			select: () => ({
				eq: (_col: string, val: string) => ({
					in: async (_inCol: string, ids: string[]) => {
						operations.push(`select:${table}:quiz=${val}:ids=${ids.join(",")}`);
						return { data: [{ id: "q-old-1" }], error: null };
					},
				}),
			}),
			delete: () => ({
				in: async (_col: string, ids: string[]) => {
					operations.push(`delete:${table}:ids=${ids.join(",")}`);
					return { error: null };
				},
				eq: (_col: string, val: string) => ({
					in: async (_inCol: string, ids: string[]) => {
						operations.push(`delete:${table}:quiz=${val}:ids=${ids.join(",")}`);
						return { error: null };
					},
				}),
			}),
		}));

		const res = await saveQuiz({
			...createEmptyQuizDraft(),
			id: "quiz-1",
			title: "Updated Quiz",
			visibility: "public",
			questions: [
				{
					id: "q-old-1",
					quiz_id: "quiz-1",
					question_text: "Removed question",
					question_type: "multiple_choice_single_correct",
					order_index: 0,
					points: 1,
					hint: null,
					explanation: null,
					image_content_block_id: null,
					_deleted: true,
					options: [],
				},
			],
		});

		expect(res).toEqual({
			success: true,
			quizId: "quiz-1",
			entranceCode: "AA11BB22",
		});
		expect(operations).toEqual([
			"select:questions:quiz=quiz-1:ids=q-old-1",
			"delete:answers:ids=q-old-1",
			"delete:question_options:ids=q-old-1",
			"delete:questions:quiz=quiz-1:ids=q-old-1",
		]);
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

describe("deleteQuiz — cascade RPC and pre-migration child-first fallback", () => {
	it("deletes via delete_quiz_cascade RPC and revalidates admin/instructor quiz routes", async () => {
		mockRpc.mockResolvedValue({ data: true, error: null });

		const res = await deleteQuiz("quiz-123");

		expect(res).toEqual({ success: true });
		expect(mockRpc).toHaveBeenCalledWith("delete_quiz_cascade", {
			p_quiz_id: "quiz-123",
		});
		expect(mockFrom).not.toHaveBeenCalled();
		expect(mockRevalidatePath).toHaveBeenCalledWith("/d/admin/quizzes");
		expect(mockRevalidatePath).toHaveBeenCalledWith("/d/instructor/quizzes");
	});

	it("surfaces authorization/domain errors from delete_quiz_cascade without falling back", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: {
				code: "P0001",
				message: "Permission denied: cannot delete this quiz.",
			},
		});

		const res = await deleteQuiz("quiz-123");

		expect(res).toEqual({
			success: false,
			error: "Permission denied: cannot delete this quiz.",
		});
		expect(mockFrom).not.toHaveBeenCalled();
		expect(mockServiceFrom).not.toHaveBeenCalled();
	});

	it("falls back to authorized child-first deletion when delete_quiz_cascade is not deployed yet", async () => {
		const operations: string[] = [];
		mockHasServiceRoleKey.mockReturnValue(true);

		mockRpc.mockImplementation(
			async (fn: string, args: Record<string, unknown>) => {
				if (fn === "delete_quiz_cascade") {
					return {
						data: null,
						error: {
							code: "PGRST202",
							message:
								"Could not find the function public.delete_quiz_cascade(p_quiz_id) in the schema cache",
						},
					};
				}
				if (fn === "can_manage_quiz") {
					expect(args).toEqual({
						p_quiz_id: "quiz-locked",
						p_user_id: "instructor-1",
					});
					return { data: true, error: null };
				}
				return { data: null, error: null };
			}
		);

		mockServiceFrom.mockImplementation((table: string) => ({
			select: () => ({
				eq: (_col: string, val: string) => {
					if (table === "quizzes") {
						return {
							maybeSingle: async () => ({
								data: { id: val, locked_at: "2026-11-18T10:00:00Z" },
								error: null,
							}),
						};
					}
					if (table === "questions") {
						return Promise.resolve({
							data: [{ id: "q-1" }, { id: "q-2" }],
							error: null,
						});
					}
					if (table === "quiz_attempts") {
						return Promise.resolve({
							data: [{ id: "att-1" }],
							error: null,
						});
					}
					return Promise.resolve({ data: [], error: null });
				},
				contains: async () => ({
					data: [
						{ id: "course-9", related_quizzes_ids: ["quiz-locked", "quiz-2"] },
					],
					error: null,
				}),
			}),
			update: (payload: Record<string, unknown>) => ({
				eq: async (col: string, val: string) => {
					operations.push(
						`update:${table}:${col}=${val}:${JSON.stringify(payload)}`
					);
					return { error: null };
				},
			}),
			delete: () => ({
				eq: (col: string, val: string) => {
					if (table === "classroom_resources") {
						return {
							eq: async (col2: string, val2: string) => {
								operations.push(
									`delete:${table}:${col}=${val}&${col2}=${val2}`
								);
								return { error: null };
							},
						};
					}
					operations.push(`delete:${table}:${col}=${val}`);
					return Promise.resolve({ error: null });
				},
				in: async (col: string, ids: string[]) => {
					operations.push(`delete:${table}:${col}=[${ids.join(",")}]`);
					return { error: null };
				},
			}),
		}));

		const res = await deleteQuiz("quiz-locked");

		expect(res).toEqual({ success: true });
		expect(operations).toEqual([
			'update:quizzes:id=quiz-locked:{"locked_at":null}',
			'update:lesson_content_blocks:quiz_id=quiz-locked:{"quiz_id":null}',
			"delete:classroom_resources:resource_type=quiz&resource_id=quiz-locked",
			'update:courses:id=course-9:{"related_quizzes_ids":["quiz-2"]}',
			"delete:answers:quiz_attempt_id=[att-1]",
			"delete:answers:question_id=[q-1,q-2]",
			"delete:question_options:question_id=[q-1,q-2]",
			"delete:question_options:quiz_id=quiz-locked",
			"delete:questions:quiz_id=quiz-locked",
			"delete:quiz_attempts:quiz_id=quiz-locked",
			"delete:quizzes:id=quiz-locked",
		]);
		expect(mockRevalidatePath).toHaveBeenCalledWith("/d/admin/quizzes");
	});

	it("blocks unauthorized users in fallback mode before touching child rows", async () => {
		mockHasServiceRoleKey.mockReturnValue(true);
		mockRpc.mockImplementation(async (fn: string) => {
			if (fn === "delete_quiz_cascade") {
				return {
					data: null,
					error: { code: "PGRST202", message: "Could not find the function" },
				};
			}
			if (fn === "can_manage_quiz") {
				return { data: false, error: null };
			}
			return { data: null, error: null };
		});

		const res = await deleteQuiz("someone-elses-quiz");

		expect(res).toEqual({
			success: false,
			error: "Permission denied: cannot delete this quiz.",
		});
		expect(mockServiceFrom).not.toHaveBeenCalled();
	});

	it("rejects empty quizId immediately", async () => {
		const res = await deleteQuiz("   ");
		expect(res).toEqual({ success: false, error: "Quiz not found" });
		expect(mockRpc).not.toHaveBeenCalled();
	});
});
