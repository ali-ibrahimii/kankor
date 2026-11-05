"use client";

import {
	ActivityIcon,
	AwardIcon,
	BookmarkIcon,
	BookOpenIcon,
	CheckCircle2Icon,
	ClockIcon,
	FileTextIcon,
	GraduationCapIcon,
	LayersIcon,
	NotebookPenIcon,
	PlayCircleIcon,
	SchoolIcon,
	TargetIcon,
	UsersIcon,
	XCircleIcon,
	ZapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/widgets/stat-card";
import type {
	AdminStudentOverview,
	StudentActivity,
	StudentCertificate,
	StudentClassroom,
	StudentCourseEnrollment,
	StudentDeckProgress,
	StudentQuizAttempt,
} from "@/lib/data/admin-students";

/**
 * Renders the full picture of a single student for the admin dashboard.
 *
 * Purely presentational — every string comes from the `admin.students`
 * translation namespace and every collection is passed in already normalised
 * by `normalizeStudentOverview`.
 */

// ─── Small building blocks ──────────────────────────────────────────────────

function ProgressBar({
	value,
	label,
}: {
	value: number | null;
	label: string;
}) {
	const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>{label}</span>
				<span className="tabular-nums">{pct.toFixed(0)}%</span>
			</div>
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-[width]"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
	);
}

function ScoreBadge({
	percentage,
	passed,
}: {
	percentage: number | null;
	passed: boolean | null;
}) {
	const t = useTranslations("admin.students");
	if (percentage == null) {
		return <span className="text-xs text-muted-foreground">—</span>;
	}

	const isPass = passed ?? percentage >= 50;

	return (
		<Badge
			variant={isPass ? "default" : "destructive"}
			className="tabular-nums"
		>
			{percentage.toFixed(0)}%
		</Badge>
	);
}

// ─── Stat cards ─────────────────────────────────────────────────────────────

export function StudentStatsGrid({
	overview,
}: {
	overview: AdminStudentOverview;
}) {
	const t = useTranslations("admin.students");

	const stats = [
		{
			label: t("stats.enrolledCourses"),
			value: overview.enrolled_courses_count,
			icon: GraduationCapIcon,
			color: "text-blue-600",
		},
		{
			label: t("stats.completedCourses"),
			value: overview.completed_courses_count,
			icon: CheckCircle2Icon,
			color: "text-emerald-600",
		},
		{
			label: t("stats.averageScore"),
			value: overview.average_quiz_score,
			icon: TargetIcon,
			color: "text-yellow-600",
		},
		{
			label: t("stats.quizAttempts"),
			value: overview.quiz_attempts_count,
			icon: FileTextIcon,
			color: "text-violet-600",
		},
		{
			label: t("stats.quizzesPassed"),
			value: overview.quizzes_passed_count,
			icon: AwardIcon,
			color: "text-emerald-700",
		},
		{
			label: t("stats.activeDecks"),
			value: overview.active_decks_count,
			icon: ZapIcon,
			color: "text-amber-600",
		},
		{
			label: t("stats.lessonsCompleted"),
			value: overview.lessons_completed_count,
			icon: PlayCircleIcon,
			color: "text-sky-600",
		},
		{
			label: t("stats.studyMinutes"),
			value: overview.study_minutes_count,
			icon: ClockIcon,
			color: "text-teal-600",
		},
		{
			label: t("stats.certificates"),
			value: overview.certificates_count,
			icon: AwardIcon,
			color: "text-amber-500",
		},
		{
			label: t("stats.classrooms"),
			value: overview.classrooms_count,
			icon: UsersIcon,
			color: "text-indigo-600",
		},
		{
			label: t("stats.bookmarks"),
			value: overview.bookmarks_count,
			icon: BookmarkIcon,
			color: "text-rose-600",
		},
		{
			label: t("stats.notes"),
			value: overview.notes_count,
			icon: NotebookPenIcon,
			color: "text-slate-600",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
			{stats.map((stat) => (
				<StatCard key={stat.label} {...stat} />
			))}
		</div>
	);
}

// ─── Course enrollments ─────────────────────────────────────────────────────

export function StudentEnrollmentsTable({
	enrollments,
}: {
	enrollments: StudentCourseEnrollment[];
}) {
	const t = useTranslations("admin.students");

	if (enrollments.length === 0) {
		return <EmptyState message={t("empty.noEnrollments")} />;
	}

	return (
		<div className="rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("coursesTable.course")}</TableHead>
						<TableHead>{t("coursesTable.gradeSubject")}</TableHead>
						<TableHead>{t("coursesTable.instructor")}</TableHead>
						<TableHead>{t("coursesTable.progress")}</TableHead>
						<TableHead>{t("coursesTable.enrolledAt")}</TableHead>
						<TableHead>{t("coursesTable.status")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{enrollments.map((enrollment) => (
						<TableRow key={enrollment.id}>
							<TableCell>
								<p className="font-medium">
									{enrollment.course_title ?? t("coursesTable.unknownCourse")}
								</p>
								{enrollment.school_name && (
									<p className="text-xs text-muted-foreground">
										{enrollment.school_name}
									</p>
								)}
							</TableCell>
							<TableCell className="text-sm">
								<div className="flex flex-wrap gap-1">
									{enrollment.grade_name && (
										<Badge variant="secondary">{enrollment.grade_name}</Badge>
									)}
									{enrollment.subject_name && (
										<Badge variant="outline">{enrollment.subject_name}</Badge>
									)}
									{!enrollment.grade_name && !enrollment.subject_name && (
										<span className="text-muted-foreground">—</span>
									)}
								</div>
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{enrollment.instructor_name ?? "—"}
							</TableCell>
							<TableCell className="min-w-32">
								<ProgressBar
									value={enrollment.progress_percentage}
									label={t("coursesTable.lessons", {
										completed: enrollment.lessons_completed,
										total: enrollment.lessons_total,
									})}
								/>
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{enrollment.enrolled_at
									? new Date(enrollment.enrolled_at).toLocaleDateString()
									: "—"}
							</TableCell>
							<TableCell>
								{enrollment.completed_at ? (
									<Badge className="gap-1">
										<CheckCircle2Icon className="size-3" />
										{t("coursesTable.completed")}
									</Badge>
								) : (
									<Badge variant="secondary" className="gap-1">
										<PlayCircleIcon className="size-3" />
										{t("coursesTable.inProgress")}
									</Badge>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

// ─── Quiz attempts ──────────────────────────────────────────────────────────

export function StudentQuizAttemptsTable({
	attempts,
}: {
	attempts: StudentQuizAttempt[];
}) {
	const t = useTranslations("admin.students");

	if (attempts.length === 0) {
		return <EmptyState message={t("empty.noQuizAttempts")} />;
	}

	return (
		<div className="rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("quizzesTable.quiz")}</TableHead>
						<TableHead>{t("quizzesTable.subject")}</TableHead>
						<TableHead>{t("quizzesTable.attempt")}</TableHead>
						<TableHead>{t("quizzesTable.score")}</TableHead>
						<TableHead>{t("quizzesTable.result")}</TableHead>
						<TableHead>{t("quizzesTable.date")}</TableHead>
						<TableHead>{t("quizzesTable.feedback")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{attempts.map((attempt) => (
						<TableRow key={attempt.id}>
							<TableCell className="font-medium">
								{attempt.quiz_title ?? t("quizzesTable.unknownQuiz")}
							</TableCell>
							<TableCell className="text-sm">
								<div className="flex flex-wrap gap-1">
									{attempt.grade_name && (
										<Badge variant="secondary">{attempt.grade_name}</Badge>
									)}
									{attempt.subject_name && (
										<Badge variant="outline">{attempt.subject_name}</Badge>
									)}
									{!attempt.grade_name && !attempt.subject_name && (
										<span className="text-muted-foreground">—</span>
									)}
								</div>
							</TableCell>
							<TableCell className="tabular-nums">
								#{attempt.attempt_number ?? 1}
							</TableCell>
							<TableCell className="tabular-nums text-sm">
								{attempt.score ?? "—"}
								{attempt.max_score_possible != null && (
									<span className="text-muted-foreground">
										{" "}
										/ {attempt.max_score_possible}
									</span>
								)}
							</TableCell>
							<TableCell>
								<ScoreBadge
									percentage={attempt.score_percentage}
									passed={attempt.passed}
								/>
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{attempt.completed_at
									? new Date(attempt.completed_at).toLocaleDateString()
									: "—"}
							</TableCell>
							<TableCell className="max-w-56 text-sm text-muted-foreground">
								{attempt.feedback_from_instructor ?? "—"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

// ─── Decks ──────────────────────────────────────────────────────────────────

export function StudentDecksTable({ decks }: { decks: StudentDeckProgress[] }) {
	const t = useTranslations("admin.students");

	if (decks.length === 0) {
		return <EmptyState message={t("empty.noDecks")} />;
	}

	return (
		<div className="rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("decksTable.deck")}</TableHead>
						<TableHead>{t("decksTable.subject")}</TableHead>
						<TableHead>{t("decksTable.cards")}</TableHead>
						<TableHead>{t("decksTable.progress")}</TableHead>
						<TableHead>{t("decksTable.lastLearned")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{decks.map((deck) => (
						<TableRow key={deck.id}>
							<TableCell className="font-medium">
								{deck.deck_name ?? t("decksTable.unknownDeck")}
							</TableCell>
							<TableCell className="text-sm">
								<div className="flex flex-wrap gap-1">
									{deck.grade_name && (
										<Badge variant="secondary">{deck.grade_name}</Badge>
									)}
									{deck.subject_name && (
										<Badge variant="outline">{deck.subject_name}</Badge>
									)}
									{!deck.grade_name && !deck.subject_name && (
										<span className="text-muted-foreground">—</span>
									)}
								</div>
							</TableCell>
							<TableCell className="tabular-nums text-sm">
								{deck.cards_mastered} / {deck.cards_total}
							</TableCell>
							<TableCell className="min-w-32">
								<ProgressBar
									value={deck.progress_percentage}
									label={t("decksTable.mastered", {
										count: deck.cards_mastered,
									})}
								/>
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{deck.last_learn_on ?? "—"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

// ─── Classrooms ─────────────────────────────────────────────────────────────

export function StudentClassroomsTable({
	classrooms,
}: {
	classrooms: StudentClassroom[];
}) {
	const t = useTranslations("admin.students");

	if (classrooms.length === 0) {
		return <EmptyState message={t("empty.noClassrooms")} />;
	}

	return (
		<div className="rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("classroomsTable.classroom")}</TableHead>
						<TableHead>{t("classroomsTable.teacher")}</TableHead>
						<TableHead>{t("classroomsTable.school")}</TableHead>
						<TableHead>{t("classroomsTable.role")}</TableHead>
						<TableHead>{t("classroomsTable.joinedAt")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{classrooms.map((classroom) => (
						<TableRow key={classroom.id}>
							<TableCell className="font-medium">
								{classroom.name ?? "—"}
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{classroom.teacher_name ?? "—"}
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{classroom.school_name ?? "—"}
							</TableCell>
							<TableCell>
								<Badge variant="outline">{classroom.role ?? "—"}</Badge>
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{classroom.joined_at
									? new Date(classroom.joined_at).toLocaleDateString()
									: "—"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

// ─── Certificates ───────────────────────────────────────────────────────────

export function StudentCertificatesTable({
	certificates,
}: {
	certificates: StudentCertificate[];
}) {
	const t = useTranslations("admin.students");

	if (certificates.length === 0) {
		return <EmptyState message={t("empty.noCertificates")} />;
	}

	return (
		<div className="rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("certificatesTable.course")}</TableHead>
						<TableHead>{t("certificatesTable.issuedAt")}</TableHead>
						<TableHead>{t("certificatesTable.code")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{certificates.map((certificate) => (
						<TableRow key={certificate.id}>
							<TableCell className="font-medium">
								{certificate.course_title ?? "—"}
							</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{certificate.issued_at
									? new Date(certificate.issued_at).toLocaleDateString()
									: "—"}
							</TableCell>
							<TableCell className="font-mono text-xs">
								{certificate.verification_code ?? "—"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

// ─── Activity timeline ──────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, typeof ActivityIcon> = {
	enrollment: BookOpenIcon,
	quiz_attempt: FileTextIcon,
	lesson_completed: PlayCircleIcon,
	note: NotebookPenIcon,
	bookmark: BookmarkIcon,
};

export function StudentActivityTimeline({
	activity,
}: {
	activity: StudentActivity[];
}) {
	const t = useTranslations("admin.students");

	if (activity.length === 0) {
		return <EmptyState message={t("empty.noActivity")} />;
	}

	return (
		<ol className="divide-y">
			{activity.map((entry, index) => {
				const Icon = ACTIVITY_ICONS[entry.type] ?? ActivityIcon;
				return (
					<li
						key={`${entry.type}-${entry.ts}-${index}`}
						className="flex items-start gap-3 py-2.5"
					>
						<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
							<Icon className="size-3.5 text-muted-foreground" />
						</span>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{entry.label}</p>
							<p className="text-xs text-muted-foreground">
								{t(`activityTypes.${entry.type}` as any, {
									fallback: entry.type,
								})}
							</p>
						</div>
						<span className="shrink-0 text-xs text-muted-foreground">
							{entry.ts ? new Date(entry.ts).toLocaleDateString() : "—"}
						</span>
					</li>
				);
			})}
		</ol>
	);
}

// ─── Summary cards ──────────────────────────────────────────────────────────

export function StudentSummaryCards({
	overview,
}: {
	overview: AdminStudentOverview;
}) {
	const t = useTranslations("admin.students");

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card size="sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<GraduationCapIcon className="size-4" />
						{t("academicSummary")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
						<dt className="text-muted-foreground">{t("summary.grades")}</dt>
						<dd>
							{overview.distinct_grades_count > 0
								? overview.distinct_grades_count
								: t("summary.none")}
						</dd>
						<dt className="text-muted-foreground">{t("summary.subjects")}</dt>
						<dd>
							{overview.distinct_subjects_count > 0
								? overview.distinct_subjects_count
								: t("summary.none")}
						</dd>
						<dt className="text-muted-foreground">
							{t("summary.firstEnrolled")}
						</dt>
						<dd>
							{overview.first_enrolled_at
								? new Date(overview.first_enrolled_at).toLocaleDateString()
								: t("summary.none")}
						</dd>
						<dt className="text-muted-foreground">
							{t("summary.lastActivity")}
						</dt>
						<dd>
							{overview.last_activity_at
								? new Date(overview.last_activity_at).toLocaleDateString()
								: t("summary.none")}
						</dd>
						<dt className="text-muted-foreground">{t("summary.bestScore")}</dt>
						<dd className="tabular-nums">
							{overview.best_quiz_score > 0
								? `${overview.best_quiz_score}%`
								: t("summary.none")}
						</dd>
						<dt className="text-muted-foreground">
							{t("summary.failedQuizzes")}
						</dt>
						<dd className="tabular-nums">{overview.quizzes_failed_count}</dd>
					</dl>
				</CardContent>
			</Card>

			<Card size="sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<SchoolIcon className="size-4" />
						{t("activitySummary")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
						<dt className="text-muted-foreground">{t("summary.courses")}</dt>
						<dd className="tabular-nums">{overview.enrolled_courses_count}</dd>
						<dt className="text-muted-foreground">{t("summary.decks")}</dt>
						<dd className="tabular-nums">{overview.active_decks_count}</dd>
						<dt className="text-muted-foreground">{t("summary.classrooms")}</dt>
						<dd className="tabular-nums">{overview.classrooms_count}</dd>
						<dt className="text-muted-foreground">{t("summary.lessons")}</dt>
						<dd className="tabular-nums">{overview.lessons_completed_count}</dd>
						<dt className="text-muted-foreground">{t("summary.studyTime")}</dt>
						<dd className="tabular-nums">
							{t("summary.minutes", { count: overview.study_minutes_count })}
						</dd>
						<dt className="text-muted-foreground">{t("summary.bookmarks")}</dt>
						<dd className="tabular-nums">{overview.bookmarks_count}</dd>
						<dt className="text-muted-foreground">{t("summary.notes")}</dt>
						<dd className="tabular-nums">{overview.notes_count}</dd>
						<dt className="text-muted-foreground">
							{t("summary.certificates")}
						</dt>
						<dd className="tabular-nums">{overview.certificates_count}</dd>
					</dl>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Icons re-export for the page shell ─────────────────────────────────────

export const StudentOverviewIcons = {
	LayersIcon,
	XCircleIcon,
};
