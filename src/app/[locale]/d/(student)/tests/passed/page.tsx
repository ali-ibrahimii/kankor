import { CheckCircle2, ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

async function fetchPassedQuizzes(userId: string) {
	const client = await createClient();
	const { data, error } = await client
		.from("quiz_attempts")
		.select(
			"id, score, max_score_possible, completed_at, quizzes(id, title, description)"
		)
		.eq("user_id", userId)
		.eq("passed", true)
		.order("completed_at", { ascending: false });

	if (error) throw error;
	return data ?? [];
}

export default async function PassedQuizzesPage() {
	const [t, user] = await Promise.all([
		getTranslations("dashboard.student.passedQuizzes"),
		getCurrentUser(),
	]);

	const attempts = user ? await fetchPassedQuizzes(user.id) : [];

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			{attempts.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-20 text-center">
					<p className="text-sm font-medium">{t("empty.title")}</p>
					<p className="text-xs text-muted-foreground">{t("empty.subtitle")}</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{attempts.map((attempt) => {
						const quiz = attempt.quizzes;
						if (!quiz) return null;

						return (
							<Card key={attempt.id}>
								<CardContent className="flex items-start gap-3 p-4">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
										<CheckCircle2 className="size-5" />
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="text-sm font-semibold leading-snug">
											{quiz.title}
										</h3>
										{quiz.description && (
											<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
												{quiz.description}
											</p>
										)}
										<div className="mt-2 flex flex-wrap items-center gap-1.5">
											{attempt.score != null &&
												attempt.max_score_possible != null && (
													<Badge
														variant="outline"
														className="gap-1 font-normal"
													>
														<ClipboardList className="size-3" />
														{t("score", {
															score: attempt.score,
															max: attempt.max_score_possible,
														})}
													</Badge>
												)}
											{attempt.completed_at && (
												<span className="text-xs text-muted-foreground">
													{t("completedOn", {
														date: new Date(
															attempt.completed_at
														).toLocaleDateString(),
													})}
												</span>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
