"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useAppForm } from "@/hooks/use-form";
import { createDiscussionThreadAction } from "@/lib/actions/discussions";
import type {
	DiscussionResourceType,
	DiscussionThreadType,
} from "@/types/discussion.types";
import { DuplicateThreadDrawer } from "./DuplicateThreadDrawer";

interface CreateThreadModalProps {
	resource_type: DiscussionResourceType;
	resource_id: string;
	onSuccess?: () => void;
}

export function CreateThreadModal({
	resource_type,
	resource_id,
	onSuccess,
}: CreateThreadModalProps) {
	const t = useTranslations("discussions");
	const [open, setOpen] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			type: "question" as DiscussionThreadType,
			title: "",
			content: "",
			tagsInput: "",
		},
		onSubmit: async ({ value }) => {
			setErrorMsg(null);
			try {
				const parsedTags = value.tagsInput
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean);

				await createDiscussionThreadAction({
					title: value.title,
					content: value.content,
					resource_type,
					resource_id,
					type: value.type,
					tags: parsedTags,
				});

				form.reset();
				setOpen(false);
				if (onSuccess) onSuccess();
			} catch (err: any) {
				setErrorMsg(err.message || t("errors.create_failed"));
			}
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2 font-medium shadow-sm">
					<Plus className="w-4 h-4" />
					{t("new_thread")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("create_thread_title")}</DialogTitle>
					<DialogDescription>{t("create_thread_subtitle")}</DialogDescription>
				</DialogHeader>

				<form.AppForm>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4 pt-2"
					>
						{errorMsg && (
							<div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 border border-rose-200 rounded-md">
								{errorMsg}
							</div>
						)}

						{/* Type Selection */}
						<form.AppField name="type">
							{(field) => (
								<field.SelectField
									label={t("thread_type")}
									options={[
										{
											value: "question",
											label: `❓ ${t("types.question")}`,
										},
										{
											value: "discussion",
											label: `💬 ${t("types.discussion")}`,
										},
										{ value: "tip", label: `💡 ${t("types.tip")}` },
										{
											value: "report_mistake",
											label: `🚩 ${t("types.report_mistake")}`,
										},
										{
											value: "announcement",
											label: `📢 ${t("types.announcement")}`,
										},
									]}
								/>
							)}
						</form.AppField>

						{/* Title */}
						<form.AppField
							name="title"
							validators={{
								onBlur: z.string().min(1, t("title_placeholder")),
							}}
						>
							{(field) => (
								<field.TextField
									label={t("title_label")}
									placeholder={t("title_placeholder")}
								/>
							)}
						</form.AppField>

						{/* Duplicate Thread Search Drawer */}
						<form.Subscribe
							selector={(state) => [state.values.title, state.values.content]}
						>
							{([watchedTitle, watchedContent]) => (
								<DuplicateThreadDrawer
									title={watchedTitle}
									content={watchedContent}
									resource_type={resource_type}
									resource_id={resource_id}
								/>
							)}
						</form.Subscribe>

						{/* Content Lexical Editor */}
						<form.AppField
							name="content"
							validators={{
								onBlur: z.string().min(1, t("content_placeholder")),
							}}
						>
							{(field) => (
								<field.LexicalEditorField
									label={t("content_label")}
									placeholder={t("content_placeholder")}
								/>
							)}
						</form.AppField>

						{/* Tags */}
						<form.AppField name="tagsInput">
							{(field) => (
								<field.TextField
									label={t("tags_label")}
									placeholder={t("tags_placeholder")}
								/>
							)}
						</form.AppField>

						<div className="flex justify-end gap-2 pt-4 border-t">
							<Button
								variant="outline"
								type="button"
								onClick={() => setOpen(false)}
							>
								{t("cancel")}
							</Button>
							<form.SubmitButton>{t("post_thread")}</form.SubmitButton>
						</div>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}
