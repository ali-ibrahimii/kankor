"use client";

import { ArrowRight, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
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
import { Link } from "@/i18n/navigation";

type FlashcardRow = {
	id: string;
	question: string;
	hint: string | null;
	page: number;
	created_at: string;
};

export default function AdminFlashcardsCardsPage() {
	const t = useTranslations("adminCatalog");
	const locale = useLocale();
	const dateFormat = React.useMemo(
		() =>
			new Intl.DateTimeFormat(
				locale === "en" ? "en-US" : locale === "ps" ? "ps-AF" : "fa-AF",
				{ dateStyle: "medium" }
			),
		[locale]
	);

	const filters = useQueryFilters<"flashcards", FlashcardRow[]>({
		table: "flashcards",
		selectColumns: "id, question, hint, page, created_at",
		searchColumns: ["question", "hint"],
		initialState: {
			name: "admin-flashcards-cards",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 20 },
		},
	});

	const result = filters.data as
		| { data?: FlashcardRow[]; count?: number | null }
		| undefined;
	const items = result?.data ?? [];
	const total = result?.count ?? 0;
	const page = filters.state.pagination?.page ?? 1;
	const pageSize = filters.state.pagination?.pageSize ?? 20;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("cards.title")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("cards.description")}
					</p>
				</div>
				<Button asChild variant="outline" size="sm">
					<Link href="/d/admin/decks">
						{t("cards.manageDecks")}
						<ArrowRight className="size-4 rtl:rotate-180" />
					</Link>
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
							<TableHead>{t("cards.question")}</TableHead>
							<TableHead>{t("cards.hint")}</TableHead>
							<TableHead>{t("cards.page")}</TableHead>
							<TableHead>{t("createdAt")}</TableHead>
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
							items.map((card) => (
								<TableRow key={card.id}>
									<TableCell className="max-w-md truncate font-medium">
										{card.question}
									</TableCell>
									<TableCell className="max-w-xs truncate text-muted-foreground">
										{card.hint || "—"}
									</TableCell>
									<TableCell className="tabular-nums text-muted-foreground">
										{card.page}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{dateFormat.format(new Date(card.created_at))}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{total > pageSize ? (
				<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
					<span>{t("pageOf", { page, total: totalPages })}</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={() => filters.setPagination({ page: page - 1 })}
						>
							{t("previous")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= totalPages}
							onClick={() => filters.setPagination({ page: page + 1 })}
						>
							{t("next")}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
