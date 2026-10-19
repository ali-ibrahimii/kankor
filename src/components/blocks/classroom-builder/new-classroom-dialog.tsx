"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useAppForm } from "@/hooks/use-form";
import { generateNumeric } from "@/lib/utils";
import { createClassroom } from "./actions";
import type { NewClassroomFormValues } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NewClassroomDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Route prefix, e.g. "/d/instructor" */
	basePath: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewClassroomDialog({
	open,
	onOpenChange,
	basePath,
}: NewClassroomDialogProps) {
	const t = useTranslations("classroomBuilder");
	const router = useRouter();

	const form = useAppForm({
		defaultValues: {
			name: "",
			description: "",
			join_code: "",
		} satisfies NewClassroomFormValues,
		onSubmit: async ({ value }) => {
			const result = await createClassroom(value);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			onOpenChange(false);
			router.push(`${basePath}/classrooms/${result.data.classroomId}/edit`);
		},
	});

	React.useEffect(() => {
		if (!open) {
			form.reset();
		} else {
			form.setFieldValue("join_code", generateNumeric());
		}
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("newClassroom.title")}</DialogTitle>
					<DialogDescription>{t("newClassroom.description")}</DialogDescription>
				</DialogHeader>

				<form.AppForm>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.AppField
							name="name"
							validators={{
								onBlur: z
									.string()
									.min(1, t("validation.nameRequired"))
									.max(200),
							}}
						>
							{(field) => (
								<field.TextField
									label={t("newClassroom.nameLabel")}
									placeholder={t("newClassroom.namePlaceholder")}
									autoFocus
									maxLength={200}
								/>
							)}
						</form.AppField>

						<form.AppField name="description">
							{(field) => (
								<field.TextareaField
									label={t("newClassroom.descriptionLabel")}
									placeholder={t("newClassroom.descriptionPlaceholder")}
									rows={3}
								/>
							)}
						</form.AppField>

						<form.AppField
							name="join_code"
							validators={{
								onBlur: z
									.string()
									.min(1, t("validation.joinCodeRequired"))
									.regex(/^\d{6}$/, t("validation.joinCodeLength")),
							}}
						>
							{(field) => (
								<field.TextField
									label={t("newClassroom.joinCodeLabel")}
									placeholder={t("newClassroom.joinCodePlaceholder")}
									maxLength={6}
								/>
							)}
						</form.AppField>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{t("common.cancel")}
							</Button>
							<form.SubmitButton>{t("newClassroom.create")}</form.SubmitButton>
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}
