"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Eye,
	Globe,
	GlobeLock,
	MoreHorizontal,
	Pencil,
	Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import type { TableRow as DbRow } from "@/types/db.types";
import { deleteContentItem, setCoursePublished } from "./actions";
import { ConfirmDialog } from "./confirm-dialog";
import { ListPagination } from "./list-pagination";
import { ListSearchInput } from "./list-search-input";
import { type SimpleColumn, SimpleDataTable } from "./simple-data-table";

/**
 * Who owns the content being listed. The same tables serve the
 * instructor detail page (owner column differs per table) and the
 * school detail page (school_id everywhere).
 */
export type ContentOwner =
	| { kind: "instructor"; id: string }
	| { kind: "school"; id: string };

function useDeleteItem(table: "courses" | "decks" | "quizzes") {
	const queryClient = useQueryClient();
	const t = useTranslations("admin.content");
	const [target, setTarget] = React.useState<{
		id: string;
		title: string;
	} | null>(null);

	async function confirmDelete() {
		if (!target) return;
		const result = await deleteContentItem(table, target.id);
		if (result.success) {
			toast.success(t("deleted"));
			queryClient.invalidateQueries({ queryKey: [table] });
		} else {
			toast.error(result.error);
		}
		setTarget(null);
	}

	return { target, setTarget, confirmDelete };
}

function RowMenu({ children }: React.PropsWithChildren) {
	const t = useTranslations("admin.actions");
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon-sm" aria-label={t("openMenu")}>
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">{children}</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ─── Courses ──────────────────────────────────────────────────────────────────

type CourseItem = Pick<
	DbRow<"courses">,
	| "id"
	| "title"
	| "slug"
	| "is_published"
	| "price_credits"
	| "is_free"
	| "created_at"
>;

const COURSE_SELECT =
	"id, title, slug, is_published, price_credits, is_free, created_at";

export function AdminCoursesTable({ owner }: { owner: ContentOwner }) {
	const t = useTranslations("admin.content");
	const queryClient = useQueryClient();
	const { target, setTarget, confirmDelete } = useDeleteItem("courses");

	const ownerField = owner.kind === "school" ? "school_id" : "instructor_id";

	const query = useQueryFilters<"courses", CourseItem[]>({
		table: "courses",
		selectColumns: COURSE_SELECT,
		searchColumns: ["title"],
		initialState: {
			name: `admin-${owner.kind}-courses`,
			filters: [{ field: ownerField, operator: "eq", value: owner.id }],
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 10 },
		},
	});

	async function togglePublished(course: CourseItem) {
		const result = await setCoursePublished(course.id, !course.is_published);
		if (result.success) {
			toast.success(t("updated"));
			queryClient.invalidateQueries({ queryKey: ["courses"] });
		} else {
			toast.error(result.error);
		}
	}

	const columns: SimpleColumn<CourseItem>[] = [
		{
			key: "title",
			header: t("table.title"),
			cell: (row) => (
				<Link
					href={routes.d.admin.courses.slug.page({ slug: row.slug ?? row.id })}
					className="font-medium hover:underline"
				>
					{row.title}
				</Link>
			),
		},
		{
			key: "published",
			header: t("table.status"),
			cell: (row) => (
				<Badge variant={row.is_published ? "default" : "secondary"}>
					{row.is_published ? t("published") : t("draft")}
				</Badge>
			),
		},
		{
			key: "price",
			header: t("table.price"),
			className: "tabular-nums",
			cell: (row) =>
				row.is_free ? t("free") : t("credits", { count: row.price_credits }),
		},
		{
			key: "created",
			header: t("table.created"),
			className: "text-sm text-muted-foreground",
			cell: (row) => new Date(row.created_at).toLocaleDateString(),
		},
		{
			key: "actions",
			header: null,
			className: "w-12 text-end",
			cell: (row) => (
				<RowMenu>
					<DropdownMenuItem asChild>
						<Link
							href={routes.d.admin.courses.slug.page({
								slug: row.slug ?? row.id,
							})}
						>
							<Eye className="size-4" />
							{t("view")}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => togglePublished(row)}>
						{row.is_published ? (
							<GlobeLock className="size-4" />
						) : (
							<Globe className="size-4" />
						)}
						{row.is_published ? t("unpublish") : t("publish")}
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setTarget({ id: row.id, title: row.title })}
					>
						<Trash2 className="size-4" />
						{t("delete")}
					</DropdownMenuItem>
				</RowMenu>
			),
		},
	];

	return (
		<ContentTableLayout
			query={query}
			columns={columns}
			searchPlaceholder={t("searchCourses")}
			emptyText={t("emptyCourses")}
		>
			<ConfirmDialog
				open={!!target}
				onOpenChange={(open) => !open && setTarget(null)}
				title={t("deleteTitle")}
				description={t("deleteDescription", { title: target?.title ?? "" })}
				onConfirm={confirmDelete}
			/>
		</ContentTableLayout>
	);
}

// ─── Decks ────────────────────────────────────────────────────────────────────

type DeckItem = Pick<
	DbRow<"decks">,
	| "id"
	| "name"
	| "slug"
	| "visibility"
	| "price_credits"
	| "is_free"
	| "created_at"
>;

const DECK_SELECT =
	"id, name, slug, visibility, price_credits, is_free, created_at";

export function AdminDecksTable({ owner }: { owner: ContentOwner }) {
	const t = useTranslations("admin.content");
	const { target, setTarget, confirmDelete } = useDeleteItem("decks");

	const ownerField = owner.kind === "school" ? "school_id" : "user_id";

	const query = useQueryFilters<"decks", DeckItem[]>({
		table: "decks",
		selectColumns: DECK_SELECT,
		searchColumns: ["name"],
		initialState: {
			name: `admin-${owner.kind}-decks`,
			filters: [{ field: ownerField, operator: "eq", value: owner.id }],
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 10 },
		},
	});

	const columns: SimpleColumn<DeckItem>[] = [
		{
			key: "name",
			header: t("table.title"),
			cell: (row) => (
				<Link
					href={routes.d.admin.decks.edit.page({ slug: row.slug ?? row.id })}
					className="font-medium hover:underline"
				>
					{row.name}
				</Link>
			),
		},
		{
			key: "visibility",
			header: t("table.visibility"),
			cell: (row) => <Badge variant="outline">{row.visibility}</Badge>,
		},
		{
			key: "price",
			header: t("table.price"),
			className: "tabular-nums",
			cell: (row) =>
				row.is_free ? t("free") : t("credits", { count: row.price_credits }),
		},
		{
			key: "created",
			header: t("table.created"),
			className: "text-sm text-muted-foreground",
			cell: (row) => new Date(row.created_at).toLocaleDateString(),
		},
		{
			key: "actions",
			header: null,
			className: "w-12 text-end",
			cell: (row) => (
				<RowMenu>
					<DropdownMenuItem asChild>
						<Link
							href={routes.d.admin.decks.edit.page({
								slug: row.slug ?? row.id,
							})}
						>
							<Pencil className="size-4" />
							{t("edit")}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setTarget({ id: row.id, title: row.name })}
					>
						<Trash2 className="size-4" />
						{t("delete")}
					</DropdownMenuItem>
				</RowMenu>
			),
		},
	];

	return (
		<ContentTableLayout
			query={query}
			columns={columns}
			searchPlaceholder={t("searchDecks")}
			emptyText={t("emptyDecks")}
		>
			<ConfirmDialog
				open={!!target}
				onOpenChange={(open) => !open && setTarget(null)}
				title={t("deleteTitle")}
				description={t("deleteDescription", { title: target?.title ?? "" })}
				onConfirm={confirmDelete}
			/>
		</ContentTableLayout>
	);
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

type QuizItem = Pick<
	DbRow<"quizzes">,
	| "id"
	| "title"
	| "slug"
	| "visibility"
	| "price_credits"
	| "is_free"
	| "created_at"
>;

const QUIZ_SELECT =
	"id, title, slug, visibility, price_credits, is_free, created_at";

export function AdminQuizzesTable({ owner }: { owner: ContentOwner }) {
	const t = useTranslations("admin.content");
	const { target, setTarget, confirmDelete } = useDeleteItem("quizzes");

	const ownerField = owner.kind === "school" ? "school_id" : "user_id";

	const query = useQueryFilters<"quizzes", QuizItem[]>({
		table: "quizzes",
		selectColumns: QUIZ_SELECT,
		searchColumns: ["title"],
		initialState: {
			name: `admin-${owner.kind}-quizzes`,
			filters: [{ field: ownerField, operator: "eq", value: owner.id }],
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 10 },
		},
	});

	const columns: SimpleColumn<QuizItem>[] = [
		{
			key: "title",
			header: t("table.title"),
			cell: (row) => (
				<Link
					href={routes.d.admin.quizzes.slug.page({ slug: row.slug ?? row.id })}
					className="font-medium hover:underline"
				>
					{row.title}
				</Link>
			),
		},
		{
			key: "visibility",
			header: t("table.visibility"),
			cell: (row) => <Badge variant="outline">{row.visibility}</Badge>,
		},
		{
			key: "price",
			header: t("table.price"),
			className: "tabular-nums",
			cell: (row) =>
				row.is_free ? t("free") : t("credits", { count: row.price_credits }),
		},
		{
			key: "created",
			header: t("table.created"),
			className: "text-sm text-muted-foreground",
			cell: (row) => new Date(row.created_at).toLocaleDateString(),
		},
		{
			key: "actions",
			header: null,
			className: "w-12 text-end",
			cell: (row) => (
				<RowMenu>
					<DropdownMenuItem asChild>
						<Link
							href={routes.d.admin.quizzes.slug.page({
								slug: row.slug ?? row.id,
							})}
						>
							<Eye className="size-4" />
							{t("view")}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setTarget({ id: row.id, title: row.title })}
					>
						<Trash2 className="size-4" />
						{t("delete")}
					</DropdownMenuItem>
				</RowMenu>
			),
		},
	];

	return (
		<ContentTableLayout
			query={query}
			columns={columns}
			searchPlaceholder={t("searchQuizzes")}
			emptyText={t("emptyQuizzes")}
		>
			<ConfirmDialog
				open={!!target}
				onOpenChange={(open) => !open && setTarget(null)}
				title={t("deleteTitle")}
				description={t("deleteDescription", { title: target?.title ?? "" })}
				onConfirm={confirmDelete}
			/>
		</ContentTableLayout>
	);
}

// ─── Shared layout ───────────────────────────────────────────────────────────

type AnyListQuery<T> = {
	data?: { data: T[] | null; count: number | null } | undefined;
	isFetching: boolean;
	state: {
		search?: string;
		pagination?: { page: number; pageSize: number };
	};
	setSearch: (search: string) => void;
	setPagination: (pagination: { page: number }) => void;
};

function ContentTableLayout<T>({
	query,
	columns,
	searchPlaceholder,
	emptyText,
	children,
}: React.PropsWithChildren<{
	query: AnyListQuery<T>;
	columns: SimpleColumn<T>[];
	searchPlaceholder: string;
	emptyText: string;
}>) {
	const rows = query.data?.data ?? [];
	const total = query.data?.count ?? null;
	const page = query.state.pagination?.page ?? 1;
	const pageSize = query.state.pagination?.pageSize ?? 10;

	return (
		<div className="space-y-4">
			<ListSearchInput
				value={query.state.search ?? ""}
				onChange={query.setSearch}
				placeholder={searchPlaceholder}
			/>
			<SimpleDataTable
				columns={columns}
				rows={rows}
				rowKey={(row) => (row as { id?: string }).id ?? ""}
				isLoading={query.isFetching}
				emptyText={emptyText}
			/>
			<ListPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(next) => query.setPagination({ page: next })}
			/>
			{children}
		</div>
	);
}
