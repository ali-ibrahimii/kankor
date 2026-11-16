import {
	BookOpen,
	FileCheck,
	GraduationCap,
	UserCog,
	Users,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	bucketByMonth,
	computeQuizPassStats,
} from "@/components/blocks/school/school-report-utils";
import { StatCard } from "@/components/widgets/stat-card";
import { TrendChart } from "@/components/widgets/trend-chart";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";
import type { SchoolDashboardOverview } from "@/types/queries.types";

type Props = {
	params: Promise<BaseParams & { school_id: string }>;
};

type AttemptStatRow = {
	quiz_id: string | null;
	passed: boolean | null;
	created_at: string;
	quiz: { title: string } | null;
};

export default async function SchoolAnalyticsPage({ params }: Props) {
	const { school_id, locale } = await params;
	setRequestLocale(locale);

	const [t, tRoles, supabase] = await Promise.all([
		getTranslations("schoolAnalytics"),
		getTranslations("overview.school.memberRoles"),
		createClient(),
	]);

	const { data: overview } = await supabase
		.rpc("get_school_dashboard_overview", { p_school_id: school_id })
		.single();

	const [{ data: quizzes }, { data: members }] = await Promise.all([
		supabase.from("quizzes").select("id").eq("school_id", school_id),
		supabase.from("school_members").select("role").eq("school_id", school_id),
	]);

	const quizIds = (quizzes ?? []).map((quiz) => quiz.id);

	// Bounded sample of recent attempts + enrollments — enough for trend shape
	// and pass-rate ranking without loading the whole history.
	const [attemptsRes, enrollmentsRes] = await Promise.all([
		quizIds.length > 0
			? supabase
					.from("quiz_attempts")
					.select("quiz_id, passed, created_at, quiz:quizzes(title)")
					.in("quiz_id", quizIds)
					.order("created_at", { ascending: false })
					.limit(3000)
			: Promise.resolve({ data: [] as unknown[] }),
		supabase
			.from("enrollments")
			.select("id, created_at, courses!inner(school_id)")
			.eq("courses.school_id", school_id)
			.order("created_at", { ascending: false })
			.limit(3000),
	]);

	const attemptRows = (attemptsRes.data ?? []) as unknown as AttemptStatRow[];
	const enrollmentRows = (enrollmentsRes.data ?? []) as unknown as {
		created_at: string;
	}[];

	const attemptsTrend = bucketByMonth(
		attemptRows.map((row) => row.created_at),
		6
	);
	const enrollmentsTrend = bucketByMonth(
		enrollmentRows.map((row) => row.created_at),
		6
	);
	const earningsTrend = (
		(overview as SchoolDashboardOverview | null)?.earnings_trend ?? []
	).map((point) => ({ date: point.date, value: point.credits ?? 0 }));
	const quizPassStats = computeQuizPassStats(attemptRows).slice(0, 8);

	const ROLE_ORDER = [
		"owner",
		"admin",
		"instructor",
		"manager",
		"staff",
		"viewer",
	] as const;
	const roleCounts: Record<(typeof ROLE_ORDER)[number], number> = {
		owner: 0,
		admin: 0,
		instructor: 0,
		manager: 0,
		staff: 0,
		viewer: 0,
	};
	for (const member of members ?? []) {
		if (member.role in roleCounts) roleCounts[member.role] += 1;
	}
	const roleTotal = Object.values(roleCounts).reduce((a, b) => a + b, 0);

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				<StatCard
					label={t("students")}
					value={overview?.students_count ?? 0}
					icon={GraduationCap}
					color="text-blue-600"
				/>
				<StatCard
					label={t("teachers")}
					value={overview?.teachers_count ?? 0}
					icon={Users}
					color="text-violet-600"
				/>
				<StatCard
					label={t("staff")}
					value={overview?.staff_count ?? 0}
					icon={UserCog}
					color="text-amber-500"
				/>
				<StatCard
					label={t("courses")}
					value={overview?.courses_count ?? 0}
					icon={BookOpen}
					color="text-blue-600"
				/>
				<StatCard
					label={t("quizzes")}
					value={overview?.quizzes_count ?? 0}
					icon={FileCheck}
					color="text-emerald-600"
				/>
			</div>

			{/* Trends */}
			<div className="grid gap-6 lg:grid-cols-2">
				<TrendChart
					title={t("attemptsTrend")}
					data={attemptsTrend}
					valueLabel={t("attemptsValue")}
					color="var(--color-chart-1, #6366f1)"
				/>
				<TrendChart
					title={t("enrollmentsTrend")}
					data={enrollmentsTrend}
					valueLabel={t("enrollmentsValue")}
					color="var(--color-chart-2, #1461B8)"
				/>
			</div>
			<TrendChart
				title={t("earningsTrend")}
				data={earningsTrend}
				valueLabel={t("earningsValue")}
				color="var(--color-chart-3, #10b981)"
			/>

			{/* Breakdowns */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Members by role */}
				<section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
					<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
						{t("membersByRole")}
					</h2>
					<div className="mt-4 space-y-3">
						{ROLE_ORDER.map((role, index) => (
							<RoleBar
								key={role}
								label={tRoles(role)}
								value={roleCounts[role]}
								total={roleTotal}
								color={
									[
										"bg-blue-500",
										"bg-violet-500",
										"bg-emerald-500",
										"bg-amber-500",
										"bg-sky-500",
										"bg-slate-400",
									][index]
								}
							/>
						))}
					</div>
				</section>

				{/* Quiz pass rates */}
				<section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
					<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
						{t("quizPassRates")}
					</h2>
					{quizPassStats.length === 0 ? (
						<p className="mt-6 text-center text-sm text-muted-foreground">
							{t("noAttempts")}
						</p>
					) : (
						<div className="mt-4 space-y-3">
							{quizPassStats.map((quiz) => (
								<div key={quiz.quizId}>
									<div className="flex items-center justify-between gap-2 text-xs">
										<span className="truncate font-medium">{quiz.title}</span>
										<span className="shrink-0 tabular-nums text-muted-foreground">
											{t("passRateOf", {
												rate: quiz.passRate,
												count: quiz.attempts,
											})}
										</span>
									</div>
									<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
										<div
											className="h-full rounded-full bg-emerald-500"
											style={{ width: `${quiz.passRate}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}

function RoleBar({
	label,
	value,
	total,
	color,
}: {
	label: string;
	value: number;
	total: number;
	color: string;
}) {
	const pct = total > 0 ? Math.round((value / total) * 100) : 0;
	return (
		<div>
			<div className="flex items-center justify-between text-xs">
				<span className="font-medium">{label}</span>
				<span className="tabular-nums text-muted-foreground">
					{value} · {pct}%
				</span>
			</div>
			<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
				<div
					className={`h-full rounded-full ${color}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
