import {
	BookOpen,
	CheckCircle2,
	FileCheck,
	FilePlus,
	Star,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/widgets/stat-card";
import { TrendChart } from "@/components/widgets/trend-chart";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { InstructorDashboardOverview } from "@/types/queries.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getOverview(): Promise<InstructorDashboardOverview | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.rpc("get_instructor_dashboard_overview")
		.single();
	if (error) throw error;
	return data as unknown as InstructorDashboardOverview;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstructorDashboardPage() {
	const [t, overview] = await Promise.all([
		getTranslations("overview.instructor"),
		getOverview(),
	]);

	const stats = [
		{
			label: t("stats.publishedCourses"),
			value: overview?.published_courses_count ?? 0,
			icon: BookOpen,
			color: "text-blue-600",
		},
		{
			label: t("stats.draftCourses"),
			value: overview?.draft_courses_count ?? 0,
			icon: FilePlus,
			color: "text-amber-500",
		},
		{
			label: t("stats.totalStudents"),
			value: overview?.total_students_count ?? 0,
			icon: Users,
			color: "text-violet-600",
		},
		{
			label: t("stats.averageRating"),
			value: overview?.average_rating ?? "—",
			icon: Star,
			color: "text-amber-500",
		},
		{
			label: t("stats.totalEarnings"),
			value: overview?.total_earnings_credits ?? 0,
			icon: Wallet,
			color: "text-[#1461B8]",
		},
		{
			label: t("stats.earningsThisMonth"),
			value: overview?.earnings_this_month_credits ?? 0,
			icon: Wallet,
			color: "text-emerald-600",
		},
	];

	const recentEnrollments = overview?.recent_enrollments ?? [];
	const recentQuizAttempts = overview?.recent_quiz_attempts ?? [];
	const earningsTrend = (overview?.earnings_trend ?? []).map((point) => ({
		date: point.date,
		value: point.credits ?? 0,
	}));

	return (
		<div className="space-y-6 p-6">
			{/* ── Stats row ───────────────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>

			{/* ── Earnings trend chart ─────────────────────────────────────────────── */}
			<TrendChart
				title={t("earningsTrend")}
				data={earningsTrend}
				valueLabel={t("earningsTrendSubtitle")}
				color="var(--color-chart-2, #1461B8)"
			/>

			{/* ── Bottom two-column section ────────────────────────────────────────── */}
			<div className="grid gap-6 lg:grid-cols-5">
				{/* Recent enrollments — wider */}
				<div className="lg:col-span-3">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
							{t("recentEnrollments")}
						</h2>
						<Link
							href={routes.d.instructor.courses.page()}
							className="text-xs text-[#1461B8] hover:underline"
						>
							{t("viewAll")}
						</Link>
					</div>
					<Card>
						<CardContent className="divide-y px-0 pb-0 pt-0">
							{recentEnrollments.length === 0 ? (
								<div className="flex flex-col items-center gap-1 py-10 text-center">
									<p className="text-sm font-medium">
										{t("noRecentEnrollments")}
									</p>
									<p className="text-xs text-muted-foreground">
										{t("noRecentEnrollmentsSubtitle")}
									</p>
								</div>
							) : (
								recentEnrollments.map((enrollment) => (
									<div
										key={enrollment.id}
										className="flex items-center gap-4 px-4 py-3"
									>
										<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
											<Users className="size-4" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{enrollment.student_name}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{t("enrolledIn", { course: enrollment.course_title })}
											</p>
										</div>
										<span className="shrink-0 text-xs text-muted-foreground">
											{new Date(enrollment.enrolled_at).toLocaleDateString()}
										</span>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>

				{/* Recent quiz attempts — narrower */}
				<div className="lg:col-span-2">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
							{t("recentQuizAttempts")}
						</h2>
						<Link
							href={routes.d.instructor.quizzes.page()}
							className="text-xs text-[#1461B8] hover:underline"
						>
							{t("viewAll")}
						</Link>
					</div>
					<Card>
						<CardContent className="divide-y px-0 pb-0 pt-0">
							{recentQuizAttempts.length === 0 ? (
								<div className="flex flex-col items-center gap-1 py-10 text-center">
									<p className="text-sm font-medium">
										{t("noRecentQuizAttempts")}
									</p>
									<p className="text-xs text-muted-foreground">
										{t("noRecentQuizAttemptsSubtitle")}
									</p>
								</div>
							) : (
								recentQuizAttempts.map((attempt) => (
									<div
										key={attempt.id}
										className="flex items-start gap-3 px-4 py-3"
									>
										<div className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5">
											<FileCheck className="size-3.5 text-muted-foreground" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{attempt.student_name}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{attempt.quiz_title} · {attempt.score ?? 0}/
												{attempt.max_score_possible ?? 0}
											</p>
										</div>
										{attempt.passed ? (
											<CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
										) : (
											<XCircle className="size-4 shrink-0 text-red-600" />
										)}
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
