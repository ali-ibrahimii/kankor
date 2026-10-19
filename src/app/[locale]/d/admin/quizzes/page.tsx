"use client";

import { CoursePagination } from "@/components/blocks/course";
import {
	QuizFilters,
	type QuizListItem,
	QuizzesView,
} from "@/components/blocks/quiz-builder";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { Tables } from "@/lib/supabase/database.types";

// ─── Row mapping ──────────────────────────────────────────────────────────────

type AdminQuizRow = Tables<"admin_quizzes_view">;

function toQuizListItem(row: AdminQuizRow): QuizListItem {
	return {
		id: row.id ?? "",
		title: row.title ?? "",
		entrance_code: row.entrance_code ?? "",
		time_limit_minutes: row.time_limit_minutes,
		max_attempts: row.max_attempts,
		passing_score_percentage: row.passing_score_percentage,
		show_correct_answers_after: row.show_correct_answers_after,
		shuffle_questions: row.shuffle_questions,
		created_at: row.created_at ?? "",
		question_count: row.question_count ?? 0,
		lesson_title: row.lesson_title,
		school_id: row.school_id,
	};
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminQuizzesPage() {
	// Admin sees every quiz on the platform — no owner/school scoping.
	const quizzesQuery = useQueryFilters<"admin_quizzes_view", AdminQuizRow[]>({
		table: "admin_quizzes_view",
		searchColumns: ["title", "entrance_code", "owner_name"],
		initialState: {
			name: "admin-quizzes",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const rows = ((quizzesQuery.data as any)?.data ?? []) as AdminQuizRow[];
	const quizzes: QuizListItem[] = rows.map(toQuizListItem);
	const total = (quizzesQuery.data as any)?.count ?? null;
	const page = quizzesQuery.state.pagination?.page ?? 1;
	const pageSize = quizzesQuery.state.pagination?.pageSize ?? 20;

	return (
		<QuizzesView
			quizzes={quizzes}
			omrBasePath="/d/admin"
			heading="Tests & Quizzes"
			description="View and manage all quizzes across the platform."
			filtersSlot={<QuizFilters queryState={quizzesQuery} />}
			// Stats above reflect only the current page, same trade-off already
			// accepted by /d/admin/decks — no separate aggregate RPC needed.
			footerSlot={
				<CoursePagination
					page={page}
					pageSize={pageSize}
					total={total}
					onPageChange={(p) => quizzesQuery.setPagination({ page: p })}
				/>
			}
		/>
	);
}
