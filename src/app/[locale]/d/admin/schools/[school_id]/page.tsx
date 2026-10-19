import {
	FileText,
	GraduationCap,
	UserCog,
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
	SchoolMembersTable,
} from "@/components/blocks/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/widgets/stat-card";
import { routes } from "@/lib/routes";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

type SchoolOverview =
	Database["public"]["Functions"]["get_school_dashboard_overview"]["Returns"][number];

type RecentMember = {
	id: string;
	full_name: string | null;
	role: string;
	joined_at: string;
};

export default async function AdminSchoolDetailPage({
	params,
}: {
	params: Promise<BaseParams & { school_id: string }>;
}) {
	const { school_id, locale } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const [schoolResult, overviewResult, t] = await Promise.all([
		supabase
			.from("schools")
			.select(
				"id, name, status, admin_email, address, created_at, profiles:user_id(full_name, email)"
			)
			.eq("id", school_id)
			.single(),
		supabase
			.rpc("get_school_dashboard_overview", { p_school_id: school_id })
			.single(),
		getTranslations("admin.schools"),
	]);

	const school = schoolResult.data;
	if (schoolResult.error || !school) notFound();

	const overview = (overviewResult.data as SchoolOverview | null) ?? null;
	const recentMembers =
		(overview?.recent_members as RecentMember[] | null) ?? [];

	const stats = overview
		? [
				{
					label: t("stats.students"),
					value: overview.students_count,
					icon: Users,
					color: "text-blue-600",
				},
				{
					label: t("stats.teachers"),
					value: overview.teachers_count,
					icon: GraduationCap,
					color: "text-emerald-600",
				},
				{
					label: t("stats.staff"),
					value: overview.staff_count,
					icon: UserCog,
					color: "text-slate-500",
				},
				{
					label: t("stats.courses"),
					value: overview.courses_count,
					icon: GraduationCap,
					color: "text-indigo-600",
				},
				{
					label: t("stats.decks"),
					value: overview.decks_count,
					icon: Zap,
					color: "text-amber-600",
				},
				{
					label: t("stats.quizzes"),
					value: overview.quizzes_count,
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
			]
		: [];

	return (
		<div className="space-y-6 p-6">
			<EntityDetailHeader
				entity={{ kind: "school", id: school.id, status: school.status }}
				title={school.name ?? t("unnamed")}
				subtitle={[school.admin_email, school.address]
					.filter(Boolean)
					.join(" · ")}
				backHref={routes.d.admin.schools.page()}
				backLabel={t("backToList")}
			/>

			<Tabs defaultValue="info">
				<TabsList>
					<TabsTrigger value="info">{t("tabs.info")}</TabsTrigger>
					<TabsTrigger value="members">{t("tabs.members")}</TabsTrigger>
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
							<CardContent className="text-sm">
								<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
									{school.profiles?.full_name && (
										<>
											<dt className="text-muted-foreground">
												{t("fields.owner")}
											</dt>
											<dd>
												{school.profiles.full_name}
												{school.profiles.email
													? ` (${school.profiles.email})`
													: ""}
											</dd>
										</>
									)}
									{school.admin_email && (
										<>
											<dt className="text-muted-foreground">
												{t("fields.adminEmail")}
											</dt>
											<dd>{school.admin_email}</dd>
										</>
									)}
									{school.address && (
										<>
											<dt className="text-muted-foreground">
												{t("fields.address")}
											</dt>
											<dd>{school.address}</dd>
										</>
									)}
									<dt className="text-muted-foreground">
										{t("fields.created")}
									</dt>
									<dd>{new Date(school.created_at).toLocaleDateString()}</dd>
								</dl>
							</CardContent>
						</Card>

						<Card size="sm">
							<CardHeader>
								<CardTitle>{t("recentMembers")}</CardTitle>
							</CardHeader>
							<CardContent>
								{recentMembers.length === 0 ? (
									<p className="py-4 text-center text-sm text-muted-foreground">
										{t("noMembers")}
									</p>
								) : (
									<ul className="divide-y">
										{recentMembers.map((member) => (
											<li
												key={member.id}
												className="flex items-center justify-between gap-3 py-2 text-sm"
											>
												<div className="min-w-0">
													<p className="truncate font-medium">
														{member.full_name}
													</p>
													<p className="truncate text-xs text-muted-foreground">
														{member.role}
													</p>
												</div>
												<span className="shrink-0 text-xs text-muted-foreground">
													{new Date(member.joined_at).toLocaleDateString()}
												</span>
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="members">
					<SchoolMembersTable schoolId={school.id} />
				</TabsContent>

				<TabsContent value="courses">
					<AdminCoursesTable owner={{ kind: "school", id: school.id }} />
				</TabsContent>

				<TabsContent value="decks">
					<AdminDecksTable owner={{ kind: "school", id: school.id }} />
				</TabsContent>

				<TabsContent value="quizzes">
					<AdminQuizzesTable owner={{ kind: "school", id: school.id }} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
