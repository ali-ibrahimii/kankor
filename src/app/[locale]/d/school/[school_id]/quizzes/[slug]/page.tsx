"use client";

import { useParams } from "next/navigation";
import { QuizOmrDetail } from "@/components/blocks/quiz-omr";
import { decodeSlugParam } from "@/lib/utils";

export default function SchoolQuizOmrPage() {
	const params = useParams<{ school_id: string; slug: string }>();
	const slug = decodeSlugParam(params.slug);

	return (
		<QuizOmrDetail
			quizId={slug}
			backHref={`/d/school/${params.school_id}/quizzes`}
		/>
	);
}
