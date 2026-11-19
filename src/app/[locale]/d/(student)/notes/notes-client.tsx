"use client";

import { Feather, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	createStudentNoteAction,
	deleteStudentNoteAction,
	type StudentNoteRow,
	updateStudentNoteAction,
} from "./actions";

function resolveDateLocale(locale: string): string {
	if (locale === "en") return "en-US";
	if (locale === "ps") return "ps-AF";
	return "fa-AF";
}

export function StudentNotesClient({
	initialNotes,
}: {
	initialNotes: StudentNoteRow[];
}) {
	const t = useTranslations("studentNotes");
	const locale = useLocale();
	const [notes, setNotes] = React.useState<StudentNoteRow[]>(initialNotes);
	const [search, setSearch] = React.useState("");

	const [editorOpen, setEditorOpen] = React.useState(false);
	const [editingNote, setEditingNote] = React.useState<StudentNoteRow | null>(
		null
	);
	const [title, setTitle] = React.useState("");
	const [content, setContent] = React.useState("");
	const [isSaving, setIsSaving] = React.useState(false);

	const [deleteTarget, setDeleteTarget] = React.useState<StudentNoteRow | null>(
		null
	);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const dateFormatter = React.useMemo(
		() =>
			new Intl.DateTimeFormat(resolveDateLocale(locale), {
				dateStyle: "medium",
			}),
		[locale]
	);

	const filteredNotes = React.useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return notes;
		return notes.filter(
			(note) =>
				(note.title ?? "").toLowerCase().includes(q) ||
				note.content.toLowerCase().includes(q)
		);
	}, [notes, search]);

	function openCreateDialog() {
		setEditingNote(null);
		setTitle("");
		setContent("");
		setEditorOpen(true);
	}

	function openEditDialog(note: StudentNoteRow) {
		setEditingNote(note);
		setTitle(note.title ?? "");
		setContent(note.content);
		setEditorOpen(true);
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!content.trim()) {
			toast.error(t("contentRequired"));
			return;
		}
		setIsSaving(true);
		try {
			if (editingNote) {
				const res = await updateStudentNoteAction({
					id: editingNote.id,
					title,
					content,
				});
				if (!res.success) {
					toast.error(t("saveError"));
					return;
				}
				setNotes((prev) => [
					res.data,
					...prev.filter((item) => item.id !== editingNote.id),
				]);
				toast.success(t("updatedSuccess"));
			} else {
				const res = await createStudentNoteAction({ title, content });
				if (!res.success) {
					toast.error(t("saveError"));
					return;
				}
				setNotes((prev) => [res.data, ...prev]);
				toast.success(t("createdSuccess"));
			}
			setEditorOpen(false);
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const res = await deleteStudentNoteAction(deleteTarget.id);
			if (!res.success) {
				toast.error(t("deleteError"));
				return;
			}
			setNotes((prev) => prev.filter((item) => item.id !== deleteTarget.id));
			toast.success(t("deletedSuccess"));
			setDeleteTarget(null);
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1.5">
					<h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
						<Feather className="size-6 text-primary" />
						{t("title")}
					</h1>
					<p className="text-sm text-muted-foreground">{t("description")}</p>
				</div>

				<Button
					onClick={openCreateDialog}
					className="self-start rounded-full px-5 sm:self-auto"
				>
					<Plus className="size-4" />
					{t("newNote")}
				</Button>
			</header>

			{notes.length > 0 ? (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-sm">
						<Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("searchPlaceholder")}
							className="rounded-full ps-9 pe-9"
						/>
						{search ? (
							<button
								type="button"
								onClick={() => setSearch("")}
								aria-label={t("clearSearch")}
								className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X className="size-4" />
							</button>
						) : null}
					</div>
					<p className="text-xs font-medium text-muted-foreground">
						{t("countLabel", { count: filteredNotes.length })}
					</p>
				</div>
			) : null}

			{notes.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/70 px-6 py-20 text-center">
					<div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<Feather className="size-6" />
					</div>
					<h2 className="text-base font-bold text-foreground">
						{t("emptyTitle")}
					</h2>
					<p className="max-w-md text-sm text-muted-foreground">
						{t("emptySubtitle")}
					</p>
					<Button onClick={openCreateDialog} className="mt-2 rounded-full px-5">
						<Plus className="size-4" />
						{t("newNote")}
					</Button>
				</div>
			) : filteredNotes.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/30 py-16 text-center">
					<p className="text-sm font-medium text-foreground">
						{t("noSearchMatch")}
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setSearch("")}
						className="rounded-full"
					>
						{t("clearSearch")}
					</Button>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredNotes.map((note) => {
						const stamp = note.updated_at || note.created_at;
						const parsed = new Date(stamp);
						const dateText = Number.isNaN(parsed.getTime())
							? ""
							: dateFormatter.format(parsed);

						return (
							<article
								key={note.id}
								className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-[#fffef9] p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md dark:bg-card"
							>
								<div className="border-s-2 border-rose-300/50 ps-3.5 dark:border-primary/30">
									<h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
										{note.title?.trim() || t("untitled")}
									</h2>
									<p className="mt-2.5 line-clamp-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
										{note.content}
									</p>
								</div>

								<div className="mt-5 flex items-center justify-between gap-2 border-t border-dashed border-border/70 pt-3">
									<span className="text-[11px] text-muted-foreground">
										{dateText ? t("updatedAt", { date: dateText }) : ""}
									</span>

									<div className="flex items-center gap-1">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-8 rounded-full"
											aria-label={t("editNote")}
											onClick={() => openEditDialog(note)}
										>
											<Pencil className="size-3.5" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-8 rounded-full text-muted-foreground hover:text-destructive"
											aria-label={t("delete")}
											onClick={() => setDeleteTarget(note)}
										>
											<Trash2 className="size-3.5" />
										</Button>
									</div>
								</div>
							</article>
						);
					})}
				</div>
			)}

			{/* Create / Edit Note Dialog */}
			<Dialog open={editorOpen} onOpenChange={setEditorOpen}>
				<DialogContent className="sm:max-w-lg">
					<form onSubmit={handleSave} className="space-y-4">
						<DialogHeader>
							<DialogTitle>
								{editingNote ? t("editNote") : t("newNote")}
							</DialogTitle>
							<DialogDescription>{t("description")}</DialogDescription>
						</DialogHeader>

						<div className="space-y-2">
							<Label htmlFor="student-note-title">{t("titleLabel")}</Label>
							<Input
								id="student-note-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder={t("titlePlaceholder")}
								maxLength={200}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="student-note-content">{t("contentLabel")}</Label>
							<Textarea
								id="student-note-content"
								value={content}
								onChange={(e) => setContent(e.target.value)}
								placeholder={t("contentPlaceholder")}
								rows={7}
								required
							/>
						</div>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditorOpen(false)}
								disabled={isSaving}
							>
								{t("cancel")}
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving ? t("saving") : t("save")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
						<DialogDescription>
							{t("deleteConfirmDescription")}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setDeleteTarget(null)}
							disabled={isDeleting}
						>
							{t("cancel")}
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? t("deleting") : t("delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
