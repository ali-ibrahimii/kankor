import type { Database } from "@/lib/supabase/database.types";

export type QuestionType = Database["public"]["Enums"]["question_type"];
export type ShowCorrectAnswers =
	Database["public"]["Enums"]["show_correct_answers"];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
	multiple_choice_single_correct: "Multiple Choice (Single)",
	multiple_choice_multiple_correct: "Multiple Choice (Multiple)",
	true_false: "True / False",
	yes_no: "Yes / No",
	short_answer_text: "Short Answer",
	long_answer_text: "Long Answer",
	fill_in_the_blanks: "Fill in the Blanks",
	matching: "Matching",
	ordering: "Ordering",
	image_based_question: "Image Based",
};

export const QUESTION_TYPES_WITH_OPTIONS: QuestionType[] = [
	"multiple_choice_single_correct",
	"multiple_choice_multiple_correct",
	"true_false",
	"yes_no",
	"fill_in_the_blanks",
	"matching",
	"ordering",
	"image_based_question",
];

export const FIXED_OPTION_TYPES: QuestionType[] = ["true_false", "yes_no"];

export interface DraftOption {
	id: string;
	question_id: string | null;
	option_text: string | null;
	is_correct: boolean | null;
	order_index: number | null;
	feedback: string | null;
	match_target_text: string | null;
	_isNew?: boolean;
	_deleted?: boolean;
}

export interface DraftQuestion {
	id: string;
	quiz_id: string | null;
	question_text: string;
	question_type: QuestionType;
	order_index: number;
	points: number | null;
	hint: string | null;
	explanation: string | null;
	image_content_block_id: string | null;
	options: DraftOption[];
	_isNew?: boolean;
	_deleted?: boolean;
	_expanded?: boolean;
}

export interface QuizDraft {
	id?: string;
	title: string;
	description: string | null;
	instructions: string | null;
	lesson_id: string | null;
	school_id: string | null;
	/** When set, the quiz is agency-owned (attribution + `quizzes.manage_own` RLS). */
	agency_id: string | null;
	max_attempts: number | null;
	passing_score_percentage: number | null;
	show_correct_answers_after: ShowCorrectAnswers | null;
	shuffle_questions: boolean | null;
	time_limit_minutes: number | null;
	is_free: boolean;
	price_credits: number;
	questions: DraftQuestion[];
	related_courses_ids?: string[];
	related_decks_ids?: string[];
	book_id?: string | null;
	subject_id?: string | null;
	grade_id?: string | null;
}

export function createEmptyOption(
	questionId: string | null,
	index: number
): DraftOption {
	return {
		id: crypto.randomUUID(),
		question_id: questionId,
		option_text: "",
		is_correct: false,
		order_index: index,
		feedback: null,
		match_target_text: null,
		_isNew: true,
	};
}

export function createEmptyQuestion(
	quizId: string | null,
	index: number
): DraftQuestion {
	return {
		id: crypto.randomUUID(),
		quiz_id: quizId,
		question_text: "",
		question_type: "multiple_choice_single_correct",
		order_index: index,
		points: 1,
		hint: null,
		explanation: null,
		image_content_block_id: null,
		options: [createEmptyOption(null, 0), createEmptyOption(null, 1)],
		_isNew: true,
		_expanded: true,
	};
}

export function createDefaultOptionsForType(type: QuestionType): DraftOption[] {
	if (type === "true_false") {
		return [
			{
				id: crypto.randomUUID(),
				question_id: null,
				option_text: "True",
				is_correct: false,
				order_index: 0,
				feedback: null,
				match_target_text: null,
				_isNew: true,
			},
			{
				id: crypto.randomUUID(),
				question_id: null,
				option_text: "False",
				is_correct: false,
				order_index: 1,
				feedback: null,
				match_target_text: null,
				_isNew: true,
			},
		];
	}
	if (type === "yes_no") {
		return [
			{
				id: crypto.randomUUID(),
				question_id: null,
				option_text: "Yes",
				is_correct: false,
				order_index: 0,
				feedback: null,
				match_target_text: null,
				_isNew: true,
			},
			{
				id: crypto.randomUUID(),
				question_id: null,
				option_text: "No",
				is_correct: false,
				order_index: 1,
				feedback: null,
				match_target_text: null,
				_isNew: true,
			},
		];
	}
	if (type === "matching") {
		return [
			{
				id: crypto.randomUUID(),
				question_id: null,
				option_text: "",
				is_correct: true,
				order_index: 0,
				feedback: null,
				match_target_text: "",
				_isNew: true,
			},
			{
				id: crypto.randomUUID(),
				question_id: null,
				option_text: "",
				is_correct: true,
				order_index: 1,
				feedback: null,
				match_target_text: "",
				_isNew: true,
			},
		];
	}
	if (type === "fill_in_the_blanks") {
		return [
			{
				id: crypto.randomUUID(),
				question_id: null,
				option_text: "",
				is_correct: true,
				order_index: 0,
				feedback: null,
				match_target_text: null,
				_isNew: true,
			},
		];
	}
	if (type === "short_answer_text" || type === "long_answer_text") {
		return [];
	}
	return [
		{
			id: crypto.randomUUID(),
			question_id: null,
			option_text: "",
			is_correct: false,
			order_index: 0,
			feedback: null,
			match_target_text: null,
			_isNew: true,
		},
		{
			id: crypto.randomUUID(),
			question_id: null,
			option_text: "",
			is_correct: false,
			order_index: 1,
			feedback: null,
			match_target_text: null,
			_isNew: true,
		},
	];
}

export function createEmptyQuizDraft(
	schoolId?: string,
	lessonId?: string,
	agencyId?: string
): QuizDraft {
	return {
		title: "",
		description: null,
		instructions: null,
		lesson_id: lessonId ?? null,
		school_id: schoolId ?? null,
		agency_id: agencyId ?? null,
		max_attempts: null,
		passing_score_percentage: 70,
		show_correct_answers_after: "attempt",
		shuffle_questions: false,
		time_limit_minutes: null,
		is_free: true,
		price_credits: 0,
		questions: [],
	};
}

// ── Settings form types ────────────────────────────────────────────────────
// Flat form values managed by useAppForm (strings for numeric inputs)

export type QuizSettingsValues = {
	title: string;
	description: string;
	instructions: string;
	time_limit_minutes: string;
	max_attempts: string;
	passing_score_percentage: string;
	show_correct_answers_after: string;
	shuffle_questions: boolean;
	is_free: boolean;
	price_credits: string;
	related_courses_ids: string[];
	related_decks_ids: string[];
	book_id: string | null;
	subject_id: string | null;
	grade_id: string | null;
};

export function quizDraftToFormValues(draft?: QuizDraft): QuizSettingsValues {
	return {
		title: draft?.title ?? "",
		description: draft?.description ?? "",
		instructions: draft?.instructions ?? "",
		time_limit_minutes: draft?.time_limit_minutes?.toString() ?? "",
		max_attempts: draft?.max_attempts?.toString() ?? "",
		passing_score_percentage:
			draft?.passing_score_percentage?.toString() ?? "70",
		show_correct_answers_after: draft?.show_correct_answers_after ?? "attempt",
		shuffle_questions: draft?.shuffle_questions ?? false,
		is_free: draft?.is_free ?? true,
		price_credits: draft?.price_credits ? String(draft.price_credits) : "",
		related_courses_ids: draft?.related_courses_ids || [],
		related_decks_ids: draft?.related_decks_ids || [],
		book_id: draft?.book_id || null,
		subject_id: draft?.subject_id || null,
		grade_id: draft?.grade_id || null,
	};
}

export function formValuesToQuizPatch(
	values: QuizSettingsValues
): Omit<
	QuizDraft,
	"id" | "lesson_id" | "school_id" | "agency_id" | "questions"
> {
	return {
		title: values.title,
		description: values.description || null,
		instructions: values.instructions || null,
		time_limit_minutes: values.time_limit_minutes
			? Number(values.time_limit_minutes)
			: null,
		max_attempts: values.max_attempts ? Number(values.max_attempts) : null,
		passing_score_percentage: values.passing_score_percentage
			? Number(values.passing_score_percentage)
			: null,
		show_correct_answers_after:
			(values.show_correct_answers_after as ShowCorrectAnswers) || null,
		shuffle_questions: values.shuffle_questions,
		is_free: values.is_free,
		price_credits: values.is_free
			? 0
			: values.price_credits
				? Number(values.price_credits)
				: 0,
		related_courses_ids: values.related_courses_ids || [],
		related_decks_ids: values.related_decks_ids || [],
		book_id: values.book_id || null,
		subject_id: values.subject_id || null,
		grade_id: values.grade_id || null,
	};
}
