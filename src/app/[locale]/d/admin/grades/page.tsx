"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Edit2, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	BookForm,
	type BookFormValues,
} from "@/components/blocks/grades/book-form";
// Import Custom Forms
import {
	GradeForm,
	type GradeFormValues,
} from "@/components/blocks/grades/grade-form";
import {
	SubjectForm,
	type SubjectFormValues,
} from "@/components/blocks/grades/subject-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { createClient } from "@/lib/supabase/client";

// Types
type Grade = {
	id: string;
	name: string;
	ordering: number;
	category_id: string | null;
	categories?: { id: string; name: string } | null;
};

type Subject = {
	id: string;
	name: string;
};

type Book = {
	id: string;
	name: string;
	full_name: string;
	file_path: string;
	grade_id: string | null;
	subject_id: string | null;
	grades?: { id: string; name: string } | null;
	subjects?: { id: string; name: string } | null;
};

export default function AdminGradesPage() {
	const t = useTranslations("grades");
	const [activeTab, setActiveTab] = React.useState<
		"grades" | "subjects" | "books"
	>("grades");

	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-bold tracking-tight">
					{t("admin.title")}
				</h1>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(val) => setActiveTab(val as any)}
				className="w-full space-y-6"
			>
				<TabsList className="grid w-full grid-cols-3 max-w-md">
					<TabsTrigger value="grades">{t("admin.gradesTab")}</TabsTrigger>
					<TabsTrigger value="subjects">{t("admin.subjectsTab")}</TabsTrigger>
					<TabsTrigger value="books">{t("admin.booksTab")}</TabsTrigger>
				</TabsList>

				{activeTab === "grades" && <GradesTabContent />}
				{activeTab === "subjects" && <SubjectsTabContent />}
				{activeTab === "books" && <BooksTabContent />}
			</Tabs>
		</div>
	);
}

// ─── Grades Tab ──────────────────────────────────────────────────────────────
function GradesTabContent() {
	const t = useTranslations("grades");
	const queryClient = useQueryClient();
	const supabase = createClient();

	const [createOpen, setCreateOpen] = React.useState(false);
	const [editTarget, setEditTarget] = React.useState<Grade | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<Grade | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const filters = useQueryFilters<"grades", Grade[]>({
		table: "grades",
		selectColumns: "id, name, ordering, category_id, categories(id, name)",
		searchColumns: ["name"],
		initialState: {
			name: "admin-grades-list",
			sort: [{ field: "ordering", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const items = (filters.data as any)?.data ?? [];
	const total = (filters.data as any)?.count ?? null;

	const handleCreateSubmit = async (values: GradeFormValues) => {
		try {
			const { error } = await supabase.from("grades").insert({
				name: values.name,
				ordering: values.ordering,
				category_id: values.category_id || null,
			});
			if (error) throw error;

			toast.success(t("admin.grades.createSuccess"));
			setCreateOpen(false);
			queryClient.invalidateQueries({ queryKey: ["grades"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to create grade");
		}
	};

	const handleEditSubmit = async (values: GradeFormValues) => {
		if (!editTarget) return;
		try {
			const { error } = await supabase
				.from("grades")
				.update({
					name: values.name,
					ordering: values.ordering,
					category_id: values.category_id || null,
				})
				.eq("id", editTarget.id);
			if (error) throw error;

			toast.success(t("admin.grades.saveSuccess"));
			setEditTarget(null);
			queryClient.invalidateQueries({ queryKey: ["grades"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to update grade");
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const { error } = await supabase
				.from("grades")
				.delete()
				.eq("id", deleteTarget.id);
			if (error) throw error;

			toast.success(t("admin.grades.deleteSuccess"));
			setDeleteTarget(null);
			queryClient.invalidateQueries({ queryKey: ["grades"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to delete grade");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder={t("admin.grades.searchPlaceholder")}
						value={filters.state.search ?? ""}
						onChange={(e) => filters.setSearch(e.target.value)}
						className="pl-8"
					/>
				</div>
				<Button
					onClick={() => setCreateOpen(true)}
					className="sm:w-auto w-full cursor-pointer"
				>
					<Plus className="size-4 mr-2" />
					{t("admin.grades.newGrade")}
				</Button>
			</div>

			<div className="rounded-md border bg-card overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admin.fields.name")}</TableHead>
							<TableHead>{t("admin.fields.ordering")}</TableHead>
							<TableHead className="hidden sm:table-cell">
								{t("admin.fields.category")}
							</TableHead>
							<TableHead className="w-12 text-end"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isLoading ? (
							<TableRow>
								<TableCell colSpan={4} className="h-24 text-center">
									{t("admin.grades.loading")}
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="h-24 text-center">
									{t("admin.grades.empty")}
								</TableCell>
							</TableRow>
						) : (
							items.map((row: Grade) => (
								<TableRow key={row.id}>
									<TableCell className="font-medium">{row.name}</TableCell>
									<TableCell className="tabular-nums">{row.ordering}</TableCell>
									<TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
										{row.categories?.name ?? "—"}
									</TableCell>
									<TableCell className="text-end">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="size-8 cursor-pointer"
												>
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => setEditTarget(row)}
													className="cursor-pointer"
												>
													<Edit2 className="size-4 mr-2" />
													{t("admin.buttons.saveChanges")}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => setDeleteTarget(row)}
													className="text-destructive focus:text-destructive cursor-pointer"
												>
													<Trash2 className="size-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.grades.newGrade")}</DialogTitle>
						<DialogDescription>
							{t("admin.grades.newGradeDesc")}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<GradeForm
							onSubmit={handleCreateSubmit}
							onCancel={() => setCreateOpen(false)}
							submitLabel={t("admin.buttons.createGrade")}
						/>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!editTarget}
				onOpenChange={(o) => !o && setEditTarget(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.grades.editGrade")}</DialogTitle>
						<DialogDescription>
							{t("admin.grades.editGradeDesc")}
						</DialogDescription>
					</DialogHeader>
					{editTarget && (
						<div className="py-4">
							<GradeForm
								initialValues={{
									name: editTarget.name,
									ordering: editTarget.ordering,
									category_id: editTarget.category_id ?? "",
								}}
								onSubmit={handleEditSubmit}
								onCancel={() => setEditTarget(null)}
								submitLabel={t("admin.buttons.saveChanges")}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Grade</DialogTitle>
						<DialogDescription>
							{t("admin.grades.deleteConfirm")}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
							disabled={isDeleting}
						>
							{t("admin.buttons.cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Subjects Tab ────────────────────────────────────────────────────────────
function SubjectsTabContent() {
	const t = useTranslations("grades");
	const queryClient = useQueryClient();
	const supabase = createClient();

	const [createOpen, setCreateOpen] = React.useState(false);
	const [editTarget, setEditTarget] = React.useState<Subject | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<Subject | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const filters = useQueryFilters<"subjects", Subject[]>({
		table: "subjects",
		selectColumns: "id, name",
		searchColumns: ["name"],
		initialState: {
			name: "admin-subjects-list",
			sort: [{ field: "name", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const items = (filters.data as any)?.data ?? [];
	const total = (filters.data as any)?.count ?? null;

	const handleCreateSubmit = async (values: SubjectFormValues) => {
		try {
			const { error } = await supabase.from("subjects").insert({
				name: values.name,
			});
			if (error) throw error;

			toast.success(t("admin.subjects.createSuccess"));
			setCreateOpen(false);
			queryClient.invalidateQueries({ queryKey: ["subjects"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to create subject");
		}
	};

	const handleEditSubmit = async (values: SubjectFormValues) => {
		if (!editTarget) return;
		try {
			const { error } = await supabase
				.from("subjects")
				.update({ name: values.name })
				.eq("id", editTarget.id);
			if (error) throw error;

			toast.success(t("admin.subjects.saveSuccess"));
			setEditTarget(null);
			queryClient.invalidateQueries({ queryKey: ["subjects"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to update subject");
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const { error } = await supabase
				.from("subjects")
				.delete()
				.eq("id", deleteTarget.id);
			if (error) throw error;

			toast.success(t("admin.subjects.deleteSuccess"));
			setDeleteTarget(null);
			queryClient.invalidateQueries({ queryKey: ["subjects"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to delete subject");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder={t("admin.subjects.searchPlaceholder")}
						value={filters.state.search ?? ""}
						onChange={(e) => filters.setSearch(e.target.value)}
						className="pl-8"
					/>
				</div>
				<Button
					onClick={() => setCreateOpen(true)}
					className="sm:w-auto w-full cursor-pointer"
				>
					<Plus className="size-4 mr-2" />
					{t("admin.subjects.newSubject")}
				</Button>
			</div>

			<div className="rounded-md border bg-card overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admin.fields.name")}</TableHead>
							<TableHead className="w-12 text-end"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isLoading ? (
							<TableRow>
								<TableCell colSpan={2} className="h-24 text-center">
									{t("admin.subjects.loading")}
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="h-24 text-center">
									{t("admin.subjects.empty")}
								</TableCell>
							</TableRow>
						) : (
							items.map((row: Subject) => (
								<TableRow key={row.id}>
									<TableCell className="font-medium">{row.name}</TableCell>
									<TableCell className="text-end">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="size-8 cursor-pointer"
												>
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => setEditTarget(row)}
													className="cursor-pointer"
												>
													<Edit2 className="size-4 mr-2" />
													{t("admin.buttons.saveChanges")}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => setDeleteTarget(row)}
													className="text-destructive focus:text-destructive cursor-pointer"
												>
													<Trash2 className="size-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.subjects.newSubject")}</DialogTitle>
						<DialogDescription>
							{t("admin.subjects.newSubjectDesc")}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<SubjectForm
							onSubmit={handleCreateSubmit}
							onCancel={() => setCreateOpen(false)}
							submitLabel={t("admin.buttons.createSubject")}
						/>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!editTarget}
				onOpenChange={(o) => !o && setEditTarget(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.subjects.editSubject")}</DialogTitle>
						<DialogDescription>
							{t("admin.subjects.editSubjectDesc")}
						</DialogDescription>
					</DialogHeader>
					{editTarget && (
						<div className="py-4">
							<SubjectForm
								initialValues={{ name: editTarget.name }}
								onSubmit={handleEditSubmit}
								onCancel={() => setEditTarget(null)}
								submitLabel={t("admin.buttons.saveChanges")}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Subject</DialogTitle>
						<DialogDescription>
							{t("admin.subjects.deleteConfirm")}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
							disabled={isDeleting}
						>
							{t("admin.buttons.cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Books Tab ───────────────────────────────────────────────────────────────
function BooksTabContent() {
	const t = useTranslations("grades");
	const queryClient = useQueryClient();
	const supabase = createClient();

	const [createOpen, setCreateOpen] = React.useState(false);
	const [editTarget, setEditTarget] = React.useState<Book | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<Book | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const filters = useQueryFilters<"books", Book[]>({
		table: "books",
		selectColumns:
			"id, name, full_name, file_path, grade_id, subject_id, grades(id, name), subjects(id, name)",
		searchColumns: ["name", "full_name", "file_path"],
		initialState: {
			name: "admin-books-list",
			sort: [{ field: "name", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const items = (filters.data as any)?.data ?? [];
	const total = (filters.data as any)?.count ?? null;

	const handleCreateSubmit = async (values: BookFormValues) => {
		try {
			const { error } = await supabase.from("books").insert({
				name: values.name,
				full_name: values.full_name,
				file_path: values.file_path,
				grade_id: values.grade_id || null,
				subject_id: values.subject_id || null,
			});
			if (error) throw error;

			toast.success(t("admin.books.createSuccess"));
			setCreateOpen(false);
			queryClient.invalidateQueries({ queryKey: ["books"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to create book");
		}
	};

	const handleEditSubmit = async (values: BookFormValues) => {
		if (!editTarget) return;
		try {
			const { error } = await supabase
				.from("books")
				.update({
					name: values.name,
					full_name: values.full_name,
					file_path: values.file_path,
					grade_id: values.grade_id || null,
					subject_id: values.subject_id || null,
				})
				.eq("id", editTarget.id);
			if (error) throw error;

			toast.success(t("admin.books.saveSuccess"));
			setEditTarget(null);
			queryClient.invalidateQueries({ queryKey: ["books"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to update book");
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const { error } = await supabase
				.from("books")
				.delete()
				.eq("id", deleteTarget.id);
			if (error) throw error;

			toast.success(t("admin.books.deleteSuccess"));
			setDeleteTarget(null);
			queryClient.invalidateQueries({ queryKey: ["books"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to delete book");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder={t("admin.books.searchPlaceholder")}
						value={filters.state.search ?? ""}
						onChange={(e) => filters.setSearch(e.target.value)}
						className="pl-8"
					/>
				</div>
				<Button
					onClick={() => setCreateOpen(true)}
					className="sm:w-auto w-full cursor-pointer"
				>
					<Plus className="size-4 mr-2" />
					{t("admin.books.newBook")}
				</Button>
			</div>

			<div className="rounded-md border bg-card overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admin.fields.name")}</TableHead>
							<TableHead className="hidden md:table-cell">
								{t("admin.fields.fullName")}
							</TableHead>
							<TableHead className="hidden sm:table-cell">
								{t("admin.fields.grade")}
							</TableHead>
							<TableHead className="hidden sm:table-cell">
								{t("admin.fields.subject")}
							</TableHead>
							<TableHead className="w-12 text-end"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isLoading ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									{t("admin.books.loading")}
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									{t("admin.books.empty")}
								</TableCell>
							</TableRow>
						) : (
							items.map((row: Book) => (
								<TableRow key={row.id}>
									<TableCell className="font-medium">{row.name}</TableCell>
									<TableCell className="hidden md:table-cell text-muted-foreground text-sm">
										{row.full_name}
									</TableCell>
									<TableCell className="hidden sm:table-cell text-sm">
										{row.grades?.name ?? "—"}
									</TableCell>
									<TableCell className="hidden sm:table-cell text-sm">
										{row.subjects?.name ?? "—"}
									</TableCell>
									<TableCell className="text-end">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="size-8 cursor-pointer"
												>
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => setEditTarget(row)}
													className="cursor-pointer"
												>
													<Edit2 className="size-4 mr-2" />
													{t("admin.buttons.saveChanges")}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => setDeleteTarget(row)}
													className="text-destructive focus:text-destructive cursor-pointer"
												>
													<Trash2 className="size-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.books.newBook")}</DialogTitle>
						<DialogDescription>
							{t("admin.books.newBookDesc")}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<BookForm
							onSubmit={handleCreateSubmit}
							onCancel={() => setCreateOpen(false)}
							submitLabel={t("admin.buttons.createBook")}
						/>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!editTarget}
				onOpenChange={(o) => !o && setEditTarget(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.books.editBook")}</DialogTitle>
						<DialogDescription>
							{t("admin.books.editBookDesc")}
						</DialogDescription>
					</DialogHeader>
					{editTarget && (
						<div className="py-4">
							<BookForm
								initialValues={{
									name: editTarget.name,
									full_name: editTarget.full_name,
									file_path: editTarget.file_path,
									grade_id: editTarget.grade_id ?? "",
									subject_id: editTarget.subject_id ?? "",
								}}
								onSubmit={handleEditSubmit}
								onCancel={() => setEditTarget(null)}
								submitLabel={t("admin.buttons.saveChanges")}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Book</DialogTitle>
						<DialogDescription>
							{t("admin.books.deleteConfirm")}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
							disabled={isDeleting}
						>
							{t("admin.buttons.cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
