import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isSupabaseServerConfigured } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";
import {
	type SubjectOption,
	type SubjectQuizItem,
	SubjectTestsClient,
} from "./subject-tests-client";

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({
		locale,
		namespace: "dashboard.student.subjectTests",
	});
	return {
		title: t("title"),
		description: t("description"),
	};
}

async function fetchSubjectTests(): Promise<{
	subjects: SubjectOption[];
	quizzes: SubjectQuizItem[];
}> {
	if (!isSupabaseServerConfigured) {
		return { subjects: [], quizzes: [] };
	}

	const supabase = await createClient();
	const [{ data: subjectsData }, { data: quizzesData }] = await Promise.all([
		supabase.from("subjects").select("id, name").order("name"),
		supabase
			.from("quizzes")
			.select(
				"id, slug, title, description, subject_id, time_limit_minutes, passing_score_percentage, is_free, price_credits, subject:subjects(name)"
			)
			.eq("visibility", "public")
			.not("subject_id", "is", null)
			.order("created_at", { ascending: false })
			.limit(60),
	]);

	const quizzes: SubjectQuizItem[] = (quizzesData ?? []).map((row) => {
		const sub = Array.isArray(row.subject) ? row.subject[0] : row.subject;
		return {
			id: row.id,
			slug: row.slug,
			title: row.title,
			description: row.description,
			subject_id: row.subject_id,
			subject_name: sub?.name ?? null,
			time_limit_minutes: row.time_limit_minutes,
			passing_score_percentage: row.passing_score_percentage,
			is_free: row.is_free,
			price_credits: row.price_credits,
		};
	});

	return {
		subjects: subjectsData ?? [],
		quizzes,
	};
}

export default async function StudentSubjectTestsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const { subjects, quizzes } = await fetchSubjectTests();
	return <SubjectTestsClient subjects={subjects} quizzes={quizzes} />;
}
