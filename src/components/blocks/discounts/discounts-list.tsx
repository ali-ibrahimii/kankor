"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { DiscountRow } from "./types";

export interface DiscountsListProps {
	discounts: DiscountRow[];
	isLoading: boolean;
	onEdit: (discount: DiscountRow) => void;
	onDelete: (discount: DiscountRow) => void;
	deletingId: string | null;
	/** Show the owner column — used on the admin oversight page. */
	showOwner?: boolean;
}

function formatValue(
	discount: DiscountRow,
	t: ReturnType<typeof useTranslations>
) {
	return discount.type === "percentage"
		? t("valuePercentage", { value: discount.value })
		: t("valueFixed", { value: discount.value });
}

function formatWindow(
	discount: DiscountRow,
	t: ReturnType<typeof useTranslations>
) {
	if (!discount.starts_at && !discount.ends_at) return t("alwaysOn");
	const starts = discount.starts_at
		? new Date(discount.starts_at).toLocaleDateString()
		: null;
	const ends = discount.ends_at
		? new Date(discount.ends_at).toLocaleDateString()
		: null;
	if (starts && ends) return `${starts} – ${ends}`;
	if (starts) return t("startsOn", { date: starts });
	if (ends) return t("endsOn", { date: ends });
	return t("alwaysOn");
}

export function DiscountsList({
	discounts,
	isLoading,
	onEdit,
	onDelete,
	deletingId,
	showOwner = false,
}: DiscountsListProps) {
	const t = useTranslations("discounts.list");

	return (
		<div className="rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("table.code")}</TableHead>
						<TableHead>{t("table.scope")}</TableHead>
						<TableHead>{t("table.value")}</TableHead>
						<TableHead>{t("table.window")}</TableHead>
						<TableHead>{t("table.status")}</TableHead>
						{showOwner && <TableHead>{t("table.owner")}</TableHead>}
						<TableHead className="w-20" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading && discounts.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={showOwner ? 7 : 6}
								className="py-10 text-center text-sm text-muted-foreground"
							>
								{t("loading")}
							</TableCell>
						</TableRow>
					) : discounts.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={showOwner ? 7 : 6}
								className="py-10 text-center text-sm text-muted-foreground"
							>
								{t("empty")}
							</TableCell>
						</TableRow>
					) : (
						discounts.map((discount) => (
							<TableRow key={discount.id}>
								<TableCell className="font-mono font-medium">
									{discount.code}
								</TableCell>
								<TableCell>
									<Badge variant="outline">
										{t(`scope.${discount.scope}` as any)}
									</Badge>
								</TableCell>
								<TableCell>{formatValue(discount, t)}</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{formatWindow(discount, t)}
								</TableCell>
								<TableCell>
									{discount.is_active ? (
										<Badge className="bg-emerald-500 text-white">
											{t("status.active")}
										</Badge>
									) : (
										<Badge variant="secondary">{t("status.inactive")}</Badge>
									)}
								</TableCell>
								{showOwner && (
									<TableCell>
										<Badge variant="outline">
											{t(`ownerType.${discount.owner_type}` as any)}
										</Badge>
									</TableCell>
								)}
								<TableCell>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => onEdit(discount)}
											aria-label={t("edit")}
										>
											<PencilIcon className="size-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											className="text-muted-foreground hover:text-destructive"
											disabled={deletingId === discount.id}
											onClick={() => onDelete(discount)}
											aria-label={t("delete")}
										>
											<Trash2Icon className="size-3.5" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
