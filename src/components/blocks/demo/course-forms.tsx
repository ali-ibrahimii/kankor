"use client";

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
	addLesson,
	createCourse,
	updateCourse,
	updateLesson,
} from "@/lib/demo/actions";
import type { DemoCourse, DemoLesson, DemoLessonType } from "@/lib/demo/types";
import { useDemo } from "./demo-context";
import { DemoField } from "./demo-ui";

export function DemoCourseForm({
	open,
	onOpenChange,
	editing,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editing?: DemoCourse;
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
	const [subject, setSubject] = React.useState("");
	const [teacherId, setTeacherId] = React.useState("");
	const [color, setColor] = React.useState<DemoCourse["color"]>("violet");
	React.useEffect(() => {
		setTitle(editing?.title ?? "");
		setDescription(editing?.description ?? "");
		setSubject(editing?.subject ?? "");
		setTeacherId(editing?.teacherId ?? teachers[0]?.id ?? "");
		setColor(editing?.color ?? "violet");
	}, [editing, open, actor.id]); // a new dialog starts with its current owner
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="demo-dialog">
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						const input = { title, description, subject, teacherId, color };
						const success = editing
							? run((s, id) => updateCourse(s, id, editing.id, input))
							: run(
									(s, id) => createCourse(s, id, input),
									t("courses.created")
								);
						if (success) onOpenChange(false);
					}}
				>
					<DialogHeader>
						<DialogTitle>
							{editing ? t("courses.edit") : t("courses.create")}
						</DialogTitle>
						<DialogDescription>{t("courses.formHint")}</DialogDescription>
					</DialogHeader>
					<DemoField label={t("courses.title")} htmlFor="demo-course-title">
						<Input
							id="demo-course-title"
							className="demo-input"
							required
							maxLength={120}
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
					</DemoField>
					<DemoField label={t("courses.subject")} htmlFor="demo-course-subject">
						<Input
							id="demo-course-subject"
							className="demo-input"
							required
							maxLength={60}
							value={subject}
							onChange={(event) => setSubject(event.target.value)}
						/>
					</DemoField>
					<DemoField
						label={t("courses.description")}
						htmlFor="demo-course-description"
					>
						<Textarea
							id="demo-course-description"
							className="demo-input min-h-24"
							required
							maxLength={800}
							value={description}
							onChange={(event) => setDescription(event.target.value)}
						/>
					</DemoField>
					{actor.role !== "teacher" && (
						<DemoField
							label={t("courses.teacher")}
							htmlFor="demo-course-teacher"
						>
							<NativeSelect
								className="w-full"
								id="demo-course-teacher"
								value={teacherId}
								onChange={(event) => setTeacherId(event.target.value)}
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
						label={t("courses.coverColor")}
						htmlFor="demo-course-color"
					>
						<NativeSelect
							className="w-full"
							id="demo-course-color"
							value={color}
							onChange={(event) =>
								setColor(event.target.value as DemoCourse["color"])
							}
						>
							{(["violet", "sky", "mint", "peach"] as const).map((option) => (
								<NativeSelectOption key={option} value={option}>
									{t(`courses.colors.${option}`)}
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
							{t("common.save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function DemoLessonForm({
	open,
	onOpenChange,
	courseId,
	moduleId,
	editing,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	courseId: string;
	moduleId: string;
	editing?: DemoLesson;
}) {
	const t = useTranslations("demo");
	const { run } = useDemo();
	const [title, setTitle] = React.useState("");
	const [type, setType] = React.useState<DemoLessonType>("video");
	const [duration, setDuration] = React.useState("15");
	const [summary, setSummary] = React.useState("");
	const [content, setContent] = React.useState("");
	const [resourceUrl, setResourceUrl] = React.useState("");
	React.useEffect(() => {
		setTitle(editing?.title ?? "");
		setType(editing?.type ?? "video");
		setDuration(String(editing?.duration ?? 15));
		setSummary(editing?.summary ?? "");
		setContent(editing?.content ?? "");
		setResourceUrl(editing?.resourceUrl ?? "");
	}, [editing, open]);
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="demo-dialog">
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						const input = {
							title,
							type,
							duration: Number(duration),
							summary,
							content,
							resourceUrl,
						};
						const success = editing
							? run((s, id) =>
									updateLesson(s, id, courseId, moduleId, editing.id, input)
								)
							: run((s, id) => addLesson(s, id, courseId, moduleId, input));
						if (success) onOpenChange(false);
					}}
				>
					<DialogHeader>
						<DialogTitle>
							{editing ? t("courses.editLesson") : t("courses.addLesson")}
						</DialogTitle>
						<DialogDescription>{t("courses.lessonHint")}</DialogDescription>
					</DialogHeader>
					<DemoField
						label={t("courses.lessonTitle")}
						htmlFor="demo-lesson-title"
					>
						<Input
							id="demo-lesson-title"
							className="demo-input"
							required
							maxLength={120}
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
					</DemoField>
					<div className="grid grid-cols-2 gap-3">
						<DemoField
							label={t("courses.lessonType")}
							htmlFor="demo-lesson-type"
						>
							<NativeSelect
								className="w-full"
								id="demo-lesson-type"
								value={type}
								onChange={(event) =>
									setType(event.target.value as DemoLessonType)
								}
							>
								{(["video", "text", "pdf"] as const).map((kind) => (
									<NativeSelectOption key={kind} value={kind}>
										{t(`courses.types.${kind}`)}
									</NativeSelectOption>
								))}
							</NativeSelect>
						</DemoField>
						<DemoField
							label={t("courses.duration")}
							htmlFor="demo-lesson-duration"
						>
							<Input
								id="demo-lesson-duration"
								className="demo-input"
								type="number"
								min={1}
								max={600}
								required
								value={duration}
								onChange={(event) => setDuration(event.target.value)}
							/>
						</DemoField>
					</div>
					<DemoField label={t("courses.summary")} htmlFor="demo-lesson-summary">
						<Input
							id="demo-lesson-summary"
							className="demo-input"
							maxLength={300}
							value={summary}
							onChange={(event) => setSummary(event.target.value)}
						/>
					</DemoField>
					<DemoField label={t("courses.content")} htmlFor="demo-lesson-content">
						<Textarea
							id="demo-lesson-content"
							className="demo-input min-h-28"
							required
							maxLength={10000}
							value={content}
							onChange={(event) => setContent(event.target.value)}
						/>
					</DemoField>
					<DemoField label={t("courses.resourceUrl")} htmlFor="demo-lesson-url">
						<Input
							id="demo-lesson-url"
							className="demo-input"
							type="url"
							placeholder="https://..."
							value={resourceUrl}
							onChange={(event) => setResourceUrl(event.target.value)}
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
