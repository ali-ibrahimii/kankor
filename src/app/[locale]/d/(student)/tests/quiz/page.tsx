import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isSupabaseServerConfigured } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";
import {
	type PracticeQuizItem,
	PracticeQuizzesClient,
} from "./practice-quizzes-client";

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({
		locale,
		namespace: "dashboard.student.practiceQuizzes",
	});
	return {
		title: t("title"),
		description: t("description"),
	};
}

async function fetchPracticeQuizzes(): Promise<PracticeQuizItem[]> {
	if (!isSupabaseServerConfigured) {
		return [];
	}

	const supabase = await createClient();
	const { data } = await supabase
		.from("quizzes")
		.select(
			"id, slug, title, description, time_limit_minutes, passing_score_percentage, is_free, price_credits, subject:subjects(name)"
		)
		.eq("visibility", "public")
		.order("created_at", { ascending: false })
		.limit(60);

	return (data ?? []).map((row) => {
		const sub = Array.isArray(row.subject) ? row.subject[0] : row.subject;
		return {
			id: row.id,
			slug: row.slug,
			title: row.title,
			description: row.description,
			subject_name: sub?.name ?? null,
			time_limit_minutes: row.time_limit_minutes,
			passing_score_percentage: row.passing_score_percentage,
			is_free: row.is_free,
			price_credits: row.price_credits,
		};
	});
}

export default async function StudentPracticeQuizzesPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const quizzes = await fetchPracticeQuizzes();
	return <PracticeQuizzesClient quizzes={quizzes} />;
}
