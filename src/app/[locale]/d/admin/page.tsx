import {
	BookOpen,
	Building2,
	Clock,
	FilePlus,
	GraduationCap,
	ShieldAlert,
	Users,
	Wallet,
	Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/widgets/stat-card";
import { TrendChart } from "@/components/widgets/trend-chart";
import { createClient } from "@/lib/supabase/server";
import type { PlatformAdminOverview } from "@/types/queries.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getOverview(): Promise<PlatformAdminOverview | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.rpc("get_platform_admin_overview")
		.single();
	if (error) throw error;
	return data as unknown as PlatformAdminOverview;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
	const [t, tRoles, overview] = await Promise.all([
		getTranslations("overview.admin"),
		getTranslations("overview.admin.roleLabels"),
		getOverview(),
	]);

	const stats = [
		{
			label: t("stats.students"),
			value: overview?.students_count ?? 0,
			icon: GraduationCap,
			color: "text-blue-600",
		},
		{
			label: t("stats.instructors"),
			value: overview?.instructors_count ?? 0,
			icon: Users,
			color: "text-violet-600",
		},
		{
			label: t("stats.activeSchools"),
			value: overview?.schools_active_count ?? 0,
			icon: Building2,
			color: "text-emerald-600",
		},
		{
			label: t("stats.pendingSchools"),
			value: overview?.schools_pending_count ?? 0,
			icon: Clock,
			color: "text-amber-500",
		},
		{
			label: t("stats.pendingInstructors"),
			value: overview?.pending_instructor_approvals ?? 0,
			icon: ShieldAlert,
			color: "text-amber-500",
		},
		{
			label: t("stats.publishedCourses"),
			value: overview?.courses_published_count ?? 0,
			icon: BookOpen,
			color: "text-blue-600",
		},
		{
			label: t("stats.draftCourses"),
			value: overview?.courses_draft_count ?? 0,
			icon: FilePlus,
			color: "text-amber-500",
		},
		{
			label: t("stats.decks"),
			value: overview?.decks_count ?? 0,
			icon: Zap,
			color: "text-amber-500",
		},
		{
			label: t("stats.totalRevenue"),
			value: overview?.total_revenue_credits ?? 0,
			icon: Wallet,
			color: "text-[#1461B8]",
		},
		{
			label: t("stats.revenueThisMonth"),
			value: overview?.revenue_this_month_credits ?? 0,
			icon: Wallet,
			color: "text-emerald-600",
		},
	];

	const recentSignups = overview?.recent_signups ?? [];
	const revenueTrend = (overview?.revenue_trend ?? []).map((point) => ({
		date: point.date,
		value: point.credits ?? 0,
	}));
	const signupTrend = (overview?.signup_trend ?? []).map((point) => ({
		date: point.date,
		value: point.count ?? 0,
	}));

	return (
		<div className="space-y-6 p-6">
			{/* ── Stats row ───────────────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>

			{/* ── Trend charts ──────────────────────────────────────────────────────── */}
			<div className="grid gap-6 lg:grid-cols-2">
				<TrendChart
					title={t("revenueTrend")}
					data={revenueTrend}
					valueLabel={t("revenueTrendSubtitle")}
					color="var(--color-chart-2, #1461B8)"
				/>
				<TrendChart
					title={t("signupTrend")}
					data={signupTrend}
					valueLabel={t("signupTrendSubtitle")}
					color="var(--color-chart-1, #f59e0b)"
				/>
			</div>

			{/* ── Recent signups ───────────────────────────────────────────────────── */}
			<div>
				<h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					{t("recentSignups")}
				</h2>
				<Card>
					<CardContent className="divide-y px-0 pb-0 pt-0">
						{recentSignups.length === 0 ? (
							<div className="flex flex-col items-center gap-1 py-10 text-center">
								<p className="text-sm font-medium">{t("noRecentSignups")}</p>
								<p className="text-xs text-muted-foreground">
									{t("noRecentSignupsSubtitle")}
								</p>
							</div>
						) : (
							recentSignups.map((signup) => (
								<div
									key={signup.id}
									className="flex items-center gap-4 px-4 py-3"
								>
									<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
										<Users className="size-4" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{signup.full_name}
										</p>
										<p className="text-xs text-muted-foreground">
											{tRoles(signup.role)}
										</p>
									</div>
									<span className="shrink-0 text-xs text-muted-foreground">
										{new Date(signup.created_at).toLocaleDateString()}
									</span>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
