import { defaultQueryFn } from "@/hooks/filter/query-state-mapping";
import type { QueryFn } from "@/hooks/filter/types";
import type { PublicQuiz } from "./types";

// Never includes `entrance_code` — RLS allows anon to read public quiz rows,
// but the entrance code (and question content, via other tables) must stay
// out of any signed-out-accessible query.
export const PUBLIC_QUIZ_SELECT =
	"id, slug, title, description, instructions, time_limit_minutes, passing_score_percentage, max_attempts, created_at";

/** Quiz listing query scoped to public quizzes — safe for signed-out visitors. */
export const publicQuizzesQueryFn: QueryFn<"quizzes", PublicQuiz[]> = (
	client,
	table,
	state,
	single
) =>
	defaultQueryFn<"quizzes", PublicQuiz[]>(PUBLIC_QUIZ_SELECT, [
		"title",
		"description",
	])(
		client,
		table,
		{
			...state,
			filters: [
				...(state?.filters ?? []),
				{ field: "visibility", operator: "eq", value: "public" },
			],
		},
		single
	);
