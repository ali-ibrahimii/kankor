"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, MoreHorizontal, Plus, Trash, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { LibraryFilters } from "@/components/blocks/libraries/library-filters";
import {
	LibraryForm,
	type LibraryFormValues,
} from "@/components/blocks/libraries/library-form";
import type { LibraryBook } from "@/components/blocks/libraries/types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ImportDialog } from "@/features/import";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

const SELECT_COLUMNS =
	"id, title, desc, file_path, uri, slug, created_at, book_id, category_id, grade_id, subject_id, related_courses_ids, related_decks_ids, books(id, full_name), categories(id, name), grades(id, name), subjects(id, name)";

export default function AdminLibrariesPage() {
	const t = useTranslations("libraries");
	const queryClient = useQueryClient();
	const supabase = createClient();

	// Dialog open states
	const [createOpen, setCreateOpen] = React.useState(false);
	const [editTarget, setEditTarget] = React.useState<LibraryBook | null>(null);
	const [importOpen, setImportOpen] = React.useState(false);

	// --- Filter Hook ---
	const filters = useQueryFilters<"libraries", LibraryBook[]>({
		table: "libraries",
		selectColumns: SELECT_COLUMNS,
		searchColumns: ["title", "desc", "file_path", "uri"],
		initialState: {
			name: "admin-libraries",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const items = (filters.data as any)?.data ?? [];
	const total = (filters.data as any)?.count ?? null;

	// --- Reference options for page filters ---
	const categoriesQuery = useQuery({
		queryKey: ["admin", "filter-categories"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("categories")
				.select("id, name")
				.order("name");
			if (error) throw error;
			return data ?? [];
		},
	});

	const gradesQuery = useQuery({
		queryKey: ["admin", "filter-grades"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("grades")
				.select("id, name")
				.order("ordering");
			if (error) throw error;
			return data ?? [];
		},
	});

	const subjectsQuery = useQuery({
		queryKey: ["admin", "filter-subjects"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("subjects")
				.select("id, name")
				.order("name");
			if (error) throw error;
			return data ?? [];
		},
	});

	const booksQuery = useQuery({
		queryKey: ["admin", "filter-books"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("books")
				.select("id, name:full_name")
				.order("full_name");
			if (error) throw error;
			return data ?? [];
		},
	});

	// Handle mutations
	const handleCreateSubmit = async (values: LibraryFormValues) => {
		try {
			const { error } = await supabase.from("libraries").insert({
				title: values.title,
				desc: values.desc || null,
				file_path: values.file_path,
				uri: values.uri,
				slug: values.slug || null,
				book_id: values.book_id || null,
				category_id: values.category_id || null,
				grade_id: values.grade_id || null,
				subject_id: values.subject_id || null,
				seo_title: values.seo_title || null,
				seo_description: values.seo_description || null,
				related_courses_ids: values.related_courses_ids || [],
				related_decks_ids: values.related_decks_ids || [],
			});

			if (error) throw error;

			toast.success(t("admin.createSuccess"));
			setCreateOpen(false);
			queryClient.invalidateQueries({ queryKey: ["libraries"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to create");
		}
	};

	const handleEditSubmit = async (values: LibraryFormValues) => {
		if (!editTarget) return;

		try {
			const { error } = await supabase
				.from("libraries")
				.update({
					title: values.title,
					desc: values.desc || null,
					file_path: values.file_path,
					uri: values.uri,
					slug: values.slug || null,
					book_id: values.book_id || null,
					category_id: values.category_id || null,
					grade_id: values.grade_id || null,
					subject_id: values.subject_id || null,
					seo_title: values.seo_title || null,
					seo_description: values.seo_description || null,
					related_courses_ids: values.related_courses_ids || [],
					related_decks_ids: values.related_decks_ids || [],
				})
				.eq("id", editTarget.id);

			if (error) throw error;

			toast.success(t("admin.saveSuccess"));
			setEditTarget(null);
			queryClient.invalidateQueries({ queryKey: ["libraries"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to save");
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm(t("admin.deleteConfirm"))) return;

		try {
			const { error } = await supabase.from("libraries").delete().eq("id", id);

			if (error) throw error;

			toast.success(t("admin.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["libraries"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to delete");
		}
	};

	return (
		<div className="space-y-6 p-6">
			{/* Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold">{t("admin.title")}</h1>
					{total != null && (
						<p className="mt-0.5 text-sm text-muted-foreground">
							{t("admin.subtitle", { count: total })}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setImportOpen(true)}
						className="gap-2 cursor-pointer"
					>
						<Upload className="size-4" />
						{t("admin.import")}
					</Button>
					<Button
						size="sm"
						onClick={() => setCreateOpen(true)}
						className="gap-2 cursor-pointer"
					>
						<Plus className="size-4" />
						{t("admin.newLibrary")}
					</Button>
				</div>
			</div>

			{/* Filters — search, category/grade/subject/book, sort */}
			<LibraryFilters
				queryState={filters}
				categories={categoriesQuery.data ?? []}
				grades={gradesQuery.data ?? []}
				subjects={subjectsQuery.data ?? []}
				books={booksQuery.data ?? []}
			/>

			{/* Main Table */}
			<div className="rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admin.fields.title")}</TableHead>
							<TableHead>{t("admin.fields.filePath")}</TableHead>
							<TableHead>{t("admin.fields.category")}</TableHead>
							<TableHead>{t("admin.fields.grade")}</TableHead>
							<TableHead>{t("admin.fields.subject")}</TableHead>
							<TableHead className="w-16" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isFetching && items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-10 text-center text-sm text-muted-foreground"
								>
									{t("admin.loading")}
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-10 text-center text-sm text-muted-foreground"
								>
									{t("admin.empty")}
								</TableCell>
							</TableRow>
						) : (
							items.map((library: LibraryBook) => (
								<TableRow key={library.id}>
									<TableCell className="font-medium max-w-xs truncate">
										<Link
											href={`/d/admin/libraries/${library.slug ?? library.id}`}
											className="hover:underline"
										>
											{library.title}
										</Link>
									</TableCell>
									<TableCell className="text-sm text-muted-foreground font-mono">
										{library.file_path}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{library.categories?.name ?? "—"}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{library.grades?.name ?? "—"}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{library.subjects?.name ?? "—"}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													className="h-8 w-8 p-0 cursor-pointer"
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => setEditTarget(library)}
													className="cursor-pointer"
												>
													<Edit className="mr-2 h-4 w-4" />
													{t("admin.actions.edit")}
												</DropdownMenuItem>
												<DropdownMenuItem asChild className="cursor-pointer">
													<Link
														href={`/d/admin/libraries/${library.slug ?? library.id}`}
													>
														<Eye className="mr-2 h-4 w-4" />
														{t("admin.actions.view")}
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDelete(library.id)}
													className="text-destructive cursor-pointer"
												>
													<Trash className="mr-2 h-4 w-4" />
													{t("admin.actions.delete")}
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

			{/* Pagination */}
			{total != null && total > (filters.state.pagination?.pageSize ?? 20) && (
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						{t("showing", {
							from:
								((filters.state.pagination?.page ?? 1) - 1) *
									(filters.state.pagination?.pageSize ?? 20) +
								1,
							to: Math.min(
								(filters.state.pagination?.page ?? 1) *
									(filters.state.pagination?.pageSize ?? 20),
								total
							),
							total,
						})}
					</span>

					<div className="flex items-center gap-1">
						<Button
							size="sm"
							variant="outline"
							disabled={(filters.state.pagination?.page ?? 1) <= 1}
							onClick={() =>
								filters.setPagination({
									page: (filters.state.pagination?.page ?? 1) - 1,
								})
							}
							className="cursor-pointer"
						>
							{t("previous")}
						</Button>
						<Button
							size="sm"
							variant="outline"
							disabled={
								(filters.state.pagination?.page ?? 1) *
									(filters.state.pagination?.pageSize ?? 20) >=
								total
							}
							onClick={() =>
								filters.setPagination({
									page: (filters.state.pagination?.page ?? 1) + 1,
								})
							}
							className="cursor-pointer"
						>
							{t("next")}
						</Button>
					</div>
				</div>
			)}

			{/* Create Dialog */}
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("admin.newLibrary")}</DialogTitle>
						<DialogDescription>{t("admin.newLibraryDesc")}</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<LibraryForm
							onSubmit={handleCreateSubmit}
							onCancel={() => setCreateOpen(false)}
							submitLabel={t("admin.buttons.create")}
						/>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog
				open={!!editTarget}
				onOpenChange={(open) => !open && setEditTarget(null)}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("admin.editLibrary")}</DialogTitle>
						<DialogDescription>{t("admin.editLibraryDesc")}</DialogDescription>
					</DialogHeader>
					{editTarget && (
						<div className="py-4">
							<LibraryForm
								initialValues={{
									title: editTarget.title,
									desc: editTarget.desc ?? "",
									file_path: editTarget.file_path,
									uri: editTarget.uri,
									slug: editTarget.slug ?? "",
									book_id: editTarget.book_id ?? "",
									category_id: editTarget.category_id ?? "",
									grade_id: editTarget.grade_id ?? "",
									subject_id: editTarget.subject_id ?? "",
									seo_title: editTarget.seo_title ?? "",
									seo_description: editTarget.seo_description ?? "",
									related_courses_ids:
										(editTarget as any).related_courses_ids || [],
									related_decks_ids:
										(editTarget as any).related_decks_ids || [],
								}}
								onSubmit={handleEditSubmit}
								onCancel={() => setEditTarget(null)}
								submitLabel={t("admin.buttons.saveChanges")}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Import Dialog */}
			{importOpen && (
				<ImportDialog
					table="libraries"
					open={importOpen}
					onOpenChange={setImportOpen}
					onComplete={() => {
						queryClient.invalidateQueries({ queryKey: ["libraries"] });
						toast.success(t("admin.importComplete"));
					}}
				/>
			)}
		</div>
	);
}
