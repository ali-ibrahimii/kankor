"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Edit2, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type UniversityRow = {
	id: string;
	name: string;
	created_at: string;
	provinces: { name: string } | null;
};

export default function AdminUniversitiesPage() {
	const t = useTranslations("adminCatalog");
	const locale = useLocale();
	const queryClient = useQueryClient();
	const supabase = createClient();

	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [editTarget, setEditTarget] = React.useState<UniversityRow | null>(
		null
	);
	const [name, setName] = React.useState("");
	const [isSaving, setIsSaving] = React.useState(false);
	const [deleteTarget, setDeleteTarget] = React.useState<UniversityRow | null>(
		null
	);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const dateFormat = React.useMemo(
		() =>
			new Intl.DateTimeFormat(
				locale === "en" ? "en-US" : locale === "ps" ? "ps-AF" : "fa-AF",
				{ dateStyle: "medium" }
			),
		[locale]
	);

	const filters = useQueryFilters<"universities", UniversityRow[]>({
		table: "universities",
		selectColumns: "id, name, created_at, provinces(name)",
		searchColumns: ["name"],
		initialState: {
			name: "admin-universities",
			sort: [{ field: "name", direction: "asc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const result = filters.data as
		| { data?: UniversityRow[]; count?: number | null }
		| undefined;
	const items = result?.data ?? [];

	function openCreate() {
		setEditTarget(null);
		setName("");
		setDialogOpen(true);
	}

	function openEdit(row: UniversityRow) {
		setEditTarget(row);
		setName(row.name);
		setDialogOpen(true);
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;
		setIsSaving(true);
		try {
			const { error } = editTarget
				? await supabase
						.from("universities")
						.update({ name: trimmed })
						.eq("id", editTarget.id)
				: await supabase.from("universities").insert({ name: trimmed });
			if (error) throw error;
			toast.success(editTarget ? t("updateSuccess") : t("createSuccess"));
			setDialogOpen(false);
			queryClient.invalidateQueries({ queryKey: ["universities"] });
		} catch {
			toast.error(t("actionError"));
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const { error } = await supabase
				.from("universities")
				.delete()
				.eq("id", deleteTarget.id);
			if (error) throw error;
			toast.success(t("deleteSuccess"));
			setDeleteTarget(null);
			queryClient.invalidateQueries({ queryKey: ["universities"] });
		} catch {
			toast.error(t("actionError"));
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("universities.title")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("universities.description")}
					</p>
				</div>
				<Button size="sm" onClick={openCreate}>
					<Plus className="size-4" />
					{t("add")}
				</Button>
			</div>

			<div className="relative max-w-sm">
				<Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={filters.state.search ?? ""}
					onChange={(e) => filters.setSearch(e.target.value)}
					placeholder={t("searchPlaceholder")}
					className="ps-9"
				/>
			</div>

			<div className="overflow-hidden rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("name")}</TableHead>
							<TableHead>{t("universities.province")}</TableHead>
							<TableHead>{t("createdAt")}</TableHead>
							<TableHead className="w-16 text-end">{t("actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filters.isLoading ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									{t("loading")}
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									{t("empty")}
								</TableCell>
							</TableRow>
						) : (
							items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{item.provinces?.name ?? t("universities.noProvince")}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{dateFormat.format(new Date(item.created_at))}
									</TableCell>
									<TableCell className="text-end">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="size-8">
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => openEdit(item)}>
													<Edit2 className="size-4" />
													{t("edit")}
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-destructive"
													onClick={() => setDeleteTarget(item)}
												>
													<Trash2 className="size-4" />
													{t("delete")}
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

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<form onSubmit={handleSave} className="space-y-4">
						<DialogHeader>
							<DialogTitle>{editTarget ? t("edit") : t("add")}</DialogTitle>
						</DialogHeader>
						<div className="space-y-2">
							<Label htmlFor="university-name">{t("name")}</Label>
							<Input
								id="university-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
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
						>
							{t("cancel")}
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isDeleting}
							onClick={handleDelete}
						>
							{t("delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
