import {
	BookOpen,
	FileText,
	GraduationCap,
	Star,
	Users,
	Wallet,
	Zap,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	AdminCoursesTable,
	AdminDecksTable,
	AdminQuizzesTable,
	EntityDetailHeader,
} from "@/components/blocks/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/widgets/stat-card";
import { routes } from "@/lib/routes";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

type InstructorOverview =
	Database["public"]["Functions"]["get_admin_instructor_overview"]["Returns"][number];

type RecentEnrollment = {
	id: string;
	student_name: string | null;
	course_title: string | null;
	enrolled_at: string;
};

export default async function AdminInstructorDetailPage({
	params,
}: {
	params: Promise<BaseParams & { user_id: string }>;
}) {
	const { user_id, locale } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const [profileResult, overviewResult, t] = await Promise.all([
		supabase
			.from("profiles")
			.select(
				"id, full_name, email, phone, avatar_url, bio, website_url, instructor_status, created_at, provinces(name)"
			)
			.eq("id", user_id)
			.eq("role", "instructor")
			.single(),
		supabase
			.rpc("get_admin_instructor_overview", { p_instructor_id: user_id })
			.single(),
		getTranslations("admin.instructors"),
	]);

	const instructor = profileResult.data;
	if (profileResult.error || !instructor) notFound();

	const overview = (overviewResult.data as InstructorOverview | null) ?? null;
	const recentEnrollments =
		(overview?.recent_enrollments as RecentEnrollment[] | null) ?? [];

	const stats = overview
		? [
				{
					label: t("stats.publishedCourses"),
					value: overview.published_courses_count,
					icon: GraduationCap,
					color: "text-blue-600",
				},
				{
					label: t("stats.draftCourses"),
					value: overview.draft_courses_count,
					icon: BookOpen,
					color: "text-slate-500",
				},
				{
					label: t("stats.students"),
					value: overview.total_students_count,
					icon: Users,
					color: "text-emerald-600",
				},
				{
					label: t("stats.decks"),
					value: overview.total_decks_count,
					icon: Zap,
					color: "text-amber-600",
				},
				{
					label: t("stats.quizzes"),
					value: overview.total_quizzes_count,
					icon: FileText,
					color: "text-violet-600",
				},
				{
					label: t("stats.totalEarnings"),
					value: overview.total_earnings_credits,
					icon: Wallet,
					color: "text-emerald-700",
				},
				{
					label: t("stats.earningsThisMonth"),
					value: overview.earnings_this_month_credits,
					icon: Wallet,
					color: "text-teal-600",
				},
				{
					label: t("stats.averageRating"),
					value: overview.average_rating,
					icon: Star,
					color: "text-yellow-500",
				},
			]
		: [];

	return (
		<div className="space-y-6 p-6">
			<EntityDetailHeader
				entity={{
					kind: "instructor",
					id: instructor.id,
					status: instructor.instructor_status,
				}}
				title={instructor.full_name ?? t("unnamed")}
				subtitle={[instructor.email, instructor.phone]
					.filter(Boolean)
					.join(" · ")}
				avatarUrl={instructor.avatar_url}
				backHref={routes.d.admin.users.instructors.page()}
				backLabel={t("backToList")}
			/>

			<Tabs defaultValue="info">
				<TabsList>
					<TabsTrigger value="info">{t("tabs.info")}</TabsTrigger>
					<TabsTrigger value="courses">{t("tabs.courses")}</TabsTrigger>
					<TabsTrigger value="decks">{t("tabs.decks")}</TabsTrigger>
					<TabsTrigger value="quizzes">{t("tabs.quizzes")}</TabsTrigger>
				</TabsList>

				<TabsContent value="info" className="space-y-6">
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
						{stats.map((stat) => (
							<StatCard key={stat.label} {...stat} />
						))}
					</div>

					<div className="grid gap-6 lg:grid-cols-2">
						<Card size="sm">
							<CardHeader>
								<CardTitle>{t("about")}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								{instructor.bio && (
									<p className="text-muted-foreground">{instructor.bio}</p>
								)}
								<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
									{instructor.email && (
										<>
											<dt className="text-muted-foreground">
												{t("fields.email")}
											</dt>
											<dd>{instructor.email}</dd>
										</>
									)}
									{instructor.phone && (
										<>
											<dt className="text-muted-foreground">
												{t("fields.phone")}
											</dt>
											<dd>{instructor.phone}</dd>
										</>
									)}
									{instructor.website_url && (
										<>
											<dt className="text-muted-foreground">
												{t("fields.website")}
											</dt>
											<dd className="truncate">{instructor.website_url}</dd>
										</>
									)}
									{instructor.provinces?.name && (
										<>
											<dt className="text-muted-foreground">
												{t("fields.province")}
											</dt>
											<dd>{instructor.provinces.name}</dd>
										</>
									)}
									<dt className="text-muted-foreground">
										{t("fields.joined")}
									</dt>
									<dd>
										{new Date(instructor.created_at).toLocaleDateString()}
									</dd>
								</dl>
							</CardContent>
						</Card>

						<Card size="sm">
							<CardHeader>
								<CardTitle>{t("recentEnrollments")}</CardTitle>
							</CardHeader>
							<CardContent>
								{recentEnrollments.length === 0 ? (
									<p className="py-4 text-center text-sm text-muted-foreground">
										{t("noEnrollments")}
									</p>
								) : (
									<ul className="divide-y">
										{recentEnrollments.map((enrollment) => (
											<li
												key={enrollment.id}
												className="flex items-center justify-between gap-3 py-2 text-sm"
											>
												<div className="min-w-0">
													<p className="truncate font-medium">
														{enrollment.student_name}
													</p>
													<p className="truncate text-xs text-muted-foreground">
														{enrollment.course_title}
													</p>
												</div>
												<span className="shrink-0 text-xs text-muted-foreground">
													{new Date(
														enrollment.enrolled_at
													).toLocaleDateString()}
												</span>
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="courses">
					<AdminCoursesTable
						owner={{ kind: "instructor", id: instructor.id }}
					/>
				</TabsContent>

				<TabsContent value="decks">
					<AdminDecksTable owner={{ kind: "instructor", id: instructor.id }} />
				</TabsContent>

				<TabsContent value="quizzes">
					<AdminQuizzesTable
						owner={{ kind: "instructor", id: instructor.id }}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
