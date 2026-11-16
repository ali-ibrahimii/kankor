"use client";

import {
	ArrowDownIcon,
	ArrowUpIcon,
	PlusIcon,
	SearchIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

import {
	createRoadmap,
	deleteRoadmap,
	type RoadmapWithItems,
	searchCoursesForRoadmap,
	setRoadmapItems,
	updateRoadmap,
} from "./actions";

type CourseOption = Pick<Tables<"courses">, "id" | "title" | "slug" | "level">;

type DraftItem = { courseId: string; title: string };

/**
 * Instructor/admin roadmap manager: create roadmaps, publish them, and build
 * the ordered course list of each roadmap. Authorization is enforced by RLS
 * (creator or platform admin).
 */
export function RoadmapManager({ roadmaps }: { roadmaps: RoadmapWithItems[] }) {
	const t = useTranslations("roadmapManager");
	const router = useRouter();

	const [busy, setBusy] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [newTitle, setNewTitle] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

	const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
	const [courseSearch, setCourseSearch] = useState("");
	const [searchResults, setSearchResults] = useState<CourseOption[]>([]);

	const editing = roadmaps.find((roadmap) => roadmap.id === editingId) ?? null;

	function openEditor(roadmap: RoadmapWithItems) {
		setEditingId(roadmap.id);
		setDraftItems(
			roadmap.roadmap_items.map((item) => ({
				courseId: item.course_id,
				title: item.course?.title ?? "",
			}))
		);
		setCourseSearch("");
		setSearchResults([]);
	}

	function reportError(error: unknown) {
		console.error(error);
		toast.error(t("error"));
	}

	async function handleCreate() {
		setBusy(true);
		const result = await createRoadmap({
			title: newTitle.trim(),
			description: newDescription.trim() || undefined,
		});
		setBusy(false);
		if (!result.success) return reportError(result.error);
		toast.success(t("created"));
		setCreateOpen(false);
		setNewTitle("");
		setNewDescription("");
		router.refresh();
	}

	async function handleTogglePublish(roadmap: RoadmapWithItems) {
		setBusy(true);
		const result = await updateRoadmap(roadmap.id, {
			is_published: !roadmap.is_published,
		});
		setBusy(false);
		if (!result.success) return reportError(result.error);
		toast.success(t(roadmap.is_published ? "unpublishToast" : "publishToast"));
		router.refresh();
	}

	async function handleDelete() {
		if (!deleteTargetId) return;
		setBusy(true);
		const result = await deleteRoadmap(deleteTargetId);
		setBusy(false);
		if (!result.success) return reportError(result.error);
		toast.success(t("deleted"));
		setDeleteTargetId(null);
		if (editingId === deleteTargetId) setEditingId(null);
		router.refresh();
	}

	async function handleSearch() {
		const result = await searchCoursesForRoadmap(courseSearch);
		if (!result.success) return reportError(result.error);
		setSearchResults(result.data);
	}

	async function handleSaveItems() {
		if (!editing) return;
		setBusy(true);
		const result = await setRoadmapItems(
			editing.id,
			draftItems.map((item) => item.courseId)
		);
		setBusy(false);
		if (!result.success) return reportError(result.error);
		toast.success(t("itemsSaved"));
		router.refresh();
	}

	function moveItem(index: number, delta: number) {
		setDraftItems((items) => {
			const next = [...items];
			const target = index + delta;
			if (target < 0 || target >= next.length) return items;
			const [moved] = next.splice(index, 1);
			if (!moved) return items;
			next.splice(target, 0, moved);
			return next;
		});
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">{t("title")}</h1>
					<p className="text-muted-foreground">{t("subtitle")}</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<PlusIcon className="size-4" />
					{t("newRoadmap")}
				</Button>
			</div>

			{roadmaps.length === 0 ? (
				<Card>
					<CardContent className="text-muted-foreground text-sm">
						{t("empty")}
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{roadmaps.map((roadmap) => (
						<Card key={roadmap.id}>
							<CardHeader>
								<div className="flex items-start justify-between gap-2">
									<CardTitle className="text-lg">{roadmap.title}</CardTitle>
									<Badge
										variant={roadmap.is_published ? "default" : "secondary"}
									>
										{roadmap.is_published ? t("published") : t("draft")}
									</Badge>
								</div>
								{roadmap.description ? (
									<CardDescription>{roadmap.description}</CardDescription>
								) : null}
								<p className="text-muted-foreground text-xs">
									{t("coursesCount", { count: roadmap.roadmap_items.length })}
								</p>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => openEditor(roadmap)}
								>
									{t("manageItems")}
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={busy}
									onClick={() => handleTogglePublish(roadmap)}
								>
									{roadmap.is_published ? t("unpublish") : t("publish")}
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={busy}
									onClick={() => setDeleteTargetId(roadmap.id)}
								>
									<Trash2Icon className="size-4" />
									{t("delete")}
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Create dialog */}
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("newRoadmap")}</DialogTitle>
						<DialogDescription>{t("newRoadmapDescription")}</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="roadmap-title">{t("titleLabel")}</Label>
							<Input
								id="roadmap-title"
								value={newTitle}
								onChange={(event) => setNewTitle(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="roadmap-description">
								{t("descriptionLabel")}
							</Label>
							<Textarea
								id="roadmap-description"
								value={newDescription}
								onChange={(event) => setNewDescription(event.target.value)}
							/>
						</div>
						<Button
							className="w-full"
							disabled={busy || newTitle.trim().length === 0}
							onClick={handleCreate}
						>
							{t("create")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Items editor dialog */}
			<Dialog
				open={editing !== null}
				onOpenChange={(open) => {
					if (!open) setEditingId(null);
				}}
			>
				<DialogContent className="max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("manageItems")}</DialogTitle>
						<DialogDescription>
							{editing?.title ?? t("manageItems")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<ol className="space-y-2">
							{draftItems.map((item, index) => (
								<li
									key={item.courseId}
									className="flex items-center gap-2 rounded-md border p-2"
								>
									<Badge variant="secondary">{index + 1}</Badge>
									<span className="flex-1 truncate text-sm">{item.title}</span>
									<Button
										variant="ghost"
										size="icon"
										aria-label={t("moveUp")}
										onClick={() => moveItem(index, -1)}
									>
										<ArrowUpIcon className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										aria-label={t("moveDown")}
										onClick={() => moveItem(index, 1)}
									>
										<ArrowDownIcon className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										aria-label={t("remove")}
										onClick={() =>
											setDraftItems((items) =>
												items.filter((row) => row.courseId !== item.courseId)
											)
										}
									>
										<XIcon className="size-4" />
									</Button>
								</li>
							))}
						</ol>

						<div className="flex gap-2">
							<Input
								value={courseSearch}
								placeholder={t("searchPlaceholder")}
								onChange={(event) => setCourseSearch(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										handleSearch();
									}
								}}
							/>
							<Button type="button" variant="outline" onClick={handleSearch}>
								<SearchIcon className="size-4" />
								{t("search")}
							</Button>
						</div>

						{searchResults.length > 0 ? (
							<ul className="space-y-2">
								{searchResults.map((course) => {
									const alreadyAdded = draftItems.some(
										(item) => item.courseId === course.id
									);
									return (
										<li
											key={course.id}
											className="flex items-center gap-2 rounded-md border p-2"
										>
											<span className="flex-1 truncate text-sm">
												{course.title}
											</span>
											<Button
												variant="outline"
												size="sm"
												disabled={alreadyAdded}
												onClick={() =>
													setDraftItems((items) =>
														alreadyAdded
															? items
															: [
																	...items,
																	{ courseId: course.id, title: course.title },
																]
													)
												}
											>
												<PlusIcon className="size-4" />
												{t("add")}
											</Button>
										</li>
									);
								})}
							</ul>
						) : null}

						<Button
							className="w-full"
							disabled={busy}
							onClick={handleSaveItems}
						>
							{t("saveItems")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation */}
			<ConfirmDialog
				open={deleteTargetId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTargetId(null);
				}}
				title={t("deleteConfirmTitle")}
				description={t("deleteConfirmDescription")}
				onConfirm={handleDelete}
				confirmText={t("confirmDelete")}
				cancelText={t("cancel")}
			/>
		</div>
	);
}
