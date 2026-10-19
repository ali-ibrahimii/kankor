import {
	Bookmark,
	BookOpen,
	FileText,
	GraduationCap,
	Play,
	StickyNote,
	Trophy,
	Wallet,
	Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/widgets/stat-card";
import { TrendChart } from "@/components/widgets/trend-chart";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { StudentDashboardOverview } from "@/types/queries.types";

// ─── Kankor Countdown ────────────────────────────────────────────────────────

function getDaysUntilKankor(): number {
	// Kankor is typically held in mid-Hamal (early April) in Afghanistan.
	// Approximate next date: April 15 of the current or next year.
	const now = new Date();
	const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
	const kankor = new Date(year, 3, 15);
	return Math.ceil((kankor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getOverview(): Promise<StudentDashboardOverview | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.rpc("get_student_dashboard_overview")
		.single();
	if (error) throw error;
	return data as unknown as StudentDashboardOverview;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentDashboardPage() {
	const [t, overview] = await Promise.all([
		getTranslations("overview.student"),
		getOverview(),
	]);
	const daysLeft = getDaysUntilKankor();

	const stats = [
		{
			label: t("stats.enrolledCourses"),
			value: overview?.enrolled_courses_count ?? 0,
			icon: GraduationCap,
			color: "text-blue-600",
		},
		{
			label: t("stats.cardsDueToday"),
			value: overview?.cards_due_today ?? 0,
			icon: Zap,
			color: "text-amber-500",
		},
		{
			label: t("stats.testsCompleted"),
			value: overview?.tests_completed_count ?? 0,
			icon: FileText,
			color: "text-violet-600",
		},
		{
			label: t("stats.testsPassed"),
			value: overview?.tests_passed_count ?? 0,
			icon: Trophy,
			color: "text-violet-600",
		},
		{
			label: t("stats.bookmarks"),
			value: overview?.bookmarks_count ?? 0,
			icon: Bookmark,
			color: "text-emerald-600",
		},
		{
			label: t("stats.creditBalance"),
			value: overview?.credit_balance ?? 0,
			icon: Wallet,
			color: "text-[#1461B8]",
		},
	];

	const continueLearning = overview?.continue_learning ?? null;
	const recentQuizAttempts = overview?.recent_quiz_attempts ?? [];
	const recentNotes = overview?.recent_notes ?? [];
	const studyActivity = (overview?.study_activity ?? []).map((point) => ({
		date: point.date,
		value: point.count ?? 0,
	}));

	return (
		<div className="space-y-6 p-6">
			{/* ── Kankor Countdown (signature element) ─────────────────────────── */}
			<div
				className="relative overflow-hidden rounded-2xl p-6 text-white"
				style={{
					background:
						"linear-gradient(135deg, #040f1e 0%, #0b2240 50%, #1461B8 100%)",
				}}
			>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 opacity-[0.06]"
					style={{
						backgroundImage:
							"radial-gradient(circle, #ffffff 1px, transparent 1px)",
						backgroundSize: "24px 24px",
					}}
				/>

				<div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-medium tracking-widest text-white/50 uppercase">
							{t("kankorCountdown")}
						</p>
						<div className="mt-1 flex items-baseline gap-3">
							<span className="text-5xl font-bold tabular-nums text-amber-400 sm:text-6xl">
								{daysLeft}
							</span>
							<span className="text-sm text-white/60">
								{t("daysRemaining")}
							</span>
						</div>
					</div>

					<div className="flex shrink-0 gap-3">
						<Button
							asChild
							size="sm"
							className="bg-amber-400 text-amber-950 hover:bg-amber-300"
						>
							<Link href={routes.d.decks.practice.page()}>
								<Zap className="size-3.5" />
								{t("reviewCards")}
							</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* ── Stats row ───────────────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>

			{/* ── Continue Learning ────────────────────────────────────────────────── */}
			<div>
				<h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					{t("continueLearning")}
				</h2>
				{continueLearning ? (
					<Card className="border-s-4 border-s-[#1461B8]">
						<CardContent className="flex flex-col gap-4 pt-4 pb-4 sm:flex-row sm:items-center">
							<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
								<BookOpen className="size-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="font-medium text-foreground">
									{continueLearning.course_title}
								</p>
								<div className="mt-2 flex items-center gap-3">
									<Progress
										value={continueLearning.progress_percentage ?? 0}
										className="h-1.5 flex-1"
									/>
									<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
										{continueLearning.progress_percentage ?? 0}%
									</span>
								</div>
							</div>
							<Button asChild size="sm" className="shrink-0">
								<Link
									href={routes.d.myCourses.slug.page({
										slug: continueLearning.course_slug,
									})}
								>
									<Play className="size-3.5" />
									{t("resume")}
								</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center gap-2 py-10 text-center">
							<p className="text-sm font-medium">{t("noActiveCourse")}</p>
							<p className="text-xs text-muted-foreground">
								{t("noActiveCourseSubtitle")}
							</p>
							<Button asChild size="sm" className="mt-2">
								<Link href={routes.d.courses.page()}>{t("browseCourses")}</Link>
							</Button>
						</CardContent>
					</Card>
				)}
			</div>

			{/* ── Study activity chart ─────────────────────────────────────────────── */}
			<TrendChart
				title={t("studyActivity")}
				data={studyActivity}
				valueLabel={t("cardsReviewed")}
				color="var(--color-chart-1, #f59e0b)"
			/>

			{/* ── Bottom two-column section ────────────────────────────────────────── */}
			<div className="grid gap-6 lg:grid-cols-5">
				{/* Recent quiz results — wider */}
				<div className="lg:col-span-3">
					<h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
						{t("recentTests")}
					</h2>
					<Card>
						<CardContent className="divide-y px-0 pb-0 pt-0">
							{recentQuizAttempts.length === 0 ? (
								<div className="flex flex-col items-center gap-1 py-10 text-center">
									<p className="text-sm font-medium">{t("noRecentTests")}</p>
									<p className="text-xs text-muted-foreground">
										{t("noRecentTestsSubtitle")}
									</p>
								</div>
							) : (
								recentQuizAttempts.map((quiz) => (
									<div
										key={quiz.id}
										className="flex items-center gap-4 px-4 py-3"
									>
										<div
											className={cn(
												"flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
												quiz.passed
													? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
													: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
											)}
										>
											{quiz.score ?? 0}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{quiz.quiz_title}
											</p>
											<p className="text-xs text-muted-foreground">
												{quiz.score ?? 0}/{quiz.max_score_possible ?? 0} ·{" "}
												{new Date(quiz.completed_at).toLocaleDateString()}
											</p>
										</div>
										<Badge
											variant="secondary"
											className={cn(
												"shrink-0 text-xs",
												quiz.passed
													? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
													: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
											)}
										>
											{quiz.passed ? t("passed") : t("failed")}
										</Badge>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>

				{/* Recent notes — narrower */}
				<div className="lg:col-span-2">
					<h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
						{t("recentNotes")}
					</h2>
					<Card>
						<CardContent className="divide-y px-0 pb-0 pt-0">
							{recentNotes.length === 0 ? (
								<div className="flex flex-col items-center gap-1 py-10 text-center">
									<p className="text-sm font-medium">{t("noRecentNotes")}</p>
									<p className="text-xs text-muted-foreground">
										{t("noRecentNotesSubtitle")}
									</p>
								</div>
							) : (
								recentNotes.map((note) => (
									<div
										key={note.id}
										className="flex items-start gap-3 px-4 py-3"
									>
										<div className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5">
											<StickyNote className="size-3.5 text-muted-foreground" />
										</div>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium">
												{note.title}
											</p>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{new Date(note.created_at).toLocaleDateString()}
											</p>
										</div>
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
