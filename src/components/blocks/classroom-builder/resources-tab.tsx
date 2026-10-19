"use client";

import { useStore } from "@tanstack/react-form";
import { useAtomValue, useSetAtom } from "jotai";
import {
	BookOpenIcon,
	FileTextIcon,
	LayersIcon,
	PlusIcon,
	TrashIcon,
	ZapIcon,
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
import { useAppForm } from "@/hooks/use-form";
import {
	addClassroomResource,
	fetchMyCourses,
	fetchMyDecks,
	removeClassroomResource,
} from "./actions";
import {
	addResourceAtom,
	classroomAtom,
	removeResourceAtom,
	resourcesAtom,
} from "./store";
import type { AddResourceFormValues, ClassroomResource } from "./types";

// ─── Resource type icon ───────────────────────────────────────────────────────

function ResourceIcon({ type }: { type: ClassroomResource["resource_type"] }) {
	if (type === "deck") return <ZapIcon className="size-4 shrink-0" />;
	if (type === "course") return <BookOpenIcon className="size-4 shrink-0" />;
	if (type === "quiz") return <FileTextIcon className="size-4 shrink-0" />;
	return <LayersIcon className="size-4 shrink-0" />;
}

// ─── Add resource dialog ──────────────────────────────────────────────────────

interface AddResourceDialogProps {
	classroomId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function AddResourceDialog({
	classroomId,
	open,
	onOpenChange,
}: AddResourceDialogProps) {
	const t = useTranslations("classroomBuilder");
	const addResource = useSetAtom(addResourceAtom);

	const [decks, setDecks] = React.useState<{ id: string; name: string }[]>([]);
	const [courses, setCourses] = React.useState<{ id: string; title: string }[]>(
		[]
	);
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		if (!open) return;
		setLoading(true);
		Promise.all([fetchMyDecks(), fetchMyCourses()])
			.then(([decksRes, coursesRes]) => {
				if (decksRes.success) setDecks(decksRes.data);
				if (coursesRes.success) setCourses(coursesRes.data);
			})
			.finally(() => setLoading(false));
	}, [open]);

	const form = useAppForm({
		defaultValues: {
			resource_type: "deck",
			resource_id: "",
		} satisfies AddResourceFormValues,
		onSubmit: async ({ value }) => {
			const result = await addClassroomResource(classroomId, value);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			// Attach title for display
			let title = "";
			if (value.resource_type === "deck") {
				title = decks.find((d) => d.id === value.resource_id)?.name ?? "";
			} else if (value.resource_type === "course") {
				title = courses.find((c) => c.id === value.resource_id)?.title ?? "";
			}
			addResource({ ...result.data, title });
			toast.success(t("resources.added"));
			onOpenChange(false);
		},
	});

	const resourceType = useStore(form.baseStore, (s) => s.values.resource_type);

	const resourceOptions = React.useMemo(() => {
		if (resourceType === "deck")
			return decks.map((d) => ({ value: d.id, label: d.name }));
		if (resourceType === "course")
			return courses.map((c) => ({ value: c.id, label: c.title }));
		return [];
	}, [resourceType, decks, courses]);

	React.useEffect(() => {
		if (!open) form.reset();
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("resources.addDialog.title")}</DialogTitle>
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
						<form.AppField name="resource_type">
							{(field) => (
								<field.SelectField
									label={t("resources.addDialog.typeLabel")}
									options={[
										{ value: "deck", label: t("resources.type.deck") },
										{ value: "course", label: t("resources.type.course") },
									]}
								/>
							)}
						</form.AppField>

						<form.AppField
							name="resource_id"
							validators={{
								onBlur: z
									.string()
									.min(1, t("resources.addDialog.selectRequired")),
							}}
						>
							{(field) => (
								<field.SelectField
									label={t("resources.addDialog.resourceLabel")}
									options={
										loading || resourceOptions.length === 0
											? [
													{
														value: "",
														label: loading ? "Loading…" : "No items",
													},
												]
											: resourceOptions
									}
								/>
							)}
						</form.AppField>

						{!loading && resourceOptions.length === 0 && (
							<p className="text-sm text-muted-foreground">
								{t("resources.addDialog.noItems")}
							</p>
						)}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{t("common.cancel")}
							</Button>
							<form.SubmitButton disabled={resourceOptions.length === 0}>
								{t("resources.addDialog.add")}
							</form.SubmitButton>
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}

// ─── Resource row ─────────────────────────────────────────────────────────────

function ResourceRow({ resource }: { resource: ClassroomResource }) {
	const t = useTranslations("classroomBuilder");
	const removeResource = useSetAtom(removeResourceAtom);
	const [removing, setRemoving] = React.useState(false);

	async function handleRemove() {
		setRemoving(true);
		const result = await removeClassroomResource(resource.id);
		if (!result.success) {
			toast.error(result.error);
			setRemoving(false);
			return;
		}
		removeResource(resource.id);
	}

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
			<ResourceIcon type={resource.resource_type} />
			<div className="flex-1 min-w-0">
				<p className="truncate text-sm font-medium">
					{resource.title ?? resource.resource_id}
				</p>
			</div>
			<Badge variant="secondary" className="shrink-0 text-xs capitalize">
				{resource.resource_type}
			</Badge>
			<Button
				variant="ghost"
				size="icon"
				className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
				onClick={handleRemove}
				disabled={removing}
				aria-label={t("common.remove")}
			>
				<TrashIcon className="size-4" />
			</Button>
		</div>
	);
}

// ─── Resources tab ────────────────────────────────────────────────────────────

export function ResourcesTab() {
	const t = useTranslations("classroomBuilder");
	const classroom = useAtomValue(classroomAtom);
	const resources = useAtomValue(resourcesAtom);
	const [dialogOpen, setDialogOpen] = React.useState(false);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{t("resources.subtitle", { count: resources.length })}
				</p>
				<Button size="sm" onClick={() => setDialogOpen(true)}>
					<PlusIcon className="me-1.5 size-4" />
					{t("resources.add")}
				</Button>
			</div>

			{resources.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 text-center">
					<LayersIcon className="size-10 text-muted-foreground/40" />
					<div>
						<p className="font-medium text-sm">{t("resources.emptyTitle")}</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{t("resources.emptyDescription")}
						</p>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setDialogOpen(true)}
					>
						<PlusIcon className="me-1.5 size-4" />
						{t("resources.add")}
					</Button>
				</div>
			) : (
				<div className="space-y-2">
					{resources.map((resource) => (
						<ResourceRow key={resource.id} resource={resource} />
					))}
				</div>
			)}

			<AddResourceDialog
				classroomId={classroom.id}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
			/>
		</div>
	);
}
