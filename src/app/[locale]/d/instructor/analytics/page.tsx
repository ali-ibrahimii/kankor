import {
	BookOpen,
	FilePlus,
	FileText,
	Star,
	Users,
	Wallet,
	Zap,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/widgets/stat-card";
import { TrendChart } from "@/components/widgets/trend-chart";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import {
	getCourseCardStats,
	getInstructorOverview,
} from "../_lib/instructor-data";

// ─── Data ─────────────────────────────────────────────────────────────────────

type AnalyticsCourseRow = {
	id: string;
	slug: string | null;
	title: string;
	is_published: boolean;
	average_rating: number | null;
	total_reviews: number;
};

async function getOwnCourses(
	instructorId: string
): Promise<AnalyticsCourseRow[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("courses")
		.select("id, slug, title, is_published, average_rating, total_reviews")
		.eq("instructor_id", instructorId)
		.order("created_at", { ascending: false });
	if (error) throw error;
	return data ?? [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstructorAnalyticsPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const user = await getCurrentUser();
	if (!user) redirect(routes.auth.login.page(undefined, { locale }));

	const [t, to, courses, overview] = await Promise.all([
		getTranslations("dashboard.instructor"),
		getTranslations("overview.instructor"),
		getOwnCourses(user.id),
		getInstructorOverview(),
	]);
	const tc = await getTranslations("courses");

	const statsById = new Map(
		(await getCourseCardStats(courses.map((c) => c.id))).map((row) => [
			row.course_id,
			row,
		])
	);

	const earningsTrend = (overview?.earnings_trend ?? []).map((point) => ({
		date: point.date,
		value: point.credits ?? 0,
	}));

	const stats = [
		{
			label: to("stats.publishedCourses"),
			value: overview?.published_courses_count ?? 0,
			icon: BookOpen,
			color: "text-blue-600",
		},
		{
			label: to("stats.draftCourses"),
			value: overview?.draft_courses_count ?? 0,
			icon: FilePlus,
			color: "text-amber-500",
		},
		{
			label: to("stats.totalStudents"),
			value: overview?.total_students_count ?? 0,
			icon: Users,
			color: "text-violet-600",
		},
		{
			label: to("stats.totalDecks"),
			value: overview?.total_decks_count ?? 0,
			icon: Zap,
			color: "text-emerald-600",
		},
		{
			label: to("stats.totalQuizzes"),
			value: overview?.total_quizzes_count ?? 0,
			icon: FileText,
			color: "text-sky-600",
		},
		{
			label: to("stats.averageRating"),
			value: overview?.average_rating ?? "—",
			icon: Star,
			color: "text-amber-500",
		},
		{
			label: to("stats.totalEarnings"),
			value: overview?.total_earnings_credits ?? 0,
			icon: Wallet,
			color: "text-[#1461B8]",
		},
		{
			label: to("stats.earningsThisMonth"),
			value: overview?.earnings_this_month_credits ?? 0,
			icon: Wallet,
			color: "text-emerald-600",
		},
	];

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div>
				<h1 className="text-xl font-bold">{t("analyticsPage.title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("analyticsPage.description")}
				</p>
			</div>

			{/* Stats row */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>

			{/* Earnings trend */}
			<TrendChart
				title={to("earningsTrend")}
				data={earningsTrend}
				valueLabel={to("earningsTrendSubtitle")}
				color="var(--color-chart-2, #1461B8)"
			/>

			{/* Per-course performance */}
			<div className="space-y-3">
				<h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
					{t("analyticsPage.perCourseTitle")}
				</h2>
				<div className="rounded-xl border bg-card text-card-foreground shadow-xs">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("analyticsPage.columnCourse")}</TableHead>
								<TableHead>{t("analyticsPage.columnStatus")}</TableHead>
								<TableHead>{tc("lessons")}</TableHead>
								<TableHead>{tc("duration")}</TableHead>
								<TableHead>{tc("enrollments")}</TableHead>
								<TableHead>{t("analyticsPage.columnRating")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{courses.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="py-10 text-center text-sm text-muted-foreground"
									>
										{tc("noCoursesFound")}
									</TableCell>
								</TableRow>
							) : (
								courses.map((course) => {
									const statsRow = statsById.get(course.id);
									return (
										<TableRow key={course.id}>
											<TableCell>
												<Link
													href={routes.d.instructor.courses.slug.page({
														slug: course.slug ?? course.id,
													})}
													className="font-medium hover:underline"
												>
													{course.title}
												</Link>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														course.is_published ? "default" : "secondary"
													}
												>
													{course.is_published
														? tc("status_published")
														: tc("status_draft")}
												</Badge>
											</TableCell>
											<TableCell>{statsRow?.lessons_count ?? 0}</TableCell>
											<TableCell>
												{tc("durationMinutes", {
													minutes: statsRow?.lessons_minutes ?? 0,
												})}
											</TableCell>
											<TableCell>{statsRow?.enrollments_count ?? 0}</TableCell>
											<TableCell>
												{course.average_rating
													? course.average_rating.toFixed(1)
													: "—"}
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
