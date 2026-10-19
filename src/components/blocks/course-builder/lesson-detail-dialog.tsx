"use client";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { patchLessonAtom } from "./store";
import type { DraftLesson, LessonContentType } from "./types";

// ─── Content type options ─────────────────────────────────────────────────────

const CONTENT_TYPE_OPTIONS: { value: LessonContentType; labelKey: string }[] = [
	{ value: "video", labelKey: "contentType.video" },
	{ value: "text", labelKey: "contentType.text" },
	{ value: "audio", labelKey: "contentType.audio" },
	{ value: "pdf_document", labelKey: "contentType.pdf_document" },
	{ value: "slide_presentation", labelKey: "contentType.slide_presentation" },
	{ value: "quiz", labelKey: "contentType.quiz" },
	{ value: "assignment", labelKey: "contentType.assignment" },
	{ value: "external_resource", labelKey: "contentType.external_resource" },
	{ value: "code_playground", labelKey: "contentType.code_playground" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface LessonDetailDialogProps {
	lesson: DraftLesson | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LessonDetailDialog({
	lesson,
	open,
	onOpenChange,
}: LessonDetailDialogProps) {
	const t = useTranslations("courseBuilder");
	const patchLesson = useSetAtom(patchLessonAtom);

	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [contentType, setContentType] =
		React.useState<LessonContentType>("video");
	const [isPreviewable, setIsPreviewable] = React.useState(false);
	const [isMandatory, setIsMandatory] = React.useState(true);
	const [durationMin, setDurationMin] = React.useState("");

	React.useEffect(() => {
		if (lesson) {
			setTitle(lesson.title);
			setDescription(lesson.description ?? "");
			setContentType(lesson.content_type);
			setIsPreviewable(lesson.is_previewable);
			setIsMandatory(lesson.is_mandatory);
			setDurationMin(lesson.estimated_duration_minutes?.toString() ?? "");
		}
	}, [lesson]);

	function handleSave() {
		if (!lesson) return;
		patchLesson({
			id: lesson.id,
			patch: {
				title: title.trim() || t("lesson.untitled"),
				description: description.trim() || null,
				content_type: contentType,
				is_previewable: isPreviewable,
				is_mandatory: isMandatory,
				estimated_duration_minutes: durationMin ? Number(durationMin) : null,
			},
		});
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("lesson.editDetails")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Title */}
					<div className="space-y-1.5">
						<Label htmlFor="les-title">{t("lesson.titleLabel")}</Label>
						<Input
							id="les-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("lesson.titlePlaceholder")}
							autoFocus
						/>
					</div>

					{/* Description */}
					<div className="space-y-1.5">
						<Label htmlFor="les-desc">{t("lesson.descriptionLabel")}</Label>
						<Textarea
							id="les-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("lesson.descriptionPlaceholder")}
							rows={2}
						/>
					</div>

					{/* Content type */}
					<div className="space-y-1.5">
						<Label htmlFor="les-type">{t("lesson.contentType")}</Label>
						<Select
							value={contentType}
							onValueChange={(v) => setContentType(v as LessonContentType)}
						>
							<SelectTrigger id="les-type">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CONTENT_TYPE_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{t(opt.labelKey as Parameters<typeof t>[0])}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Duration */}
					<div className="space-y-1.5">
						<Label htmlFor="les-duration">
							{t("lesson.estimatedDuration")}
						</Label>
						<Input
							id="les-duration"
							type="number"
							min="0"
							value={durationMin}
							onChange={(e) => setDurationMin(e.target.value)}
							placeholder="—"
						/>
					</div>

					{/* Toggles */}
					<div className="space-y-2">
						<div className="flex items-center justify-between rounded-lg border p-3">
							<div>
								<p className="text-sm font-medium">{t("lesson.previewable")}</p>
								<p className="text-xs text-muted-foreground">
									{t("lesson.previewableDescription")}
								</p>
							</div>
							<Switch
								checked={isPreviewable}
								onCheckedChange={setIsPreviewable}
							/>
						</div>

						<div className="flex items-center justify-between rounded-lg border p-3">
							<div>
								<p className="text-sm font-medium">{t("lesson.mandatory")}</p>
								<p className="text-xs text-muted-foreground">
									{t("lesson.mandatoryDescription")}
								</p>
							</div>
							<Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button onClick={handleSave}>{t("common.save")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
