"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
	FileIcon,
	FilmIcon,
	GlobeIcon,
	GraduationCapIcon,
	LinkIcon,
	PlusIcon,
	ScrollTextIcon,
	TrashIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAppForm } from "@/hooks/use-form";
import {
	addClassroomMaterial,
	removeClassroomMaterial,
	toggleMaterialPublished,
} from "./actions";
import {
	addMaterialAtom,
	classroomAtom,
	materialsAtom,
	removeMaterialAtom,
	updateMaterialAtom,
} from "./store";
import type {
	AddMaterialFormValues,
	ClassroomMaterial,
	ClassroomMaterialType,
} from "./types";

// ─── Material type icon ───────────────────────────────────────────────────────

function MaterialTypeIcon({ type }: { type: ClassroomMaterialType }) {
	const icons: Record<ClassroomMaterialType, React.ReactNode> = {
		lesson: <ScrollTextIcon className="size-4 shrink-0" />,
		pdf: <FileIcon className="size-4 shrink-0" />,
		video: <FilmIcon className="size-4 shrink-0" />,
		document: <FileIcon className="size-4 shrink-0" />,
		link: <LinkIcon className="size-4 shrink-0" />,
		practice: <GraduationCapIcon className="size-4 shrink-0" />,
		exam: <GraduationCapIcon className="size-4 shrink-0" />,
		other: <GlobeIcon className="size-4 shrink-0" />,
	};
	return <>{icons[type] ?? <GlobeIcon className="size-4 shrink-0" />}</>;
}

// ─── Add material dialog ──────────────────────────────────────────────────────

interface AddMaterialDialogProps {
	classroomId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function AddMaterialDialog({
	classroomId,
	open,
	onOpenChange,
}: AddMaterialDialogProps) {
	const t = useTranslations("classroomBuilder");
	const addMaterial = useSetAtom(addMaterialAtom);

	const form = useAppForm({
		defaultValues: {
			title: "",
			description: "",
			type: "document",
			folder_id: "",
		} satisfies AddMaterialFormValues,
		onSubmit: async ({ value }) => {
			const result = await addClassroomMaterial(classroomId, value);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			addMaterial(result.data);
			toast.success(t("materials.added"));
			onOpenChange(false);
		},
	});

	React.useEffect(() => {
		if (!open) form.reset();
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	const materialTypeOptions: { value: ClassroomMaterialType; label: string }[] =
		[
			{ value: "lesson", label: t("materials.type.lesson") },
			{ value: "pdf", label: t("materials.type.pdf") },
			{ value: "video", label: t("materials.type.video") },
			{ value: "document", label: t("materials.type.document") },
			{ value: "link", label: t("materials.type.link") },
			{ value: "practice", label: t("materials.type.practice") },
			{ value: "exam", label: t("materials.type.exam") },
			{ value: "other", label: t("materials.type.other") },
		];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("materials.addDialog.title")}</DialogTitle>
				</DialogHeader>

				<form.AppForm>
					<form
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<form.AppField
							name="title"
							validators={{
								onBlur: z
									.string()
									.min(1, t("validation.titleRequired"))
									.max(200),
							}}
						>
							{(field) => (
								<field.TextField
									label={t("materials.addDialog.titleLabel")}
									placeholder={t("materials.addDialog.titlePlaceholder")}
									autoFocus
									maxLength={200}
								/>
							)}
						</form.AppField>

						<form.AppField name="description">
							{(field) => (
								<field.TextareaField
									label={t("materials.addDialog.descriptionLabel")}
									placeholder={t("materials.addDialog.descriptionPlaceholder")}
									rows={2}
								/>
							)}
						</form.AppField>

						<form.AppField name="type">
							{(field) => (
								<field.SelectField
									label={t("materials.addDialog.typeLabel")}
									options={materialTypeOptions}
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
							<form.SubmitButton>
								{t("materials.addDialog.add")}
							</form.SubmitButton>
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}

// ─── Material row ─────────────────────────────────────────────────────────────

function MaterialRow({ material }: { material: ClassroomMaterial }) {
	const t = useTranslations("classroomBuilder");
	const removeMaterial = useSetAtom(removeMaterialAtom);
	const updateMaterial = useSetAtom(updateMaterialAtom);
	const [removing, setRemoving] = React.useState(false);
	const [toggling, setToggling] = React.useState(false);

	async function handleTogglePublished() {
		setToggling(true);
		const result = await toggleMaterialPublished(
			material.id,
			!material.published
		);
		if (!result.success) {
			toast.error(result.error);
			setToggling(false);
			return;
		}
		updateMaterial({
			id: material.id,
			patch: {
				published: result.data.published,
				published_at: result.data.published_at,
			},
		});
		setToggling(false);
	}

	async function handleRemove() {
		setRemoving(true);
		const result = await removeClassroomMaterial(material.id);
		if (!result.success) {
			toast.error(result.error);
			setRemoving(false);
			return;
		}
		removeMaterial(material.id);
	}

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
			<MaterialTypeIcon type={material.type} />
			<div className="flex-1 min-w-0">
				<p className="truncate text-sm font-medium">{material.title}</p>
				{material.description && (
					<p className="truncate text-xs text-muted-foreground">
						{material.description}
					</p>
				)}
			</div>
			<Badge variant="outline" className="shrink-0 text-xs capitalize">
				{material.type}
			</Badge>
			<div className="flex items-center gap-1.5 shrink-0">
				<Switch
					checked={material.published}
					onCheckedChange={handleTogglePublished}
					disabled={toggling}
					aria-label={t("materials.published")}
				/>
				<Button
					variant="ghost"
					size="icon"
					className="size-7 text-muted-foreground hover:text-destructive"
					onClick={handleRemove}
					disabled={removing}
					aria-label={t("common.remove")}
				>
					<TrashIcon className="size-4" />
				</Button>
			</div>
		</div>
	);
}

// ─── Materials tab ────────────────────────────────────────────────────────────

export function MaterialsTab() {
	const t = useTranslations("classroomBuilder");
	const classroom = useAtomValue(classroomAtom);
	const materials = useAtomValue(materialsAtom);
	const [dialogOpen, setDialogOpen] = React.useState(false);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{t("materials.subtitle", { count: materials.length })}
				</p>
				<Button size="sm" onClick={() => setDialogOpen(true)}>
					<PlusIcon className="me-1.5 size-4" />
					{t("materials.add")}
				</Button>
			</div>

			{materials.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 text-center">
					<FileIcon className="size-10 text-muted-foreground/40" />
					<div>
						<p className="font-medium text-sm">{t("materials.emptyTitle")}</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{t("materials.emptyDescription")}
						</p>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setDialogOpen(true)}
					>
						<PlusIcon className="me-1.5 size-4" />
						{t("materials.add")}
					</Button>
				</div>
			) : (
				<div className="space-y-2">
					{materials.map((material) => (
						<MaterialRow key={material.id} material={material} />
					))}
				</div>
			)}

			<AddMaterialDialog
				classroomId={classroom.id}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
			/>
		</div>
	);
}
