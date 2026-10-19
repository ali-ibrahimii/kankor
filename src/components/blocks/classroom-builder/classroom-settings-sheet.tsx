"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useAppForm } from "@/hooks/use-form";
import { updateClassroom } from "./actions";
import { classroomAtom, patchClassroomAtom } from "./store";
import type { EditClassroomFormValues } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClassroomSettingsSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClassroomSettingsSheet({
	open,
	onOpenChange,
}: ClassroomSettingsSheetProps) {
	const t = useTranslations("classroomBuilder");
	const classroom = useAtomValue(classroomAtom);
	const patchClassroom = useSetAtom(patchClassroomAtom);

	const form = useAppForm({
		defaultValues: {
			name: classroom.name,
			description: classroom.description ?? "",
		} satisfies EditClassroomFormValues,
		onSubmit: async ({ value }) => {
			const result = await updateClassroom(classroom.id, value);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			patchClassroom({
				name: result.data.name,
				description: result.data.description,
			});
			toast.success(t("settings.saved"));
			onOpenChange(false);
		},
	});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col">
				<SheetHeader>
					<SheetTitle>{t("settings.title")}</SheetTitle>
					<SheetDescription>{t("settings.description")}</SheetDescription>
				</SheetHeader>

				<form.AppForm>
					<form
						className="flex flex-1 flex-col gap-4 py-4"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
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
									label={t("settings.nameLabel")}
									placeholder={t("settings.namePlaceholder")}
									maxLength={200}
								/>
							)}
						</form.AppField>

						<form.AppField name="description">
							{(field) => (
								<field.TextareaField
									label={t("settings.descriptionLabel")}
									placeholder={t("settings.descriptionPlaceholder")}
									rows={4}
								/>
							)}
						</form.AppField>

						<SheetFooter className="mt-auto">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{t("common.cancel")}
							</Button>
							<form.SubmitButton>{t("common.save")}</form.SubmitButton>
						</SheetFooter>
					</form>
				</form.AppForm>
			</SheetContent>
		</Sheet>
	);
}
