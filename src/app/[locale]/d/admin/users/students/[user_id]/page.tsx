import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EntityDetailHeader } from "@/components/blocks/admin";
import {
	StudentActivityTimeline,
	StudentCertificatesTable,
	StudentClassroomsTable,
	StudentDecksTable,
	StudentEnrollmentsTable,
	StudentQuizAttemptsTable,
	StudentStatsGrid,
	StudentSummaryCards,
} from "@/components/blocks/admin/student-overview-panel";
import {
	getCreditLedger,
	getPurchaseHistory,
	StudentLedgerView,
} from "@/components/blocks/credits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getAdminStudentOverview,
	getAdminStudentProfile,
} from "@/lib/data/admin-students";
import { routes } from "@/lib/routes";
import type { BaseParams } from "@/types/common.types";

/**
 * Admin student detail — the complete picture of one student.
 *
 * Everything is fetched server-side in two parallel round-trips:
 *   1. the student's own profile row,
 *   2. the `get_admin_student_overview()` RPC (all enrollments, quiz
 *      attempts, decks, classrooms, certificates and counters).
 *
 * The credit ledger / purchases come from the existing credits actions, so
 * the page keeps its previous functionality and adds the academic view on
 * top of it.
 */
export default async function AdminStudentDetailPage({
	params,
}: {
	params: Promise<BaseParams & { user_id: string }>;
}) {
	const { user_id, locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("admin.students");
	const tCommon = await getTranslations("admin.common");
	const tCredits = await getTranslations("credits.admin");

	const [student, overview, ledgerResult, purchasesResult] = await Promise.all([
		getAdminStudentProfile(user_id),
		getAdminStudentOverview(user_id),
		getCreditLedger(user_id),
		getPurchaseHistory(user_id),
	]);

	if (!student) notFound();

	const enrollments = overview?.course_enrollments ?? [];
	const quizAttempts = overview?.quiz_attempts ?? [];
	const decks = overview?.deck_progress ?? [];
	const classrooms = overview?.classrooms ?? [];
	const certificates = overview?.certificates ?? [];
	const activity = overview?.activity ?? [];

	return (
		<div className="space-y-6 p-6">
			<EntityDetailHeader
				entity={{
					kind: "student",
					id: student.id,
					status: student.student_status,
				}}
				title={student.full_name ?? t("unnamedStudent")}
				subtitle={[student.email, student.phone].filter(Boolean).join(" · ")}
				avatarUrl={student.avatar_url}
				backHref={routes.d.admin.users.students.page()}
				backLabel={t("backToStudents")}
			/>

			{overview && <StudentStatsGrid overview={overview} />}

			{/*
			 * The tabs are always rendered — the credit ledger was this
			 * page's original feature and must stay reachable even when the
			 * overview RPC is unavailable (e.g. the migration has not been
			 * applied yet).
			 */}
			<Tabs defaultValue="overview">
				<TabsList className="flex-wrap">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="courses">{t("tabs.courses")}</TabsTrigger>
					<TabsTrigger value="quizzes">{t("tabs.quizzes")}</TabsTrigger>
					<TabsTrigger value="decks">{t("tabs.decks")}</TabsTrigger>
					<TabsTrigger value="classrooms">{t("tabs.classrooms")}</TabsTrigger>
					<TabsTrigger value="activity">{t("tabs.activity")}</TabsTrigger>
					<TabsTrigger value="credits">{t("tabs.credits")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					{overview ? (
						<StudentSummaryCards overview={overview} />
					) : (
						<Card size="sm">
							<CardHeader>
								<CardTitle>{tCommon("empty")}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									{t("overviewUnavailable")}
								</p>
							</CardContent>
						</Card>
					)}

					<Card size="sm">
						<CardHeader>
							<CardTitle>{t("profile")}</CardTitle>
						</CardHeader>
						<CardContent>
							<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
								<dt className="text-muted-foreground">{t("fields.email")}</dt>
								<dd>{student.email ?? "—"}</dd>
								<dt className="text-muted-foreground">{t("fields.phone")}</dt>
								<dd>{student.phone ?? "—"}</dd>
								<dt className="text-muted-foreground">
									{t("fields.province")}
								</dt>
								<dd>{student.province_name ?? "—"}</dd>
								<dt className="text-muted-foreground">{t("fields.balance")}</dt>
								<dd className="tabular-nums">
									{tCredits("balanceCredits", {
										count: student.credit_balance,
									})}
								</dd>
								<dt className="text-muted-foreground">{t("fields.joined")}</dt>
								<dd>{new Date(student.created_at).toLocaleDateString()}</dd>
								<dt className="text-muted-foreground">
									{t("fields.lastActivity")}
								</dt>
								<dd>
									{overview?.last_activity_at
										? new Date(overview.last_activity_at).toLocaleDateString()
										: "—"}
								</dd>
							</dl>
							{student.bio && (
								<p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
									{student.bio}
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="courses">
					<StudentEnrollmentsTable enrollments={enrollments} />
				</TabsContent>

				<TabsContent value="quizzes">
					<StudentQuizAttemptsTable attempts={quizAttempts} />
				</TabsContent>

				<TabsContent value="decks">
					<StudentDecksTable decks={decks} />
				</TabsContent>

				<TabsContent value="classrooms" className="space-y-6">
					<StudentClassroomsTable classrooms={classrooms} />
					<StudentCertificatesTable certificates={certificates} />
				</TabsContent>

				<TabsContent value="activity">
					<Card size="sm">
						<CardHeader>
							<CardTitle>{t("recentActivity")}</CardTitle>
						</CardHeader>
						<CardContent>
							<StudentActivityTimeline activity={activity} />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="credits">
					<StudentLedgerView
						userId={student.id}
						userName={student.full_name}
						ledger={ledgerResult.success ? ledgerResult.data : []}
						purchases={purchasesResult.success ? purchasesResult.data : []}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
