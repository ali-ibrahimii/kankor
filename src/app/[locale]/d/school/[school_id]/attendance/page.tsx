import { getTranslations, setRequestLocale } from "next-intl/server";
import { SchoolAttendancePanel } from "@/components/blocks/school/school-attendance-panel";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

type Props = {
	params: Promise<BaseParams & { school_id: string }>;
};

export default async function SchoolAttendancePage({ params }: Props) {
	const { school_id, locale } = await params;
	setRequestLocale(locale);

	const [t, supabase] = await Promise.all([
		getTranslations("schoolAttendance"),
		createClient(),
	]);

	const { data: quizzes } = await supabase
		.from("quizzes")
		.select("id, title")
		.eq("school_id", school_id)
		.order("created_at", { ascending: false });

	const quizOptions = (quizzes ?? []).map((quiz) => ({
		id: quiz.id,
		title: quiz.title,
	}));

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			{quizOptions.length === 0 ? (
				<div className="rounded-2xl border border-border/70 bg-card p-10 text-center shadow-sm">
					<p className="text-sm font-medium">{t("noQuizzes")}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("noQuizzesHint")}
					</p>
				</div>
			) : (
				<SchoolAttendancePanel schoolId={school_id} quizOptions={quizOptions} />
			)}
		</div>
	);
}
