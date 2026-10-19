"use client";

import {
	ArrowLeft,
	BookOpen,
	Check,
	Clock3,
	Copy,
	Link2,
	Plus,
	RefreshCw,
	School,
	Send,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
	addClassroomMember,
	createClassroom,
	regenerateJoinCode,
	removeClassroomMember,
	requestToJoin,
	respondToJoin,
} from "@/lib/demo/actions";
import type { DemoClassroom } from "@/lib/demo/types";
import { routes } from "@/lib/routes";
import { useDemo } from "./demo-context";
import {
	CopyButton,
	DemoAvatar,
	DemoConfirm,
	DemoEmpty,
	DemoField,
	DemoHeading,
	DemoPanel,
} from "./demo-ui";

function CreateClassroomDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useTranslations("demo");
	const { state, actor, run } = useDemo();
	const teachers = state.users.filter(
		(person) =>
			person.role === "teacher" &&
			person.status === "active" &&
			(actor.role === "admin" ||
				(actor.role === "teacher" && person.id === actor.id) ||
				(actor.role === "school" && person.schoolId === actor.schoolId))
	);
	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [teacherId, setTeacherId] = React.useState("");
	const [courseId, setCourseId] = React.useState("");
	React.useEffect(() => {
		if (open) {
			setTitle("");
			setDescription("");
			setTeacherId(teachers[0]?.id ?? "");
			setCourseId("");
		}
	}, [open, actor.id]);
	const courses = state.courses.filter((item) => item.teacherId === teacherId);
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="demo-dialog">
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						const success = run(
							(s, id) =>
								createClassroom(s, id, {
									title,
									description,
									teacherId,
									courseId: courseId || undefined,
								}),
							t("classrooms.created")
						);
						if (success) onOpenChange(false);
					}}
				>
					<DialogHeader>
						<DialogTitle>{t("classrooms.create")}</DialogTitle>
						<DialogDescription>{t("classrooms.createHint")}</DialogDescription>
					</DialogHeader>
					<DemoField
						label={t("classrooms.name")}
						htmlFor="demo-classroom-title"
					>
						<Input
							id="demo-classroom-title"
							className="demo-input"
							required
							value={title}
							maxLength={120}
							onChange={(event) => setTitle(event.target.value)}
						/>
					</DemoField>
					<DemoField
						label={t("courses.description")}
						htmlFor="demo-classroom-desc"
					>
						<Textarea
							id="demo-classroom-desc"
							className="demo-input"
							value={description}
							maxLength={800}
							onChange={(event) => setDescription(event.target.value)}
						/>
					</DemoField>
					{actor.role !== "teacher" && (
						<DemoField
							label={t("courses.teacher")}
							htmlFor="demo-classroom-teacher"
						>
							<NativeSelect
								className="w-full"
								id="demo-classroom-teacher"
								value={teacherId}
								onChange={(event) => {
									setTeacherId(event.target.value);
									setCourseId("");
								}}
								required
							>
								{teachers.map((teacher) => (
									<NativeSelectOption key={teacher.id} value={teacher.id}>
										{teacher.name}
									</NativeSelectOption>
								))}
							</NativeSelect>
						</DemoField>
					)}
					<DemoField
						label={t("classrooms.course")}
						htmlFor="demo-classroom-course"
					>
						<NativeSelect
							className="w-full"
							id="demo-classroom-course"
							value={courseId}
							onChange={(event) => setCourseId(event.target.value)}
						>
							<NativeSelectOption value="">
								{t("classrooms.noCourse")}
							</NativeSelectOption>
							{courses.map((course) => (
								<NativeSelectOption key={course.id} value={course.id}>
									{course.title}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</DemoField>
					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							className="demo-rounded"
							disabled={!teacherId}
						>
							{t("classrooms.create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function ClassroomDetails({
	classroom,
	locale,
	onBack,
}: {
	classroom: DemoClassroom;
	locale: string;
	onBack: () => void;
}) {
	const t = useTranslations("demo");
	const { state, actor, run, setSection, formatDate } = useDemo();
	const [origin, setOrigin] = React.useState("");
	const [newMember, setNewMember] = React.useState("");
	React.useEffect(() => setOrigin(window.location.origin), []);
	const invitePath = routes.demo.page(
		{ invite: classroom.joinCode },
		{ locale }
	);
	const inviteLink = `${origin}${invitePath}`;
	const teacher = state.users.find(
		(person) => person.id === classroom.teacherId
	);
	const course = state.courses.find((item) => item.id === classroom.courseId);
	const canManage =
		actor.role === "admin" ||
		(actor.role === "teacher" && actor.id === classroom.teacherId) ||
		(actor.role === "school" && actor.schoolId === classroom.schoolId);
	const candidates = state.users.filter(
		(person) =>
			person.role === "student" &&
			person.status === "active" &&
			!classroom.memberIds.includes(person.id)
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
			<DemoPanel className="overflow-hidden p-0">
				<div className="demo-class-banner px-6 py-7 text-white">
					<span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">
						{t("classrooms.label")}
					</span>
					<h1 className="mt-3 text-2xl font-extrabold">{classroom.title}</h1>
					<p className="mt-2 max-w-2xl text-sm text-white/75">
						{classroom.description}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-4 px-6 py-4 text-xs text-slate-500">
					<span className="flex items-center gap-1.5">
						<Users className="size-4" />
						{t("classrooms.memberCount", { count: classroom.memberIds.length })}
					</span>
					<span className="flex items-center gap-1.5">
						<Clock3 className="size-4" />
						{formatDate(classroom.createdAt)}
					</span>
					{teacher && <span>{teacher.name}</span>}
				</div>
			</DemoPanel>
			{course && (
				<DemoPanel className="flex flex-wrap items-center gap-3 p-5">
					<BookOpen className="size-5 text-violet-600" />
					<div className="min-w-0 flex-1">
						<p className="text-xs text-slate-400">
							{t("classrooms.linkedCourse")}
						</p>
						<p className="mt-1 font-bold text-[#19243b]">{course.title}</p>
					</div>
					{!canManage && course.published && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="demo-rounded"
							onClick={() => setSection("explore")}
						>
							{t("common.view")}
						</Button>
					)}
				</DemoPanel>
			)}
			{canManage && (
				<>
					<DemoPanel className="p-5 sm:p-6">
						<h2 className="text-base font-extrabold text-[#19243b]">
							{t("classrooms.inviteHeading")}
						</h2>
						<p className="mt-1 text-xs leading-6 text-slate-500">
							{t("classrooms.inviteHint")}
						</p>
						<div className="mt-4 flex flex-wrap items-center gap-2">
							<code
								className="rounded-2xl bg-violet-50 px-4 py-2.5 font-mono text-base font-bold tracking-widest text-violet-700"
								dir="ltr"
							>
								{classroom.joinCode}
							</code>
							<CopyButton
								text={classroom.joinCode}
								label={t("classrooms.copyCode")}
							/>
							<CopyButton text={inviteLink} label={t("classrooms.copyLink")} />
						</div>
						<div
							className="mt-4 break-all rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-start text-[11px] text-slate-500"
							dir="ltr"
						>
							{inviteLink}
						</div>
						<DemoConfirm
							title={t("classrooms.regenerateTitle")}
							description={t("classrooms.regenerateHint")}
							onConfirm={() =>
								run((s, id) => regenerateJoinCode(s, id, classroom.id))
							}
						>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="mt-3 text-violet-700"
							>
								<RefreshCw className="size-3.5" />
								{t("classrooms.regenerate")}
							</Button>
						</DemoConfirm>
					</DemoPanel>
					<div className="grid gap-5 lg:grid-cols-2">
						<DemoPanel className="p-5">
							<h2 className="font-extrabold text-[#19243b]">
								{t("classrooms.requests")}
							</h2>
							<p className="mt-1 text-xs text-slate-500">
								{t("classrooms.requestsHint")}
							</p>
							<div className="mt-4 divide-y divide-slate-100">
								{classroom.requestIds.map((studentId) => {
									const student = state.users.find(
										(person) => person.id === studentId
									);
									return student ? (
										<div
											key={studentId}
											className="flex flex-wrap items-center gap-2 py-3"
										>
											<DemoAvatar user={student} />
											<span className="min-w-0 flex-1 text-xs font-bold">
												{student.name}
											</span>
											<Button
												type="button"
												size="sm"
												className="demo-rounded"
												onClick={() =>
													run((s, id) =>
														respondToJoin(s, id, classroom.id, studentId, true)
													)
												}
											>
												<Check className="size-3.5" />
												{t("classrooms.approve")}
											</Button>
											<Button
												type="button"
												size="icon-sm"
												variant="ghost"
												aria-label={t("classrooms.reject", {
													name: student.name,
												})}
												onClick={() =>
													run((s, id) =>
														respondToJoin(s, id, classroom.id, studentId, false)
													)
												}
											>
												<X className="size-4 text-rose-500" />
											</Button>
										</div>
									) : null;
								})}
								{!classroom.requestIds.length && (
									<p className="py-6 text-xs text-slate-400">
										{t("classrooms.noRequests")}
									</p>
								)}
							</div>
						</DemoPanel>
						<DemoPanel className="p-5">
							<h2 className="font-extrabold text-[#19243b]">
								{t("classrooms.students")}
							</h2>
							<div className="mt-3 flex gap-2">
								<NativeSelect
									className="min-w-0 flex-1"
									aria-label={t("classrooms.addStudent")}
									value={newMember}
									onChange={(event) => setNewMember(event.target.value)}
								>
									<NativeSelectOption value="">
										{t("classrooms.selectStudent")}
									</NativeSelectOption>
									{candidates.map((person) => (
										<NativeSelectOption key={person.id} value={person.id}>
											{person.name}
										</NativeSelectOption>
									))}
								</NativeSelect>
								<Button
									type="button"
									size="sm"
									className="demo-rounded"
									disabled={!newMember}
									onClick={() => {
										if (
											run((s, id) =>
												addClassroomMember(s, id, classroom.id, newMember)
											)
										)
											setNewMember("");
									}}
								>
									<UserPlus className="size-4" />
									{t("common.add")}
								</Button>
							</div>
							<div className="mt-4 divide-y divide-slate-100">
								{classroom.memberIds.map((studentId) => {
									const student = state.users.find(
										(person) => person.id === studentId
									);
									return student ? (
										<div
											key={studentId}
											className="flex items-center gap-2 py-3"
										>
											<DemoAvatar user={student} />
											<span className="min-w-0 flex-1 text-xs font-bold">
												{student.name}
											</span>
											<DemoConfirm
												destructive
												title={t("classrooms.removeTitle")}
												description={t("classrooms.removeHint")}
												onConfirm={() =>
													run((s, id) =>
														removeClassroomMember(
															s,
															id,
															classroom.id,
															studentId
														)
													)
												}
											>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="text-rose-600"
												>
													{t("common.remove")}
												</Button>
											</DemoConfirm>
										</div>
									) : null;
								})}
								{!classroom.memberIds.length && (
									<p className="py-6 text-xs text-slate-400">
										{t("classrooms.noStudents")}
									</p>
								)}
							</div>
						</DemoPanel>
					</div>
				</>
			)}
			{!canManage && (
				<DemoPanel className="p-5">
					<h2 className="font-extrabold text-[#19243b]">
						{t("classrooms.youAreMember")}
					</h2>
					<p className="mt-2 text-sm text-slate-500">
						{t("classrooms.memberHint")}
					</p>
				</DemoPanel>
			)}
		</div>
	);
}

export function DemoClassrooms({
	invitation,
	locale,
}: {
	invitation?: string;
	locale: string;
}) {
	const t = useTranslations("demo");
	const { state, actor, run, formatNumber } = useDemo();
	const [selectedId, setSelectedId] = React.useState<string>();
	const [createOpen, setCreateOpen] = React.useState(false);
	const [code, setCode] = React.useState(invitation ?? "");
	const isStudent = actor.role === "student";
	const visible = state.classrooms.filter((room) =>
		isStudent
			? room.memberIds.includes(actor.id) || room.requestIds.includes(actor.id)
			: actor.role === "admin" ||
				(actor.role === "teacher" && room.teacherId === actor.id) ||
				(actor.role === "school" && room.schoolId === actor.schoolId)
	);
	const selected = visible.find((room) => room.id === selectedId);
	if (selected)
		return (
			<ClassroomDetails
				classroom={selected}
				locale={locale}
				onBack={() => setSelectedId(undefined)}
			/>
		);
	return (
		<>
			<DemoHeading
				eyebrow={t(`roles.${actor.role}`)}
				title={t("classrooms.heading")}
				description={t(
					isStudent ? "classrooms.studentDescription" : "classrooms.description"
				)}
				action={
					!isStudent && (
						<Button
							type="button"
							className="demo-rounded"
							onClick={() => setCreateOpen(true)}
						>
							<Plus className="size-4" />
							{t("classrooms.create")}
						</Button>
					)
				}
			/>
			{isStudent && (
				<DemoPanel className="mb-6 flex flex-col gap-4 border-violet-100 bg-[linear-gradient(115deg,#f4f0ff,#fff)] p-5 sm:flex-row sm:items-center sm:p-6">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
						<Link2 className="size-5" />
					</div>
					<div className="min-w-0 flex-1">
						<h2 className="font-extrabold text-[#19243b]">
							{t("classrooms.joinHeading")}
						</h2>
						<p className="mt-1 text-xs leading-6 text-slate-500">
							{t("classrooms.joinHint")}
						</p>
					</div>
					<form
						className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
						onSubmit={(event) => {
							event.preventDefault();
							if (
								run(
									(s, id) => requestToJoin(s, id, code),
									t("classrooms.requested")
								)
							)
								setCode("");
						}}
					>
						<Input
							value={code}
							onChange={(event) => setCode(event.target.value)}
							className="demo-input w-full sm:w-56"
							aria-label={t("classrooms.codeOrLink")}
							placeholder={t("classrooms.codeOrLink")}
							required
						/>
						<Button type="submit" className="demo-rounded">
							<Send className="size-4" />
							{t("classrooms.join")}
						</Button>
					</form>
				</DemoPanel>
			)}
			{visible.length ? (
				<div className="grid gap-4 lg:grid-cols-2">
					{visible.map((room) => {
						const pending = room.requestIds.includes(actor.id);
						const course = state.courses.find(
							(item) => item.id === room.courseId
						);
						return (
							<DemoPanel key={room.id} className="overflow-hidden p-0">
								<div className="demo-class-banner relative min-h-32 overflow-hidden p-5 text-white">
									<span className="relative z-10 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold">
										{t("classrooms.label")}
									</span>
									<School className="absolute end-7 top-6 size-24 text-white/10" />
									<h3 className="relative z-10 mt-4 text-lg font-extrabold">
										{room.title}
									</h3>
								</div>
								<div className="p-5">
									<p className="min-h-10 text-xs leading-6 text-slate-500">
										{room.description}
									</p>
									<div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
										<span className="flex items-center gap-1.5">
											<Users className="size-3.5" />
											{t("classrooms.memberCount", {
												count: room.memberIds.length,
											})}
										</span>
										{course && (
											<span className="flex items-center gap-1.5">
												<BookOpen className="size-3.5" />
												{course.title}
											</span>
										)}
									</div>
									<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
										<span
											className="text-[11px] font-bold text-violet-700"
											dir="ltr"
										>
											{isStudent
												? pending
													? t("classrooms.pending")
													: t("classrooms.member")
												: room.joinCode}
										</span>
										<Button
											type="button"
											size="sm"
											variant="outline"
											className="demo-rounded"
											onClick={() => setSelectedId(room.id)}
											disabled={pending}
										>
											{t(isStudent ? "common.view" : "classrooms.manage")}
										</Button>
									</div>
								</div>
							</DemoPanel>
						);
					})}
				</div>
			) : (
				<DemoEmpty
					icon={School}
					title={t("classrooms.empty")}
					description={t(
						isStudent
							? "classrooms.emptyStudentHint"
							: "classrooms.emptyManagerHint"
					)}
					action={
						!isStudent && (
							<Button type="button" onClick={() => setCreateOpen(true)}>
								{t("classrooms.create")}
							</Button>
						)
					}
				/>
			)}
			<CreateClassroomDialog open={createOpen} onOpenChange={setCreateOpen} />
		</>
	);
}
