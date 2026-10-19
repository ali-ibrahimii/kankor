"use client";

import { useParams } from "next/navigation";
import { QuizOmrDetail } from "@/components/blocks/quiz-omr";
import { decodeSlugParam } from "@/lib/utils";

export default function AgencyQuizOmrPage() {
	const params = useParams<{ agency_id: string; slug: string }>();
	const slug = decodeSlugParam(params.slug);

	return (
		<QuizOmrDetail
			quizId={slug}
			backHref={`/d/agency/${params.agency_id}/quizzes`}
		/>
	);
}
