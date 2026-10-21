import {
	BookOpen,
	CheckCircle2,
	FileCheck,
	GraduationCap,
	UserCog,
	Users,
	Wallet,
	XCircle,
	Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/widgets/stat-card";
import { TrendChart } from "@/components/widgets/trend-chart";
import type { SchoolDashboardOverview } from "@/types/queries.types";

// ─── View ─────────────────────────────────────────────────────────────────────

/** Presentational school overview, shared with the public `/demo` preview. */
export async function SchoolOverview({
	overview,
}: {
	overview: SchoolDashboardOverview | null;
}) {
	const [t, tRoles] = await Promise.all([
		getTranslations("overview.school"),
		getTranslations("overview.school.memberRoles"),
	]);

	const stats = [
		{
			label: t("stats.students"),
			value: overview?.students_count ?? 0,
			icon: GraduationCap,
			color: "text-blue-600",
		},
		{
			label: t("stats.teachers"),
			value: overview?.teachers_count ?? 0,
			icon: Users,
			color: "text-violet-600",
		},
		{
			label: t("stats.staff"),
			value: overview?.staff_count ?? 0,
			icon: UserCog,
			color: "text-amber-500",
		},
		{
			label: t("stats.courses"),
			value: overview?.courses_count ?? 0,
			icon: BookOpen,
			color: "text-blue-600",
		},
		{
			label: t("stats.decks"),
			value: overview?.decks_count ?? 0,
			icon: Zap,
			color: "text-amber-500",
		},
		{
			label: t("stats.quizzes"),
			value: overview?.quizzes_count ?? 0,
			icon: FileCheck,
			color: "text-emerald-600",
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

	const recentMembers = overview?.recent_members ?? [];
	const recentQuizAttempts = overview?.recent_quiz_attempts ?? [];
	const earningsTrend = (overview?.earnings_trend ?? []).map((point) => ({
		date: point.date,
		value: point.credits ?? 0,
	}));

	return (
		<div className="space-y-6 p-6">
			{/* ── Stats row ───────────────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
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
				{/* Recent members — wider */}
				<div className="lg:col-span-3">
					<h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
						{t("recentMembers")}
					</h2>
					<Card>
						<CardContent className="divide-y px-0 pb-0 pt-0">
							{recentMembers.length === 0 ? (
								<div className="flex flex-col items-center gap-1 py-10 text-center">
									<p className="text-sm font-medium">{t("noRecentMembers")}</p>
									<p className="text-xs text-muted-foreground">
										{t("noRecentMembersSubtitle")}
									</p>
								</div>
							) : (
								recentMembers.map((member) => (
									<div
										key={member.id}
										className="flex items-center gap-4 px-4 py-3"
									>
										<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
											<Users className="size-4" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{member.full_name}
											</p>
											<p className="text-xs text-muted-foreground">
												{tRoles(member.role)} ·{" "}
												{t("joined", {
													date: new Date(member.joined_at).toLocaleDateString(),
												})}
											</p>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>

				{/* Recent quiz attempts — narrower */}
				<div className="lg:col-span-2">
					<h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
						{t("recentQuizAttempts")}
					</h2>
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
