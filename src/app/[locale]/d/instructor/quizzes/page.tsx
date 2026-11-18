import { getTranslations } from "next-intl/server";
import {
	type QuizListItem,
	QuizzesView,
} from "@/components/blocks/quiz-builder";
import { createClient } from "@/lib/supabase/server";

export default async function InstructorQuizzesPage() {
	const supabase = await createClient();
	const t = await getTranslations("quizBuilder");
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Fetch courses taught by this instructor, plus their lesson IDs
	const { data: instructorCourses } = await supabase
		.from("courses")
		.select("id")
		.eq("instructor_id", user?.id ?? "");
	const courseIds = instructorCourses?.map((c) => c.id) ?? [];

	const { data: lessonRows } =
		courseIds.length > 0
			? await supabase.from("lessons").select("id").in("course_id", courseIds)
			: { data: [] as { id: string }[] };

	const lessonIds = lessonRows?.map((l) => l.id) ?? [];

	// Fetch quizzes linked to those courses/lessons, plus standalone quizzes this
	// instructor owns directly (quizzes.user_id).
	const orFilters = [
		`user_id.eq.${user?.id ?? "00000000-0000-0000-0000-000000000000"}`,
	];
	if (courseIds.length > 0) {
		orFilters.push(`course_id.in.(${courseIds.join(",")})`);
	}
	if (lessonIds.length > 0) {
		orFilters.push(`lesson_id.in.(${lessonIds.join(",")})`);
	}

	const { data: rows } = await supabase
		.from("quizzes")
		.select(
			"id, title, slug, entrance_code, visibility, time_limit_minutes, max_attempts, passing_score_percentage, show_correct_answers_after, shuffle_questions, created_at, school_id, course_id, lesson_id, courses(title), lessons(title), questions(count)"
		)
		.or(orFilters.join(","))
		.order("created_at", { ascending: false });

	const quizzes: QuizListItem[] = (rows ?? []).map((row) => {
		const countArr = row.questions as unknown as { count: number }[];
		const lesson = row.lessons as unknown as { title: string } | null;
		const course = row.courses as unknown as { title: string } | null;
		return {
			id: row.id,
			title: row.title,
			slug: row.slug,
			entrance_code: row.entrance_code,
			visibility: row.visibility,
			time_limit_minutes: row.time_limit_minutes,
			max_attempts: row.max_attempts,
			passing_score_percentage: row.passing_score_percentage,
			show_correct_answers_after: row.show_correct_answers_after,
			shuffle_questions: row.shuffle_questions,
			created_at: row.created_at,
			question_count: countArr?.[0]?.count ?? 0,
			lesson_title: lesson?.title ?? null,
			course_title: course?.title ?? null,
			school_id: row.school_id,
		};
	});

	return (
		<QuizzesView
			quizzes={quizzes}
			heading={t("title")}
			description={t("description")}
		/>
	);
}
