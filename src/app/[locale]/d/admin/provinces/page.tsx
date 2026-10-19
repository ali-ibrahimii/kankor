"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Edit2, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	ProvinceForm,
	type ProvinceFormValues,
} from "@/components/blocks/provinces/province-form";
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
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { createClient } from "@/lib/supabase/client";

type Province = {
	id: string;
	name: string;
	created_at: string;
};

export default function AdminProvincesPage() {
	const t = useTranslations("provinces");
	const queryClient = useQueryClient();
	const supabase = createClient();

	const [createOpen, setCreateOpen] = React.useState(false);
	const [editTarget, setEditTarget] = React.useState<Province | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<Province | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const filters = useQueryFilters<"provinces", Province[]>({
		table: "provinces",
		selectColumns: "id, name, created_at",
		searchColumns: ["name"],
		initialState: {
			name: "admin-provinces",
			sort: [{ field: "name", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const items = (filters.data as any)?.data ?? [];
	const total = (filters.data as any)?.count ?? null;

	const handleCreateSubmit = async (values: ProvinceFormValues) => {
		try {
			const { error } = await supabase.from("provinces").insert({
				name: values.name,
			});
			if (error) throw error;

			toast.success(t("admin.createSuccess"));
			setCreateOpen(false);
			queryClient.invalidateQueries({ queryKey: ["provinces"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to create province");
		}
	};

	const handleEditSubmit = async (values: ProvinceFormValues) => {
		if (!editTarget) return;
		try {
			const { error } = await supabase
				.from("provinces")
				.update({ name: values.name })
				.eq("id", editTarget.id);
			if (error) throw error;

			toast.success(t("admin.saveSuccess"));
			setEditTarget(null);
			queryClient.invalidateQueries({ queryKey: ["provinces"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to update province");
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const { error } = await supabase
				.from("provinces")
				.delete()
				.eq("id", deleteTarget.id);
			if (error) throw error;

			toast.success(t("admin.deleteSuccess"));
			setDeleteTarget(null);
			queryClient.invalidateQueries({ queryKey: ["provinces"] });
		} catch (error: any) {
			toast.error(error.message || "Failed to delete province");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("admin.title")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("admin.subtitle", { count: total ?? 0 })}
					</p>
				</div>
				<Button
					onClick={() => setCreateOpen(true)}
					className="sm:w-auto w-full cursor-pointer"
				>
					<Plus className="size-4 mr-2" />
					{t("admin.buttons.create")}
				</Button>
			</div>

			{/* Filter toolbar */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder={t("admin.searchPlaceholder")}
						value={filters.state.search ?? ""}
						onChange={(e) => filters.setSearch(e.target.value)}
						className="pl-8"
					/>
				</div>
			</div>

			{/* Main Grid/Table */}
			<div className="rounded-md border bg-card overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admin.fields.name")}</TableHead>
							<TableHead className="hidden md:table-cell">Created At</TableHead>
							<TableHead className="w-12 text-end"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isLoading ? (
							<TableRow>
								<TableCell colSpan={3} className="h-24 text-center">
									{t("admin.loading")}
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={3} className="h-24 text-center">
									{t("admin.empty")}
								</TableCell>
							</TableRow>
						) : (
							items.map((row: Province) => (
								<TableRow key={row.id}>
									<TableCell className="font-medium">{row.name}</TableCell>
									<TableCell className="hidden md:table-cell text-muted-foreground text-sm">
										{new Date(row.created_at).toLocaleDateString()}
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

			{/* Dialogs */}
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("admin.newProvince")}</DialogTitle>
						<DialogDescription>{t("admin.newProvinceDesc")}</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<ProvinceForm
							onSubmit={handleCreateSubmit}
							onCancel={() => setCreateOpen(false)}
							submitLabel={t("admin.buttons.create")}
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
						<DialogTitle>{t("admin.editProvince")}</DialogTitle>
						<DialogDescription>{t("admin.editProvinceDesc")}</DialogDescription>
					</DialogHeader>
					{editTarget && (
						<div className="py-4">
							<ProvinceForm
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
						<DialogTitle>Delete Province</DialogTitle>
						<DialogDescription>{t("admin.deleteConfirm")}</DialogDescription>
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
