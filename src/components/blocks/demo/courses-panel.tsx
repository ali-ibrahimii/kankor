"use client";

import {
	ArrowLeft,
	Award,
	BookOpen,
	Check,
	ChevronLeft,
	CirclePlay,
	Clock3,
	FileText,
	GraduationCap,
	Layers3,
	Pencil,
	Plus,
	Search,
	Trash2,
	Users,
	Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import {
	addModule,
	allLessons,
	completeLesson,
	deleteCourse,
	enrollInCourse,
	progressFor,
	removeLesson,
	removeModule,
	renameModule,
	setCoursePublished,
} from "@/lib/demo/actions";
import type { DemoCourse, DemoLesson } from "@/lib/demo/types";
import { DemoCourseForm, DemoLessonForm } from "./course-forms";
import { useDemo } from "./demo-context";
import {
	CourseArt,
	DemoAvatar,
	DemoConfirm,
	DemoEmpty,
	DemoHeading,
	DemoPanel,
} from "./demo-ui";

function CourseCard({
	course,
	mode,
	onOpen,
}: {
	course: DemoCourse;
	mode: "manage" | "explore" | "myCourses";
	onOpen: () => void;
}) {
	const t = useTranslations("demo");
	const { state, actor, run, formatNumber } = useDemo();
	const teacher = state.users.find((person) => person.id === course.teacherId);
	const enrollment = state.enrollments.find(
		(item) => item.courseId === course.id && item.studentId === actor.id
	);
	const students = state.enrollments.filter(
		(item) => item.courseId === course.id
	).length;
	return (
		<DemoPanel className="group flex h-full flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-950/10">
			<CourseArt course={course} />
			<div className="flex flex-1 flex-col p-5">
				<div className="flex items-center justify-between gap-2">
					<span className="demo-role-pill">{course.subject}</span>
					<span
						className={
							course.published
								? "demo-status demo-status--active"
								: "demo-status demo-status--pending"
						}
					>
						{t(course.published ? "courses.published" : "courses.draft")}
					</span>
				</div>
				<h3 className="mt-3 line-clamp-2 min-h-[2.9rem] text-[15px] font-extrabold leading-6 text-[#19243b]">
					{course.title}
				</h3>
				<p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
					{course.description}
				</p>
				<div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
					<span className="flex items-center gap-1">
						<BookOpen className="size-3.5" />
						{t("courses.lessonCount", { count: allLessons(course).length })}
					</span>
					<span className="flex items-center gap-1">
						<Users className="size-3.5" />
						{mode === "manage"
							? t("courses.studentCount", { count: students })
							: teacher?.name}
					</span>
				</div>
				{enrollment && mode !== "manage" && (
					<div className="mt-4">
						<div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-violet-600">
							<span>{t("courses.progress")}</span>
							<span>{formatNumber(progressFor(course, enrollment))}%</span>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
							<div
								className="h-full rounded-full bg-violet-600"
								style={{ width: `${progressFor(course, enrollment)}%` }}
							/>
						</div>
					</div>
				)}
				<div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">
					<Button
						type="button"
						variant={mode === "manage" ? "outline" : "default"}
						className="demo-rounded flex-1"
						onClick={onOpen}
					>
						{mode === "manage"
							? t("courses.manage")
							: enrollment
								? t("courses.continue")
								: t("courses.details")}
					</Button>
					{mode === "explore" && !enrollment && (
						<Button
							type="button"
							className="demo-rounded flex-1"
							onClick={() =>
								run(
									(s, id) => enrollInCourse(s, id, course.id),
									t("courses.enrolled")
								)
							}
						>
							{t("courses.enroll")}
						</Button>
					)}
				</div>
			</div>
		</DemoPanel>
	);
}

function CourseEditor({
	course,
	onBack,
}: {
	course: DemoCourse;
	onBack: () => void;
}) {
	const t = useTranslations("demo");
	const { state, run, formatDate, formatNumber } = useDemo();
	const [courseOpen, setCourseOpen] = React.useState(false);
	const [moduleTitle, setModuleTitle] = React.useState("");
	const [renamingId, setRenamingId] = React.useState<string>();
	const [lessonTarget, setLessonTarget] = React.useState<{
		moduleId: string;
		lesson?: DemoLesson;
	}>();
	const enrollments = state.enrollments.filter(
		(entry) => entry.courseId === course.id
	);
	return (
		<div className="space-y-6">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="-ms-2 text-slate-500"
				onClick={onBack}
			>
				<ArrowLeft className="size-4 rtl:rotate-180" />
				{t("common.back")}
			</Button>
			<DemoPanel className="overflow-hidden p-0">
				<div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
					<CourseArt course={course} size="small" />
					<div className="min-w-0 flex-1">
						<div className="mb-2 flex flex-wrap gap-2">
							<span className="demo-role-pill">{course.subject}</span>
							<span
								className={
									course.published
										? "demo-status demo-status--active"
										: "demo-status demo-status--pending"
								}
							>
								{t(course.published ? "courses.published" : "courses.draft")}
							</span>
						</div>
						<h1 className="text-xl font-extrabold text-[#19243b]">
							{course.title}
						</h1>
						<p className="mt-2 text-sm leading-6 text-slate-500">
							{course.description}
						</p>
						<p className="mt-3 text-xs text-slate-400">
							{t("courses.createdAt", { date: formatDate(course.createdAt) })}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-4">
					<Button
						type="button"
						size="sm"
						onClick={() =>
							run((s, id) =>
								setCoursePublished(s, id, course.id, !course.published)
							)
						}
						className="demo-rounded"
					>
						{course.published ? t("courses.unpublish") : t("courses.publish")}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="demo-rounded"
						onClick={() => setCourseOpen(true)}
					>
						<Pencil className="size-3.5" />
						{t("common.edit")}
					</Button>
					<DemoConfirm
						title={t("courses.deleteTitle")}
						description={t("courses.deleteDescription")}
						destructive
						onConfirm={() => {
							if (run((s, id) => deleteCourse(s, id, course.id))) onBack();
						}}
					>
						<Button type="button" size="sm" variant="destructive">
							<Trash2 className="size-3.5" />
							{t("common.delete")}
						</Button>
					</DemoConfirm>
				</div>
			</DemoPanel>
			<div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
				<div className="space-y-4">
					<DemoPanel className="p-5 sm:p-6">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="font-extrabold text-[#19243b]">
									{t("courses.curriculum")}
								</h2>
								<p className="mt-1 text-xs text-slate-500">
									{t("courses.curriculumHint")}
								</p>
							</div>
							<span className="demo-role-pill">
								{t("courses.lessonCount", { count: allLessons(course).length })}
							</span>
						</div>
						<form
							className="mt-5 flex gap-2"
							onSubmit={(event) => {
								event.preventDefault();
								if (run((s, id) => addModule(s, id, course.id, moduleTitle)))
									setModuleTitle("");
							}}
						>
							<Input
								className="demo-input"
								aria-label={t("courses.moduleTitle")}
								placeholder={t("courses.modulePlaceholder")}
								value={moduleTitle}
								onChange={(event) => setModuleTitle(event.target.value)}
								required
								maxLength={120}
							/>
							<Button type="submit" className="demo-rounded">
								<Plus className="size-4" />
								{t("courses.addModule")}
							</Button>
						</form>
					</DemoPanel>
					{course.modules.map((module, index) => (
						<DemoPanel key={module.id} className="overflow-hidden p-0">
							<div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
								<span className="flex size-8 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
									{formatNumber(index + 1)}
								</span>
								{renamingId === module.id ? (
									<form
										className="flex min-w-0 flex-1 gap-2"
										onSubmit={(event) => {
											event.preventDefault();
											if (
												run((s, id) =>
													renameModule(s, id, course.id, module.id, moduleTitle)
												)
											) {
												setRenamingId(undefined);
												setModuleTitle("");
											}
										}}
									>
										<Input
											className="demo-input"
											autoFocus
											value={moduleTitle}
											onChange={(event) => setModuleTitle(event.target.value)}
											aria-label={t("courses.moduleTitle")}
										/>
										<Button type="submit" size="sm">
											{t("common.save")}
										</Button>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											onClick={() => {
												setRenamingId(undefined);
												setModuleTitle("");
											}}
										>
											{t("common.cancel")}
										</Button>
									</form>
								) : (
									<>
										<h3 className="min-w-0 flex-1 text-sm font-bold text-[#19243b]">
											{module.title}
										</h3>
										<Button
											type="button"
											size="icon-sm"
											variant="ghost"
											aria-label={t("courses.renameModule", {
												name: module.title,
											})}
											onClick={() => {
												setRenamingId(module.id);
												setModuleTitle(module.title);
											}}
										>
											<Pencil className="size-3.5" />
										</Button>
										<DemoConfirm
											title={t("courses.deleteModuleTitle")}
											description={t("courses.deleteModuleHint")}
											destructive
											onConfirm={() =>
												run((s, id) =>
													removeModule(s, id, course.id, module.id)
												)
											}
										>
											<Button
												type="button"
												size="icon-sm"
												variant="ghost"
												aria-label={t("courses.deleteModule", {
													name: module.title,
												})}
											>
												<Trash2 className="size-3.5 text-rose-500" />
											</Button>
										</DemoConfirm>
									</>
								)}
							</div>
							<div className="divide-y divide-slate-100">
								{module.lessons.map((lesson, lessonIndex) => (
									<div
										key={lesson.id}
										className="flex items-center gap-3 px-4 py-3"
									>
										<span className="flex size-9 items-center justify-center rounded-xl bg-[#f0ecff] text-violet-600">
											{lesson.type === "video" ? (
												<Video className="size-4" />
											) : (
												<FileText className="size-4" />
											)}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold text-[#19243b]">
												{formatNumber(lessonIndex + 1)}. {lesson.title}
											</p>
											<p className="mt-1 text-[11px] text-slate-400">
												{t(`courses.types.${lesson.type}`)} ·{" "}
												{t("courses.minutes", { count: lesson.duration })}
											</p>
										</div>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											onClick={() =>
												setLessonTarget({ moduleId: module.id, lesson })
											}
										>
											{t("common.edit")}
										</Button>
										<DemoConfirm
											title={t("courses.deleteLessonTitle")}
											description={t("courses.deleteLessonHint")}
											destructive
											onConfirm={() =>
												run((s, id) =>
													removeLesson(s, id, course.id, module.id, lesson.id)
												)
											}
										>
											<Button
												type="button"
												size="icon-sm"
												variant="ghost"
												aria-label={t("courses.deleteLesson", {
													name: lesson.title,
												})}
											>
												<Trash2 className="size-3.5 text-rose-500" />
											</Button>
										</DemoConfirm>
									</div>
								))}
								{module.lessons.length === 0 && (
									<p className="px-5 py-5 text-xs text-slate-400">
										{t("courses.emptyModule")}
									</p>
								)}
							</div>
							<div className="px-4 pb-4 pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="demo-rounded"
									onClick={() => setLessonTarget({ moduleId: module.id })}
								>
									<Plus className="size-4" />
									{t("courses.addLesson")}
								</Button>
							</div>
						</DemoPanel>
					))}
				</div>
				<div className="space-y-4">
					<DemoPanel className="p-5">
						<h2 className="font-extrabold text-[#19243b]">
							{t("courses.summaryHeading")}
						</h2>
						<div className="mt-4 grid grid-cols-2 gap-3">
							<div className="rounded-2xl bg-violet-50 p-4">
								<Layers3 className="size-5 text-violet-600" />
								<p className="mt-2 text-xl font-extrabold">
									{formatNumber(course.modules.length)}
								</p>
								<p className="text-xs text-slate-500">{t("courses.modules")}</p>
							</div>
							<div className="rounded-2xl bg-emerald-50 p-4">
								<Users className="size-5 text-emerald-600" />
								<p className="mt-2 text-xl font-extrabold">
									{formatNumber(enrollments.length)}
								</p>
								<p className="text-xs text-slate-500">
									{t("overview.stats.students")}
								</p>
							</div>
						</div>
					</DemoPanel>
					<DemoPanel className="p-5">
						<h2 className="font-extrabold text-[#19243b]">
							{t("courses.enrolledStudents")}
						</h2>
						<p className="mt-1 text-xs text-slate-500">
							{t("courses.studentsHint")}
						</p>
						<div className="mt-4 divide-y divide-slate-100">
							{enrollments.map((entry) => {
								const student = state.users.find(
									(person) => person.id === entry.studentId
								);
								return student ? (
									<div key={entry.id} className="flex items-center gap-3 py-3">
										<DemoAvatar user={student} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-xs font-bold">
												{student.name}
											</p>
											<p className="text-[11px] text-slate-400">
												{t("courses.progressValue", {
													value: progressFor(course, entry),
												})}
											</p>
										</div>
										<div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
											<div
												className="h-full bg-violet-600"
												style={{ width: `${progressFor(course, entry)}%` }}
											/>
										</div>
									</div>
								) : null;
							})}
							{enrollments.length === 0 && (
								<p className="py-5 text-xs text-slate-400">
									{t("courses.noStudents")}
								</p>
							)}
						</div>
					</DemoPanel>
				</div>
			</div>
			<DemoCourseForm
				open={courseOpen}
				onOpenChange={setCourseOpen}
				editing={course}
			/>
			<DemoLessonForm
				open={!!lessonTarget}
				onOpenChange={(open) => {
					if (!open) setLessonTarget(undefined);
				}}
				courseId={course.id}
				moduleId={lessonTarget?.moduleId ?? ""}
				editing={lessonTarget?.lesson}
			/>
		</div>
	);
}

function StudentReader({
	course,
	onBack,
}: {
	course: DemoCourse;
	onBack: () => void;
}) {
	const t = useTranslations("demo");
	const { state, actor, run, setSection, formatNumber } = useDemo();
	const lessons = allLessons(course);
	const enrollment = state.enrollments.find(
		(item) => item.courseId === course.id && item.studentId === actor.id
	);
	const [lessonId, setLessonId] = React.useState<string | undefined>();
	const selected =
		lessons.find((lesson) => lesson.id === lessonId) ??
		lessons.find(
			(lesson) => !enrollment?.completedLessonIds.includes(lesson.id)
		) ??
		lessons[0];
	if (!enrollment || !course.published)
		return (
			<DemoEmpty
				title={t("courses.unavailable")}
				action={
					<Button type="button" onClick={onBack}>
						{t("common.back")}
					</Button>
				}
			/>
		);
	const percent = progressFor(course, enrollment);
	const certificate = state.certificates.find(
		(item) =>
			item.courseId === course.id &&
			item.studentId === actor.id &&
			!item.revokedAt
	);
	return (
		<div className="space-y-5">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="-ms-2 text-slate-500"
				onClick={onBack}
			>
				<ArrowLeft className="size-4 rtl:rotate-180" />
				{t("common.back")}
			</Button>
			<DemoPanel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
				<CourseArt course={course} size="small" />
				<div className="min-w-0 flex-1">
					<h1 className="text-xl font-extrabold text-[#19243b]">
						{course.title}
					</h1>
					<p className="mt-1 text-xs text-slate-500">
						{t("courses.progressValue", { value: percent })}
					</p>
					<div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
						<div
							className="h-full rounded-full bg-violet-600 transition-all"
							style={{ width: `${percent}%` }}
						/>
					</div>
				</div>
				{certificate && (
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="demo-rounded"
						onClick={() => setSection("certificates")}
					>
						<Award className="size-4" />
						{t("courses.viewCertificate")}
					</Button>
				)}
			</DemoPanel>
			<div className="grid items-start gap-5 lg:grid-cols-[255px_1fr]">
				<DemoPanel className="overflow-hidden p-0">
					<h2 className="border-b border-slate-100 px-4 py-4 text-sm font-extrabold text-[#19243b]">
						{t("courses.curriculum")}
					</h2>
					{course.modules.map((module) => (
						<div key={module.id}>
							<p className="bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-500">
								{module.title}
							</p>
							{module.lessons.map((lesson) => (
								<button
									key={lesson.id}
									type="button"
									className={`flex w-full items-center gap-2 border-b border-slate-100 px-4 py-3 text-start text-xs transition hover:bg-violet-50 ${selected?.id === lesson.id ? "bg-violet-50 font-bold text-violet-700" : "text-slate-600"}`}
									onClick={() => setLessonId(lesson.id)}
								>
									<span
										className={
											enrollment.completedLessonIds.includes(lesson.id)
												? "text-emerald-600"
												: "text-slate-400"
										}
									>
										{enrollment.completedLessonIds.includes(lesson.id) ? (
											<Check className="size-4" />
										) : (
											<CirclePlay className="size-4" />
										)}
									</span>
									<span className="min-w-0 flex-1">{lesson.title}</span>
								</button>
							))}
						</div>
					))}
				</DemoPanel>
				{selected && (
					<DemoPanel className="min-h-[360px] p-6 sm:p-8">
						<span className="demo-eyebrow">
							{t(`courses.types.${selected.type}`)}
						</span>
						<h2 className="mt-4 text-xl font-extrabold text-[#19243b]">
							{selected.title}
						</h2>
						<p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
							<Clock3 className="size-3.5" />
							{t("courses.minutes", { count: selected.duration })}
						</p>
						{selected.summary && (
							<p className="mt-6 border-s-2 border-violet-300 ps-3 text-sm text-slate-500">
								{selected.summary}
							</p>
						)}
						<p className="mt-6 whitespace-pre-wrap text-sm leading-9 text-slate-700">
							{selected.content}
						</p>
						{/^https?:\/\//i.test(selected.resourceUrl) && (
							<a
								href={selected.resourceUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100"
							>
								<FileText className="size-4" />
								{t("courses.openResource")}
							</a>
						)}
						<div className="mt-8 border-t border-slate-100 pt-5">
							{enrollment.completedLessonIds.includes(selected.id) ? (
								<span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
									<Check className="size-4" />
									{t("courses.lessonDone")}
								</span>
							) : (
								<Button
									type="button"
									className="demo-rounded"
									onClick={() =>
										run(
											(s, id) => completeLesson(s, id, course.id, selected.id),
											t("courses.lessonCompleted")
										)
									}
								>
									<Check className="size-4" />
									{t("courses.markComplete")}
								</Button>
							)}
						</div>
					</DemoPanel>
				)}
			</div>
		</div>
	);
}

export function DemoCourses({
	mode,
}: {
	mode: "courses" | "myCourses" | "explore";
}) {
	const t = useTranslations("demo");
	const { state, actor } = useDemo();
	const [search, setSearch] = React.useState("");
	const [selectedId, setSelectedId] = React.useState<string>();
	const [formOpen, setFormOpen] = React.useState(false);
	const [filter, setFilter] = React.useState("all");
	const managing = mode === "courses";
	const visible = state.courses.filter((course) =>
		mode === "explore"
			? course.published
			: mode === "myCourses"
				? course.published &&
					state.enrollments.some(
						(entry) =>
							entry.courseId === course.id && entry.studentId === actor.id
					)
				: actor.role === "admin" ||
					(actor.role === "teacher" && course.teacherId === actor.id) ||
					(actor.role === "school" && course.schoolId === actor.schoolId)
	);
	const courses = visible.filter(
		(course) =>
			(filter === "all" || (filter === "published") === course.published) &&
			`${course.title} ${course.subject} ${course.description}`
				.toLowerCase()
				.includes(search.trim().toLowerCase())
	);
	const selected = visible.find((item) => item.id === selectedId);
	if (selected)
		return managing ? (
			<CourseEditor course={selected} onBack={() => setSelectedId(undefined)} />
		) : (
			<StudentReader
				course={selected}
				onBack={() => setSelectedId(undefined)}
			/>
		);
	return (
		<>
			<DemoHeading
				eyebrow={t(`roles.${actor.role}`)}
				title={t(`courses.headings.${mode}`)}
				description={t(`courses.descriptions.${mode}`)}
				action={
					managing && (
						<Button
							type="button"
							className="demo-rounded"
							onClick={() => setFormOpen(true)}
						>
							<Plus className="size-4" />
							{t("courses.create")}
						</Button>
					)
				}
			/>
			<div className="mb-5 flex flex-col gap-3 sm:flex-row">
				<div className="relative max-w-lg flex-1">
					<Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
					<Input
						aria-label={t("courses.search")}
						placeholder={t("courses.search")}
						className="demo-input ps-10"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				{managing && (
					<NativeSelect
						value={filter}
						onChange={(event) => setFilter(event.target.value)}
						aria-label={t("courses.filter")}
					>
						<NativeSelectOption value="all">
							{t("courses.all")}
						</NativeSelectOption>
						<NativeSelectOption value="published">
							{t("courses.published")}
						</NativeSelectOption>
						<NativeSelectOption value="draft">
							{t("courses.draft")}
						</NativeSelectOption>
					</NativeSelect>
				)}
			</div>
			{courses.length ? (
				<div className="grid items-stretch gap-5 md:grid-cols-2 2xl:grid-cols-3">
					{courses.map((course) => (
						<CourseCard
							key={course.id}
							course={course}
							mode={managing ? "manage" : mode}
							onOpen={() => setSelectedId(course.id)}
						/>
					))}
				</div>
			) : (
				<DemoEmpty
					icon={GraduationCap}
					title={t("courses.empty")}
					description={t("courses.emptyHint")}
					action={
						managing && (
							<Button type="button" onClick={() => setFormOpen(true)}>
								{t("courses.create")}
							</Button>
						)
					}
				/>
			)}
			<DemoCourseForm open={formOpen} onOpenChange={setFormOpen} />
		</>
	);
}
