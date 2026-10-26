/**
 * Data + grading for the Kankor mock exam.
 *
 * Wording (question stems, options and explanations) lives in
 * `src/messages/<locale>.json` under `content.kankorExam`; this module only
 * knows the structure, the ordering and the maths.
 */

export const EXAM_SUBJECTS = [
	"math",
	"physics",
	"chemistry",
	"biology",
	"dari",
	"pashto",
	"english",
	"islamic",
] as const;

export type ExamSubjectId = (typeof EXAM_SUBJECTS)[number];

/** 24 minutes for 16 questions — the same 1.5 minutes per question as Kankor. */
export const EXAM_MINUTES = 24;

/** Answers a candidate picked: question id → option index. */
export type ExamAnswers = Record<string, number>;

export type ExamQuestion = {
	id: string;
	subject: ExamSubjectId;
	stem: string;
	options: string[];
	correct: number;
	explanation: string;
};

export type ExamSection = {
	id: ExamSubjectId;
	questions: ExamQuestion[];
};

export type KankorExam = {
	questions: ExamQuestion[];
	sections: ExamSection[];
	minutes: number;
};

export type RawQuestion = {
	id?: string;
	subject?: string;
	stem?: string;
	options?: unknown;
	correct?: number;
	explanation?: string;
};

function isSubject(value: string): value is ExamSubjectId {
	return (EXAM_SUBJECTS as readonly string[]).includes(value);
}

/**
 * Turns the localised question list from the messages into an exam, dropping
 * anything malformed instead of rendering a broken question, and ordering it by
 * subject the way the paper is laid out.
 */
export function buildKankorExam(
	raw: unknown,
	minutes: number = EXAM_MINUTES
): KankorExam {
	const list = Array.isArray(raw) ? (raw as RawQuestion[]) : [];

	const questions: ExamQuestion[] = list.flatMap((item, index) => {
		const options = Array.isArray(item.options)
			? item.options.map((option) => String(option))
			: [];
		if (
			!item.stem ||
			options.length < 2 ||
			typeof item.correct !== "number" ||
			item.correct < 0 ||
			item.correct >= options.length ||
			!item.subject ||
			!isSubject(item.subject)
		) {
			return [];
		}

		return [
			{
				id: item.id ?? `${item.subject}-${index}`,
				subject: item.subject,
				stem: item.stem,
				options,
				correct: item.correct,
				explanation: item.explanation ?? "",
			},
		];
	});

	const sections: ExamSection[] = EXAM_SUBJECTS.map((subject) => ({
		id: subject,
		questions: questions.filter((question) => question.subject === subject),
	})).filter((section) => section.questions.length > 0);

	return {
		questions: sections.flatMap((section) => section.questions),
		sections,
		minutes,
	};
}

export type SubjectResult = {
	id: ExamSubjectId;
	total: number;
	correct: number;
	wrong: number;
	blank: number;
	percent: number;
};

export type ExamResult = {
	total: number;
	answered: number;
	correct: number;
	wrong: number;
	blank: number;
	percent: number;
	perSubject: SubjectResult[];
};

export function gradeExam(exam: KankorExam, answers: ExamAnswers): ExamResult {
	let correct = 0;
	let wrong = 0;
	let blank = 0;

	const perSubject: SubjectResult[] = exam.sections.map((section) => {
		let sectionCorrect = 0;
		let sectionWrong = 0;
		let sectionBlank = 0;

		for (const question of section.questions) {
			const picked = answers[question.id];
			if (picked === undefined || picked === null) {
				sectionBlank += 1;
			} else if (picked === question.correct) {
				sectionCorrect += 1;
			} else {
				sectionWrong += 1;
			}
		}

		correct += sectionCorrect;
		wrong += sectionWrong;
		blank += sectionBlank;

		return {
			id: section.id,
			total: section.questions.length,
			correct: sectionCorrect,
			wrong: sectionWrong,
			blank: sectionBlank,
			percent:
				section.questions.length > 0
					? Math.round((sectionCorrect / section.questions.length) * 100)
					: 0,
		};
	});

	const total = exam.questions.length;

	return {
		total,
		answered: correct + wrong,
		correct,
		wrong,
		blank,
		percent: total > 0 ? Math.round((correct / total) * 100) : 0,
		perSubject,
	};
}

export type ScoreBand = "weak" | "average" | "good" | "excellent";

export function scoreBand(percent: number): ScoreBand {
	if (percent >= 80) return "excellent";
	if (percent >= 60) return "good";
	if (percent >= 40) return "average";
	return "weak";
}
