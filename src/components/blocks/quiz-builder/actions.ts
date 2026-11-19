"use server";

import { revalidatePath } from "next/cache";
import {
	createClient,
	createServiceRoleClient,
	hasServiceRoleKey,
} from "@/lib/supabase/server";
import type { ManageableCourseOption, QuizDraft } from "./types";

function isMissingRpcError(error: {
	code?: string | null;
	message?: string | null;
}): boolean {
	if (error.code === "PGRST202" || error.code === "42883") {
		return true;
	}
	const message = error.message ?? "";
	return /could not find the function|function .* does not exist/i.test(
		message
	);
}

function revalidateQuizPaths() {
	revalidatePath("/dashboard");
	revalidatePath("/d", "layout");
	revalidatePath("/d/admin/quizzes");
	revalidatePath("/d/instructor/quizzes");
	revalidatePath("/quizzes");
}

export type SaveQuizResult =
	| { success: true; quizId: string; entranceCode?: string }
	| { success: false; error: string };

export type LoadQuizResult =
	| { success: true; draft: QuizDraft }
	| { success: false; error: string };

export async function saveQuiz(draft: QuizDraft): Promise<SaveQuizResult> {
	const supabase = await createClient();

	try {
		const visibility = draft.visibility ?? "public";
		const isCourseOnly = visibility === "private";
		const courseId = isCourseOnly ? draft.course_id || null : null;

		if (courseId) {
			const { data: canEditCourse, error: permError } = await supabase.rpc(
				"can_edit_course_content",
				{ p_course_id: courseId }
			);
			if (permError || !canEditCourse) {
				throw new Error("Permission denied for the selected course");
			}
		}

		const isFree = isCourseOnly ? true : draft.is_free;

		const quizPayload = {
			title: draft.title,
			description: draft.description,
			instructions: draft.instructions,
			visibility,
			course_id: courseId,
			lesson_id: draft.lesson_id,
			school_id: draft.school_id,
			// Agency ownership — safe to take from the client: the restrictive
			// "attribution requires the agency grant" RLS policy rejects any
			// agency_id the caller doesn't hold quizzes.manage_own for.
			agency_id: draft.agency_id ?? null,
			max_attempts: draft.max_attempts,
			passing_score_percentage: draft.passing_score_percentage,
			show_correct_answers_after: draft.show_correct_answers_after,
			shuffle_questions: draft.shuffle_questions ?? false,
			time_limit_minutes: draft.time_limit_minutes,
			is_free: isFree,
			price_credits: isFree ? 0 : (draft.price_credits ?? 0),
			related_courses_ids: draft.related_courses_ids || [],
			related_decks_ids: draft.related_decks_ids || [],
			book_id: draft.book_id || null,
			subject_id: draft.subject_id || null,
			grade_id: draft.grade_id || null,
		};

		let quizId: string;
		let entranceCode: string | undefined;

		if (!draft.id && !draft.school_id) {
			// Standalone (non-school-scoped) quiz: ownership is the creating
			// instructor. Derived server-side, never trusted from client input,
			// since RLS requires quizzes.user_id = auth.uid() for this case
			// (is_school_editor(null school_id) won't authorize it otherwise).
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");
			(quizPayload as Record<string, unknown>).user_id = user.id;
		}

		if (draft.id) {
			const { data, error } = await supabase
				.from("quizzes")
				.update(quizPayload)
				.eq("id", draft.id)
				.select("id, entrance_code")
				.single();
			if (error) throw new Error(error.message);
			quizId = data.id;
			entranceCode = data.entrance_code;
		} else {
			const { data, error } = await supabase
				.from("quizzes")
				.insert(quizPayload)
				.select("id, entrance_code")
				.single();
			if (error) throw new Error(error.message);
			quizId = data.id;
			entranceCode = data.entrance_code;
		}

		const deletedQuestions = draft.questions.filter(
			(q) => q._deleted && !q._isNew
		);
		const activeQuestions = draft.questions.filter((q) => !q._deleted);

		// Delete removed questions (scoped to this quiz) and dependent answers/options first
		if (deletedQuestions.length > 0) {
			const candidateIds = deletedQuestions.map((q) => q.id);
			const { data: ownedQuestions, error: ownedError } = await supabase
				.from("questions")
				.select("id")
				.eq("quiz_id", quizId)
				.in("id", candidateIds);
			if (ownedError) throw new Error(ownedError.message);

			const deletedQuestionIds = (ownedQuestions ?? []).map((q) => q.id);
			if (deletedQuestionIds.length > 0) {
				const deleteDb = hasServiceRoleKey()
					? createServiceRoleClient()
					: supabase;

				const { error: delAnswersError } = await deleteDb
					.from("answers")
					.delete()
					.in("question_id", deletedQuestionIds);
				if (delAnswersError) throw new Error(delAnswersError.message);

				const { error: delOptionsError } = await deleteDb
					.from("question_options")
					.delete()
					.in("question_id", deletedQuestionIds);
				if (delOptionsError) throw new Error(delOptionsError.message);

				const { error: delQuestionsError } = await deleteDb
					.from("questions")
					.delete()
					.eq("quiz_id", quizId)
					.in("id", deletedQuestionIds);
				if (delQuestionsError) throw new Error(delQuestionsError.message);
			}
		}

		for (const q of activeQuestions) {
			const questionPayload = {
				quiz_id: quizId,
				question_text: q.question_text,
				question_type: q.question_type,
				order_index: q.order_index,
				points: q.points,
				hint: q.hint,
				explanation: q.explanation,
				image_content_block_id: q.image_content_block_id,
			};

			let questionId: string;

			if (q._isNew) {
				const { data, error } = await supabase
					.from("questions")
					.insert(questionPayload)
					.select("id")
					.single();
				if (error) throw new Error(error.message);
				questionId = data.id;
			} else {
				const { data, error } = await supabase
					.from("questions")
					.update(questionPayload)
					.eq("id", q.id)
					.select("id")
					.single();
				if (error) throw new Error(error.message);
				questionId = data.id;
			}

			const deletedOptions = q.options.filter((o) => o._deleted && !o._isNew);
			const activeOptions = q.options.filter((o) => !o._deleted);

			if (deletedOptions.length > 0) {
				const { error: delOptError } = await supabase
					.from("question_options")
					.delete()
					.eq("question_id", questionId)
					.in(
						"id",
						deletedOptions.map((o) => o.id)
					);
				if (delOptError) throw new Error(delOptError.message);
			}

			for (const o of activeOptions) {
				const optionPayload = {
					quiz_id: quizId,
					question_id: questionId,
					option_text: o.option_text,
					is_correct: o.is_correct ?? false,
					order_index: o.order_index ?? 0,
					feedback: o.feedback,
					match_target_text: o.match_target_text,
				};

				if (o._isNew) {
					const { error } = await supabase
						.from("question_options")
						.insert(optionPayload);
					if (error) throw new Error(error.message);
				} else {
					const { error } = await supabase
						.from("question_options")
						.update(optionPayload)
						.eq("id", o.id);
					if (error) throw new Error(error.message);
				}
			}
		}

		revalidateQuizPaths();

		return { success: true, quizId, entranceCode };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

export async function loadQuizForEditing(
	quizId: string
): Promise<LoadQuizResult> {
	const supabase = await createClient();

	const { data: quiz, error: quizError } = await supabase
		.from("quizzes")
		.select("*")
		.eq("id", quizId)
		.single();

	if (quizError || !quiz) {
		return { success: false, error: quizError?.message ?? "Quiz not found" };
	}

	const { data: questions, error: questionsError } = await supabase
		.from("questions")
		.select("*, question_options(*)")
		.eq("quiz_id", quizId)
		.order("order_index");

	if (questionsError) {
		return { success: false, error: questionsError.message };
	}

	const draft: QuizDraft = {
		id: quiz.id,
		entrance_code: quiz.entrance_code,
		title: quiz.title,
		description: quiz.description,
		instructions: quiz.instructions,
		visibility: quiz.visibility,
		course_id: quiz.course_id,
		lesson_id: quiz.lesson_id,
		school_id: quiz.school_id,
		agency_id: quiz.agency_id,
		max_attempts: quiz.max_attempts,
		passing_score_percentage: quiz.passing_score_percentage,
		show_correct_answers_after: quiz.show_correct_answers_after,
		shuffle_questions: quiz.shuffle_questions,
		time_limit_minutes: quiz.time_limit_minutes,
		is_free: quiz.is_free,
		price_credits: quiz.price_credits,
		related_courses_ids: quiz.related_courses_ids || [],
		related_decks_ids: quiz.related_decks_ids || [],
		book_id: quiz.book_id,
		subject_id: quiz.subject_id,
		grade_id: quiz.grade_id,
		questions: (questions ?? []).map((q) => ({
			id: q.id,
			quiz_id: q.quiz_id,
			question_text: q.question_text,
			question_type: q.question_type,
			order_index: q.order_index,
			points: q.points,
			hint: q.hint,
			explanation: q.explanation,
			image_content_block_id: q.image_content_block_id,
			options: (
				(q as { question_options?: unknown[] }).question_options ?? []
			).map((o) => {
				const opt = o as {
					id: string;
					question_id: string | null;
					option_text: string | null;
					is_correct: boolean | null;
					order_index: number | null;
					feedback: string | null;
					match_target_text: string | null;
				};
				return {
					id: opt.id,
					question_id: opt.question_id,
					option_text: opt.option_text,
					is_correct: opt.is_correct,
					order_index: opt.order_index,
					feedback: opt.feedback,
					match_target_text: opt.match_target_text,
				};
			}),
		})),
	};

	return { success: true, draft };
}

export async function deleteQuiz(
	quizId: string
): Promise<{ success: boolean; error?: string }> {
	if (!quizId?.trim()) {
		return { success: false, error: "Quiz not found" };
	}

	const supabase = await createClient();

	// Preferred path: atomic, authorized RPC with cascading FK + soft-ref cleanup.
	const { error: rpcError } = await supabase.rpc("delete_quiz_cascade", {
		p_quiz_id: quizId,
	});

	if (!rpcError) {
		revalidateQuizPaths();
		return { success: true };
	}

	if (!isMissingRpcError(rpcError)) {
		return { success: false, error: rpcError.message };
	}

	// Fallback when the `delete_quiz_cascade` migration has not yet been applied:
	// verify caller permission first, then delete dependent child rows in FK order.
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "Not authenticated" };
	}

	const { data: canManage, error: permError } = await supabase.rpc(
		"can_manage_quiz",
		{
			p_quiz_id: quizId,
			p_user_id: user.id,
		}
	);
	if (permError || !canManage) {
		return {
			success: false,
			error:
				permError?.message ?? "Permission denied: cannot delete this quiz.",
		};
	}

	const db = hasServiceRoleKey() ? createServiceRoleClient() : supabase;

	const { data: quiz, error: quizLookupError } = await db
		.from("quizzes")
		.select("id, locked_at")
		.eq("id", quizId)
		.maybeSingle();
	if (quizLookupError) {
		return { success: false, error: quizLookupError.message };
	}
	if (!quiz) {
		return { success: false, error: "Quiz not found" };
	}

	// Clear OMR print lock so `prevent_edit_when_quiz_locked` allows child removal.
	if (quiz.locked_at) {
		const { error: unlockError } = await db
			.from("quizzes")
			.update({ locked_at: null })
			.eq("id", quizId);
		if (unlockError) {
			return { success: false, error: unlockError.message };
		}
	}

	// Detach course content blocks and polymorphic links before deleting the quiz.
	const { error: detachBlockError } = await db
		.from("lesson_content_blocks")
		.update({ quiz_id: null })
		.eq("quiz_id", quizId);
	if (detachBlockError && detachBlockError.code !== "42703") {
		return { success: false, error: detachBlockError.message };
	}

	await db
		.from("classroom_resources")
		.delete()
		.eq("resource_type", "quiz")
		.eq("resource_id", quizId);

	const { data: relatedCourses } = await db
		.from("courses")
		.select("id, related_quizzes_ids")
		.contains("related_quizzes_ids", [quizId]);
	if (relatedCourses?.length) {
		for (const course of relatedCourses) {
			await db
				.from("courses")
				.update({
					related_quizzes_ids: (course.related_quizzes_ids ?? []).filter(
						(id) => id !== quizId
					),
				})
				.eq("id", course.id);
		}
	}

	const [
		{ data: questions, error: questionsError },
		{ data: attempts, error: attemptsError },
	] = await Promise.all([
		db.from("questions").select("id").eq("quiz_id", quizId),
		db.from("quiz_attempts").select("id").eq("quiz_id", quizId),
	]);
	if (questionsError) {
		return { success: false, error: questionsError.message };
	}
	if (attemptsError) {
		return { success: false, error: attemptsError.message };
	}

	const questionIds = (questions ?? []).map((q) => q.id);
	const attemptIds = (attempts ?? []).map((a) => a.id);

	if (attemptIds.length > 0) {
		const { error } = await db
			.from("answers")
			.delete()
			.in("quiz_attempt_id", attemptIds);
		if (error) return { success: false, error: error.message };
	}

	if (questionIds.length > 0) {
		const { error: ansByQuestionError } = await db
			.from("answers")
			.delete()
			.in("question_id", questionIds);
		if (ansByQuestionError) {
			return { success: false, error: ansByQuestionError.message };
		}

		const { error: optByQuestionError } = await db
			.from("question_options")
			.delete()
			.in("question_id", questionIds);
		if (optByQuestionError) {
			return { success: false, error: optByQuestionError.message };
		}
	}

	const { error: optByQuizError } = await db
		.from("question_options")
		.delete()
		.eq("quiz_id", quizId);
	if (optByQuizError) {
		return { success: false, error: optByQuizError.message };
	}

	if (questionIds.length > 0) {
		const { error: delQuestionsError } = await db
			.from("questions")
			.delete()
			.eq("quiz_id", quizId);
		if (delQuestionsError) {
			return { success: false, error: delQuestionsError.message };
		}
	}

	if (attemptIds.length > 0) {
		const { error: delAttemptsError } = await db
			.from("quiz_attempts")
			.delete()
			.eq("quiz_id", quizId);
		if (delAttemptsError) {
			return { success: false, error: delAttemptsError.message };
		}
	}

	const { error: deleteError } = await db
		.from("quizzes")
		.delete()
		.eq("id", quizId);
	if (deleteError) {
		return { success: false, error: deleteError.message };
	}

	revalidateQuizPaths();
	return { success: true };
}

export async function listManageableCoursesForQuiz(scope?: {
	schoolId?: string | null;
	agencyId?: string | null;
}): Promise<ManageableCourseOption[]> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return [];

	if (scope?.schoolId) {
		const { data } = await supabase
			.from("courses")
			.select("id, title, is_published")
			.eq("school_id", scope.schoolId)
			.order("updated_at", { ascending: false })
			.limit(200);
		return data ?? [];
	}

	if (scope?.agencyId) {
		const { data } = await supabase
			.from("courses")
			.select("id, title, is_published")
			.eq("agency_id", scope.agencyId)
			.order("updated_at", { ascending: false })
			.limit(200);
		return data ?? [];
	}

	const { data: isAdmin } = await supabase.rpc("is_admin", {
		user_id: user.id,
	});

	let query = supabase
		.from("courses")
		.select("id, title, is_published")
		.order("updated_at", { ascending: false })
		.limit(200);

	if (!isAdmin) {
		query = query.eq("instructor_id", user.id);
	}

	const { data } = await query;
	return data ?? [];
}
