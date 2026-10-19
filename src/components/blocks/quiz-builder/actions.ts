"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { QuizDraft } from "./types";

export type SaveQuizResult =
	| { success: true; quizId: string }
	| { success: false; error: string };

export type LoadQuizResult =
	| { success: true; draft: QuizDraft }
	| { success: false; error: string };

export async function saveQuiz(draft: QuizDraft): Promise<SaveQuizResult> {
	const supabase = await createClient();

	try {
		const quizPayload = {
			title: draft.title,
			description: draft.description,
			instructions: draft.instructions,
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
			is_free: draft.is_free,
			price_credits: draft.is_free ? 0 : (draft.price_credits ?? 0),
			related_courses_ids: draft.related_courses_ids || [],
			related_decks_ids: draft.related_decks_ids || [],
			book_id: draft.book_id || null,
			subject_id: draft.subject_id || null,
			grade_id: draft.grade_id || null,
		};

		let quizId: string;

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
				.select("id")
				.single();
			if (error) throw new Error(error.message);
			quizId = data.id;
		} else {
			const { data, error } = await supabase
				.from("quizzes")
				.insert(quizPayload)
				.select("id")
				.single();
			if (error) throw new Error(error.message);
			quizId = data.id;
		}

		const deletedQuestions = draft.questions.filter(
			(q) => q._deleted && !q._isNew
		);
		const activeQuestions = draft.questions.filter((q) => !q._deleted);

		// Delete removed questions — options cascade via FK in Supabase, but to be safe delete options first
		for (const q of deletedQuestions) {
			await supabase.from("question_options").delete().eq("question_id", q.id);
			await supabase.from("questions").delete().eq("id", q.id);
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

			for (const o of deletedOptions) {
				await supabase.from("question_options").delete().eq("id", o.id);
			}

			for (const o of activeOptions) {
				const optionPayload = {
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

		revalidatePath("/dashboard");

		return { success: true, quizId };
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
		title: quiz.title,
		description: quiz.description,
		instructions: quiz.instructions,
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
	const supabase = await createClient();
	const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
	if (error) return { success: false, error: error.message };
	revalidatePath("/dashboard");
	return { success: true };
}
