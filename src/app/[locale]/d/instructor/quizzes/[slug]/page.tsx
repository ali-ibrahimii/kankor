"use client";

import { useParams } from "next/navigation";
import { QuizOmrDetail } from "@/components/blocks/quiz-omr";
import { decodeSlugParam } from "@/lib/utils";

export default function InstructorQuizOmrPage() {
	const params = useParams<{ slug: string }>();
	const slug = decodeSlugParam(params.slug);

	return <QuizOmrDetail quizId={slug} backHref="/d/instructor/quizzes" />;
}
