"use client";

import {
	ArrowLeft,
	ArrowRight,
	Award,
	BookOpen,
	Building2,
	CheckCircle2,
	GraduationCap,
	type LucideIcon,
	School,
	Sparkles,
	TrendingUp,
	Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { allLessons, progressFor } from "@/lib/demo/actions";
import type { DemoRole } from "@/lib/demo/types";
import type { DemoSection } from "./demo-context";
import { useDemo } from "./demo-context";
import { CourseArt, DemoAvatar, DemoPanel } from "./demo-ui";

type Stat = { label: string; value: number; icon: LucideIcon; tone: string };

export function DemoOverview() {
	const t = useTranslations("demo");
	const locale = useLocale();
	const { state, actor, setSection, formatNumber, formatDate } = useDemo();
	const role = actor.role;
	const scopedCourses =
		role === "admin"
			? state.courses
			: role === "teacher"
				? state.courses.filter((item) => item.teacherId === actor.id)
				: role === "school"
					? state.courses.filter((item) => item.schoolId === actor.schoolId)
					: state.courses.filter((item) =>
							state.enrollments.some(
								(entry) =>
									entry.studentId === actor.id && entry.courseId === item.id
							)
						);
	const scopedClasses =
		role === "admin"
			? state.classrooms
			: role === "teacher"
				? state.classrooms.filter((item) => item.teacherId === actor.id)
				: role === "school"
					? state.classrooms.filter((item) => item.schoolId === actor.schoolId)
					: state.classrooms.filter((item) =>
							item.memberIds.includes(actor.id)
						);
	const enrollments =
		role === "student"
			? state.enrollments.filter((item) => item.studentId === actor.id)
			: state.enrollments.filter((item) =>
					scopedCourses.some((course) => course.id === item.courseId)
				);
	const students = new Set([
		...enrollments.map((item) => item.studentId),
		...scopedClasses.flatMap((item) => item.memberIds),
	]).size;
	const certificates =
		role === "student"
			? state.certificates.filter(
					(item) => item.studentId === actor.id && !item.revokedAt
				)
			: state.certificates.filter(
					(item) =>
						scopedCourses.some((course) => course.id === item.courseId) &&
						!item.revokedAt
				);
	const schoolMembers = state.users.filter(
		(person) => person.schoolId === actor.schoolId
	);
	const stats: Record<DemoRole, Stat[]> = {
		admin: [
			{
				label: t("overview.stats.students"),
				value: state.users.filter((user) => user.role === "student").length,
				icon: GraduationCap,
				tone: "violet",
			},
			{
				label: t("overview.stats.teachers"),
				value: state.users.filter((user) => user.role === "teacher").length,
				icon: Users,
				tone: "sky",
			},
			{
				label: t("overview.stats.schools"),
				value: state.schools.length,
				icon: Building2,
				tone: "mint",
			},
			{
				label: t("overview.stats.courses"),
				value: state.courses.filter((course) => course.published).length,
				icon: BookOpen,
				tone: "peach",
			},
		],
		teacher: [
			{
				label: t("overview.stats.courses"),
				value: scopedCourses.length,
				icon: BookOpen,
				tone: "violet",
			},
			{
				label: t("overview.stats.students"),
				value: students,
				icon: Users,
				tone: "sky",
			},
			{
				label: t("overview.stats.classrooms"),
				value: scopedClasses.length,
				icon: School,
				tone: "mint",
			},
			{
				label: t("overview.stats.certificates"),
				value: certificates.length,
				icon: Award,
				tone: "peach",
			},
		],
		school: [
			{
				label: t("overview.stats.teachers"),
				value: schoolMembers.filter((user) => user.role === "teacher").length,
				icon: Users,
				tone: "violet",
			},
			{
				label: t("overview.stats.students"),
				value: schoolMembers.filter((user) => user.role === "student").length,
				icon: GraduationCap,
				tone: "sky",
			},
			{
				label: t("overview.stats.courses"),
				value: scopedCourses.length,
				icon: BookOpen,
				tone: "mint",
			},
			{
				label: t("overview.stats.classrooms"),
				value: scopedClasses.length,
				icon: School,
				tone: "peach",
			},
		],
		student: [
			{
				label: t("overview.stats.enrolled"),
				value: enrollments.length,
				icon: BookOpen,
				tone: "violet",
			},
			{
				label: t("overview.stats.completed"),
				value: enrollments.reduce(
					(total, item) => total + item.completedLessonIds.length,
					0
				),
				icon: CheckCircle2,
				tone: "sky",
			},
			{
				label: t("overview.stats.classrooms"),
				value: scopedClasses.length,
				icon: School,
				tone: "mint",
			},
			{
				label: t("overview.stats.certificates"),
				value: certificates.length,
				icon: Award,
				tone: "peach",
			},
		],
	};
	const primarySection: DemoSection =
		role === "student" ? "explore" : role === "admin" ? "people" : "courses";
	const featured =
		role === "student"
			? (scopedCourses.find((course) => {
					const enrollment = enrollments.find(
						(entry) => entry.courseId === course.id
					);
					return enrollment && progressFor(course, enrollment) < 100;
				}) ?? scopedCourses[0])
			: scopedCourses[0];
	const featuredProgress = featured
		? progressFor(
				featured,
				enrollments.find((entry) => entry.courseId === featured.id)
			)
		: 0;
	const Arrow = locale === "en" ? ArrowRight : ArrowLeft;

	return (
		<div className="space-y-7">
			<div className="demo-hero relative isolate overflow-hidden rounded-[30px] px-6 py-8 text-white sm:px-9 sm:py-10 lg:px-11">
				<div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_290px]">
					<div>
						<span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-[#bdf18c]">
							<Sparkles className="size-3.5" />
							{t("overview.kicker")}
						</span>
						<h1 className="max-w-[640px] text-[1.9rem] font-extrabold leading-[1.5] tracking-tight sm:text-[2.4rem]">
							{t("overview.greeting", { name: actor.name })}
						</h1>
						<p className="mt-3 max-w-[580px] text-sm leading-8 text-white/65">
							{t(`overview.subtitles.${role}`)}
						</p>
						<Button
							type="button"
							className="mt-6 h-11 rounded-2xl bg-[#b7f486] px-5 font-bold text-[#14243a] shadow-lg shadow-black/15 hover:bg-[#c6f89c]"
							onClick={() => setSection(primarySection)}
						>
							{t(`overview.cta.${role}`)}
							<Arrow className="size-4" />
						</Button>
					</div>
					<div className="relative hidden min-h-[220px] lg:block">
						<div className="absolute inset-0 rounded-full border border-white/10" />
						<div className="absolute inset-[20px] rounded-full border border-dashed border-white/15" />
						<div className="absolute inset-[55px] rounded-full bg-violet-500/20 blur-2xl" />
						<div className="absolute start-8 top-5 flex size-16 rotate-[-10deg] items-center justify-center rounded-3xl bg-[#b7f486] text-[#1e2d3f] shadow-xl">
							<GraduationCap className="size-8" />
						</div>
						<div className="absolute end-4 bottom-6 flex size-16 rotate-[9deg] items-center justify-center rounded-3xl bg-[#a997ff] text-white shadow-xl">
							<Award className="size-8" />
						</div>
						<div className="absolute start-20 top-[90px] flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-lg">
							<TrendingUp className="size-5 text-[#b7f486]" />
							<span className="text-xs font-bold">{t("overview.habit")}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{stats[role].map((stat) => (
					<DemoPanel
						key={stat.label}
						className="flex items-start justify-between p-5"
					>
						<div>
							<p className="text-xs font-semibold text-slate-500">
								{stat.label}
							</p>
							<p className="mt-4 text-[2rem] font-extrabold leading-none tracking-tight text-[#19243b] tabular-nums">
								{formatNumber(stat.value)}
							</p>
							<p className="mt-3 text-[11px] text-slate-400">
								{t("overview.sampleData")}
							</p>
						</div>
						<span className={`demo-stat-icon demo-stat-icon--${stat.tone}`}>
							<stat.icon className="size-5" />
						</span>
					</DemoPanel>
				))}
			</div>

			<div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
				<DemoPanel className="p-5 sm:p-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-base font-extrabold text-[#19243b]">
								{role === "student"
									? t("overview.continue")
									: t("overview.highlight")}
							</h2>
							<p className="mt-1 text-xs text-slate-400">
								{t("overview.highlightDescription")}
							</p>
						</div>
						<BookOpen className="size-5 text-violet-500" />
					</div>
					{featured ? (
						<div className="mt-5 flex flex-col gap-4 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center">
							<CourseArt course={featured} size="small" />
							<div className="min-w-0 flex-1">
								<p className="truncate font-bold text-[#19243b]">
									{featured.title}
								</p>
								<p className="mt-1 text-xs text-slate-500">
									{t("courses.lessonCount", {
										count: allLessons(featured).length,
									})}{" "}
									·{" "}
									{
										state.users.find((user) => user.id === featured.teacherId)
											?.name
									}
								</p>
								{role === "student" && (
									<div className="mt-3 flex items-center gap-3">
										<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
											<div
												className="h-full rounded-full bg-violet-600"
												style={{ width: `${featuredProgress}%` }}
											/>
										</div>
										<span className="text-xs font-bold text-violet-600">
											{formatNumber(featuredProgress)}%
										</span>
									</div>
								)}
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="demo-rounded"
								onClick={() =>
									setSection(role === "student" ? "myCourses" : "courses")
								}
							>
								{t("common.view")}
							</Button>
						</div>
					) : (
						<p className="mt-6 text-sm text-slate-500">
							{t("overview.noCourse")}
						</p>
					)}
				</DemoPanel>
				<DemoPanel className="p-5 sm:p-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-base font-extrabold text-[#19243b]">
								{t("overview.recent")}
							</h2>
							<p className="mt-1 text-xs text-slate-400">
								{t("overview.recentDescription")}
							</p>
						</div>
						<Users className="size-5 text-violet-500" />
					</div>
					<div className="mt-4 divide-y divide-slate-100">
						{enrollments
							.slice(-3)
							.reverse()
							.map((entry) => {
								const student = state.users.find(
									(person) => person.id === entry.studentId
								);
								const course = state.courses.find(
									(item) => item.id === entry.courseId
								);
								return student && course ? (
									<div
										key={entry.id}
										className="flex items-center gap-3 py-2.5"
									>
										<DemoAvatar user={student} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-xs font-bold text-[#19243b]">
												{role === "student" ? course.title : student.name}
											</p>
											<p className="truncate text-[11px] text-slate-400">
												{role === "student"
													? t("overview.enrolled")
													: course.title}
											</p>
										</div>
										<span className="shrink-0 text-[10px] text-slate-400">
											{formatDate(entry.enrolledAt)}
										</span>
									</div>
								) : null;
							})}
						{enrollments.length === 0 && (
							<p className="py-7 text-sm text-slate-500">
								{t("overview.noRecent")}
							</p>
						)}
					</div>
				</DemoPanel>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{(role === "student"
					? ["explore", "classrooms", "certificates"]
					: role === "admin"
						? ["people", "schools", "settings"]
						: role === "school"
							? ["members", "courses", "classrooms"]
							: ["courses", "classrooms", "students"]
				).map((destination, index) => (
					<button
						key={destination}
						type="button"
						onClick={() => setSection(destination as DemoSection)}
						className={`demo-quick-card demo-quick-card--${index}`}
					>
						<span className="text-xs font-extrabold">
							{t(`nav.${destination}`)}
						</span>
						<Arrow className="size-5 opacity-70" />
					</button>
				))}
			</div>
		</div>
	);
}
