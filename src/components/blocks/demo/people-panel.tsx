"use client";

import {
	Building2,
	Mail,
	MapPin,
	Plus,
	Search,
	ShieldCheck,
	UserPlus,
	Users,
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
import {
	assignSchool,
	createSchool,
	createUser,
	progressFor,
	setSchoolStatus,
	setUserStatus,
	updateProfile,
	updateSchool,
} from "@/lib/demo/actions";
import type {
	DemoRole,
	DemoSchool,
	DemoStatus,
	DemoUser,
} from "@/lib/demo/types";
import { useDemo } from "./demo-context";
import {
	DemoAvatar,
	DemoEmpty,
	DemoField,
	DemoHeading,
	DemoPanel,
	DemoStatusBadge,
} from "./demo-ui";

function PersonDialog({
	open,
	onOpenChange,
	editing,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editing?: DemoUser;
}) {
	const t = useTranslations("demo");
	const { state, actor, run } = useDemo();
	const [name, setName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [role, setRole] = React.useState<"student" | "teacher">("student");
	const [schoolId, setSchoolId] = React.useState("");
	React.useEffect(() => {
		setName(editing?.name ?? "");
		setEmail(editing?.email ?? "");
		setRole(editing?.role === "teacher" ? "teacher" : "student");
		setSchoolId(
			editing?.schoolId ??
				(actor.role === "school" ? (actor.schoolId ?? "") : "")
		);
	}, [editing, actor.role, actor.schoolId, open]);
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="demo-dialog">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						const success = editing
							? run((state, id) =>
									updateProfile(state, id, editing.id, name, email)
								)
							: run((state, id) =>
									createUser(state, id, {
										name,
										email,
										role,
										schoolId: schoolId || undefined,
									})
								);
						if (success) onOpenChange(false);
					}}
					className="space-y-4"
				>
					<DialogHeader>
						<DialogTitle>
							{editing ? t("people.editPerson") : t("people.addPerson")}
						</DialogTitle>
						<DialogDescription>{t("people.formHint")}</DialogDescription>
					</DialogHeader>
					<DemoField label={t("people.name")} htmlFor="demo-person-name">
						<Input
							id="demo-person-name"
							className="demo-input"
							required
							maxLength={120}
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</DemoField>
					<DemoField label={t("people.email")} htmlFor="demo-person-email">
						<Input
							id="demo-person-email"
							type="email"
							className="demo-input"
							required
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</DemoField>
					{!editing && (
						<>
							<DemoField label={t("people.role")} htmlFor="demo-person-role">
								<NativeSelect
									id="demo-person-role"
									className="w-full"
									value={role}
									onChange={(event) =>
										setRole(event.target.value as "student" | "teacher")
									}
								>
									<NativeSelectOption value="student">
										{t("roles.student")}
									</NativeSelectOption>
									<NativeSelectOption value="teacher">
										{t("roles.teacher")}
									</NativeSelectOption>
								</NativeSelect>
							</DemoField>
							{actor.role === "admin" && (
								<DemoField
									label={t("people.school")}
									htmlFor="demo-person-school"
								>
									<NativeSelect
										id="demo-person-school"
										className="w-full"
										value={schoolId}
										onChange={(event) => setSchoolId(event.target.value)}
									>
										<NativeSelectOption value="">
											{t("people.noSchool")}
										</NativeSelectOption>
										{state.schools.map((school) => (
											<NativeSelectOption key={school.id} value={school.id}>
												{school.name}
											</NativeSelectOption>
										))}
									</NativeSelect>
								</DemoField>
							)}
						</>
					)}
					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" className="demo-rounded">
							{t("common.save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function SchoolDialog({
	open,
	onOpenChange,
	editing,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editing?: DemoSchool;
}) {
	const t = useTranslations("demo");
	const { run } = useDemo();
	const [name, setName] = React.useState("");
	const [city, setCity] = React.useState("");
	const [email, setEmail] = React.useState("");
	React.useEffect(() => {
		setName(editing?.name ?? "");
		setCity(editing?.city ?? "");
		setEmail(editing?.email ?? "");
	}, [editing, open]);
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="demo-dialog">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						const input = { name, city, email };
						const success = editing
							? run((state, id) => updateSchool(state, id, editing.id, input))
							: run((state, id) => createSchool(state, id, input));
						if (success) onOpenChange(false);
					}}
					className="space-y-4"
				>
					<DialogHeader>
						<DialogTitle>
							{editing ? t("schools.edit") : t("schools.create")}
						</DialogTitle>
						<DialogDescription>{t("schools.formHint")}</DialogDescription>
					</DialogHeader>
					<DemoField label={t("schools.name")} htmlFor="demo-school-name">
						<Input
							id="demo-school-name"
							className="demo-input"
							required
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</DemoField>
					<DemoField label={t("schools.city")} htmlFor="demo-school-city">
						<Input
							id="demo-school-city"
							className="demo-input"
							required
							value={city}
							onChange={(event) => setCity(event.target.value)}
						/>
					</DemoField>
					<DemoField label={t("people.email")} htmlFor="demo-school-email">
						<Input
							id="demo-school-email"
							type="email"
							className="demo-input"
							required
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</DemoField>
					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" className="demo-rounded">
							{t("common.save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function SchoolList() {
	const t = useTranslations("demo");
	const { state, run } = useDemo();
	const [open, setOpen] = React.useState(false);
	const [editingId, setEditingId] = React.useState<string>();
	const editing = state.schools.find((school) => school.id === editingId);
	return (
		<>
			<DemoHeading
				eyebrow={t("roles.admin")}
				title={t("schools.heading")}
				description={t("schools.description")}
				action={
					<Button
						type="button"
						className="demo-rounded"
						onClick={() => {
							setEditingId(undefined);
							setOpen(true);
						}}
					>
						<Plus className="size-4" />
						{t("schools.create")}
					</Button>
				}
			/>
			<div className="grid gap-4 lg:grid-cols-2">
				{state.schools.map((school) => {
					const members = state.users.filter(
						(person) =>
							person.schoolId === school.id &&
							(person.role === "teacher" || person.role === "student")
					);
					return (
						<DemoPanel key={school.id} className="p-5 sm:p-6">
							<div className="flex items-start justify-between gap-3">
								<span className="demo-stat-icon demo-stat-icon--violet">
									<Building2 className="size-5" />
								</span>
								<DemoStatusBadge status={school.status} />
							</div>
							<h3 className="mt-4 text-lg font-extrabold text-[#19243b]">
								{school.name}
							</h3>
							<p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
								<MapPin className="size-3.5" />
								{school.city}
								<span className="mx-1 text-slate-300">·</span>
								<Users className="size-3.5" />
								{t("schools.members", { count: members.length })}
							</p>
							<p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
								<Mail className="size-3.5" />
								{school.email}
							</p>
							<div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="demo-rounded"
									onClick={() => {
										setEditingId(school.id);
										setOpen(true);
									}}
								>
									{t("common.edit")}
								</Button>
								{school.status !== "active" && (
									<Button
										type="button"
										size="sm"
										className="demo-rounded"
										onClick={() =>
											run((s, id) =>
												setSchoolStatus(s, id, school.id, "active")
											)
										}
									>
										<ShieldCheck className="size-4" />
										{t("people.approve")}
									</Button>
								)}
								{school.status === "active" && (
									<Button
										type="button"
										size="sm"
										variant="destructive"
										onClick={() =>
											run((s, id) =>
												setSchoolStatus(s, id, school.id, "suspended")
											)
										}
									>
										{t("people.suspend")}
									</Button>
								)}
							</div>
						</DemoPanel>
					);
				})}
			</div>
			<SchoolDialog open={open} onOpenChange={setOpen} editing={editing} />
		</>
	);
}

export function DemoPeople({
	mode,
}: {
	mode: "people" | "members" | "students" | "schools";
}) {
	const t = useTranslations("demo");
	const { state, actor, run, formatNumber } = useDemo();
	const [search, setSearch] = React.useState("");
	const [roleFilter, setRoleFilter] = React.useState("all");
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [editingId, setEditingId] = React.useState<string>();
	if (mode === "schools") return <SchoolList />;
	const managedCourseIds = state.courses
		.filter((course) => course.teacherId === actor.id)
		.map((course) => course.id);
	const visibleIds =
		mode === "students"
			? new Set([
					...state.enrollments
						.filter((item) => managedCourseIds.includes(item.courseId))
						.map((item) => item.studentId),
					...state.classrooms
						.filter((item) => item.teacherId === actor.id)
						.flatMap((item) => item.memberIds),
				])
			: undefined;
	const visible = state.users.filter((person) =>
		mode === "people"
			? true
			: mode === "members"
				? person.schoolId === actor.schoolId &&
					(person.role === "teacher" || person.role === "student")
				: person.role === "student" && visibleIds?.has(person.id)
	);
	const results = visible.filter(
		(person) =>
			(roleFilter === "all" || person.role === roleFilter) &&
			`${person.name} ${person.email}`
				.toLowerCase()
				.includes(search.trim().toLowerCase())
	);
	const editing = state.users.find((person) => person.id === editingId);
	return (
		<>
			<DemoHeading
				eyebrow={t(`roles.${actor.role}`)}
				title={t(`people.headings.${mode}`)}
				description={t(`people.descriptions.${mode}`)}
				action={
					mode !== "students" && (
						<Button
							type="button"
							className="demo-rounded"
							onClick={() => {
								setEditingId(undefined);
								setDialogOpen(true);
							}}
						>
							<UserPlus className="size-4" />
							{t("people.addPerson")}
						</Button>
					)
				}
			/>
			<div className="mb-5 flex flex-col gap-3 sm:flex-row">
				<div className="relative max-w-lg flex-1">
					<Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="demo-input ps-10"
						aria-label={t("people.search")}
						placeholder={t("people.search")}
					/>
				</div>
				{mode !== "students" && (
					<NativeSelect
						value={roleFilter}
						onChange={(event) => setRoleFilter(event.target.value)}
						aria-label={t("people.filterRole")}
					>
						<NativeSelectOption value="all">
							{t("people.allRoles")}
						</NativeSelectOption>
						{(
							[
								"teacher",
								"student",
								...(mode === "people" ? ["school", "admin"] : []),
							] as DemoRole[]
						).map((role) => (
							<NativeSelectOption key={role} value={role}>
								{t(`roles.${role}`)}
							</NativeSelectOption>
						))}
					</NativeSelect>
				)}
			</div>
			{results.length ? (
				<DemoPanel className="overflow-hidden">
					<div className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-slate-500">
						{t("people.resultCount", { count: results.length })}
					</div>
					<div className="divide-y divide-slate-100">
						{results.map((person) => {
							const enrolled = state.enrollments.filter(
								(entry) =>
									entry.studentId === person.id &&
									(mode !== "students" ||
										managedCourseIds.includes(entry.courseId))
							);
							return (
								<div
									key={person.id}
									className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center"
								>
									<div className="flex min-w-0 flex-1 items-center gap-3">
										<DemoAvatar user={person} />
										<div className="min-w-0">
											<p className="truncate text-sm font-bold text-[#19243b]">
												{person.name}
											</p>
											<p className="truncate text-xs text-slate-400" dir="ltr">
												{person.email}
											</p>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<span className="demo-role-pill">
											{t(`roles.${person.role}`)}
										</span>
										<DemoStatusBadge status={person.status} />
										{mode === "students" ? (
											<span className="text-xs text-slate-500">
												{t("people.progressSummary", {
													count: enrolled.length,
													progress: enrolled.length
														? Math.round(
																enrolled.reduce(
																	(total, entry) =>
																		total +
																		progressFor(
																			state.courses.find(
																				(course) => course.id === entry.courseId
																			)!,
																			entry
																		),
																	0
																) / enrolled.length
															)
														: 0,
												})}
											</span>
										) : (
											<>
												{(person.role === "student" ||
													person.role === "teacher") &&
													actor.role === "admin" && (
														<NativeSelect
															size="sm"
															value={person.schoolId ?? ""}
															aria-label={t("people.schoolFor", {
																name: person.name,
															})}
															onChange={(event) =>
																run((s, id) =>
																	assignSchool(
																		s,
																		id,
																		person.id,
																		event.target.value || undefined
																	)
																)
															}
														>
															<NativeSelectOption value="">
																{t("people.noSchool")}
															</NativeSelectOption>
															{state.schools.map((school) => (
																<NativeSelectOption
																	key={school.id}
																	value={school.id}
																>
																	{school.name}
																</NativeSelectOption>
															))}
														</NativeSelect>
													)}
												{(person.role === "teacher" ||
													person.role === "student") && (
													<>
														<Button
															type="button"
															variant="outline"
															size="sm"
															className="demo-rounded"
															onClick={() => {
																setEditingId(person.id);
																setDialogOpen(true);
															}}
															disabled={actor.role !== "admin"}
														>
															{t("common.edit")}
														</Button>
														{person.status === "active" ? (
															<Button
																type="button"
																variant="destructive"
																size="sm"
																onClick={() =>
																	run((s, id) =>
																		setUserStatus(s, id, person.id, "suspended")
																	)
																}
															>
																{t("people.suspend")}
															</Button>
														) : (
															<Button
																type="button"
																variant="outline"
																size="sm"
																className="demo-rounded"
																onClick={() =>
																	run((s, id) =>
																		setUserStatus(s, id, person.id, "active")
																	)
																}
															>
																{t("people.approve")}
															</Button>
														)}
													</>
												)}
											</>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</DemoPanel>
			) : (
				<DemoEmpty
					icon={Users}
					title={t("people.empty")}
					description={t("people.emptyHint")}
				/>
			)}
			<PersonDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				editing={editing}
			/>
		</>
	);
}
