import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	type QuizListItem,
	QuizzesView,
} from "@/components/blocks/quiz-builder";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

type Props = {
	params: Promise<BaseParams & { agency_id: string }>;
};

export default async function AgencyQuizzesPage({ params }: Props) {
	const { locale, agency_id } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const [t, { data: rows }] = await Promise.all([
		getTranslations("dashboard.agency.resources"),
		supabase
			.from("quizzes")
			.select(
				"id, title, entrance_code, time_limit_minutes, max_attempts, passing_score_percentage, show_correct_answers_after, shuffle_questions, created_at, school_id, lesson_id, lessons(title), questions(count)"
			)
			.eq("agency_id", agency_id)
			.order("created_at", { ascending: false }),
	]);

	const quizzes: QuizListItem[] = (rows ?? []).map((row) => {
		const countArr = row.questions as unknown as { count: number }[] | null;
		const lesson = row.lessons as unknown as { title: string } | null;
		return {
			id: row.id,
			title: row.title,
			entrance_code: row.entrance_code,
			time_limit_minutes: row.time_limit_minutes,
			max_attempts: row.max_attempts,
			passing_score_percentage: row.passing_score_percentage,
			show_correct_answers_after: row.show_correct_answers_after,
			shuffle_questions: row.shuffle_questions,
			created_at: row.created_at,
			question_count: countArr?.[0]?.count ?? 0,
			lesson_title: lesson?.title ?? null,
			school_id: row.school_id,
		};
	});

	return (
		<QuizzesView
			quizzes={quizzes}
			agencyId={agency_id}
			omrBasePath={`/d/agency/${agency_id}`}
			heading={t("quizzesTitle")}
			description={t("quizzesSubtitle")}
		/>
	);
}
