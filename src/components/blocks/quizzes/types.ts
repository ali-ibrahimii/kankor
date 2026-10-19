// Public (signed-out-safe) quiz shape. Deliberately excludes `entrance_code`
// and any question content — RLS makes the `quizzes` row readable to anon,
// but the entrance code and question bank must never be exposed here.
export type PublicQuiz = {
	id: string;
	slug: string | null;
	title: string;
	description: string | null;
	instructions: string | null;
	time_limit_minutes: number | null;
	passing_score_percentage: number | null;
	max_attempts: number | null;
	created_at: string;
};
