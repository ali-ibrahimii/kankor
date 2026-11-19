import { ArrowRight, Clock, ListChecks } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

async function fetchRegisteredQuizzes(userId: string) {
	const client = await createClient();
	const { data, error } = await client
		.from("quiz_registrations")
		.select(
			"id, created_at, quizzes(id, title, slug, description, time_limit_minutes)"
		)
		.eq("student_id", userId)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data ?? [];
}

export default async function RegisteredQuizzesPage() {
	const [t, locale, user] = await Promise.all([
		getTranslations("dashboard.student.registeredQuizzes"),
		getLocale(),
		getCurrentUser(),
	]);

	const dateFormatter = new Intl.DateTimeFormat(
		locale === "en" ? "en-US" : locale === "ps" ? "ps-AF" : "fa-AF",
		{ dateStyle: "medium" }
	);

	const registrations = user ? await fetchRegisteredQuizzes(user.id) : [];

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8">
			<div>
				<h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
				<p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
			</div>

			{registrations.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/70 px-6 py-20 text-center">
					<p className="text-sm font-semibold">{t("empty.title")}</p>
					<p className="text-xs text-muted-foreground">{t("empty.subtitle")}</p>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="mt-2 rounded-full"
					>
						<Link href="/d/tests/quiz">
							{t("browseTests")}
							<ArrowRight className="size-3.5 rtl:rotate-180" />
						</Link>
					</Button>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{registrations.map((registration) => {
						const quiz = registration.quizzes;
						if (!quiz) return null;

						return (
							<Card key={registration.id}>
								<CardContent className="flex items-start gap-3 p-4">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<ListChecks className="size-5" />
									</div>
									<div className="min-w-0 flex-1">
										{quiz.slug ? (
											<Link
												href={routes.quizzes.slug.page({ slug: quiz.slug })}
												className="text-sm font-semibold leading-snug hover:text-primary hover:underline"
											>
												{quiz.title}
											</Link>
										) : (
											<h3 className="text-sm font-semibold leading-snug">
												{quiz.title}
											</h3>
										)}
										{quiz.description && (
											<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
												{quiz.description}
											</p>
										)}
										<div className="mt-2 flex flex-wrap items-center gap-1.5">
											{quiz.time_limit_minutes != null && (
												<Badge variant="outline" className="gap-1 font-normal">
													<Clock className="size-3" />
													{t("timeLimitMinutes", {
														count: quiz.time_limit_minutes,
													})}
												</Badge>
											)}
											<span className="text-xs text-muted-foreground">
												{t("registeredOn", {
													date: dateFormatter.format(
														new Date(registration.created_at)
													),
												})}
											</span>
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
