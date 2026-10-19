"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { PurchaseItem } from "./actions";

export interface EarningsViewProps {
	totalCredits: number;
	sales: PurchaseItem[];
}

export function EarningsView({ totalCredits, sales }: EarningsViewProps) {
	const t = useTranslations("credits.earnings");

	return (
		<div className="space-y-6">
			<Card className="max-w-xs">
				<CardContent className="pt-4">
					<p className="text-xs text-muted-foreground">{t("totalEarned")}</p>
					<p className="text-2xl font-bold tabular-nums text-[#1461B8]">
						{t("balanceCredits", { count: totalCredits })}
					</p>
				</CardContent>
			</Card>

			<div className="rounded-xl border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("table.date")}</TableHead>
							<TableHead>{t("table.item")}</TableHead>
							<TableHead>{t("table.type")}</TableHead>
							<TableHead>{t("table.price")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sales.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-10 text-center text-sm text-muted-foreground"
								>
									{t("table.empty")}
								</TableCell>
							</TableRow>
						) : (
							sales.map((s) => (
								<TableRow key={s.id}>
									<TableCell className="text-sm text-muted-foreground">
										{new Date(s.created_at).toLocaleDateString()}
									</TableCell>
									<TableCell className="font-medium">
										{s.itemTitle ?? "—"}
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{t(`itemType.${s.item_type}` as any)}
										</Badge>
									</TableCell>
									<TableCell className="tabular-nums">
										{s.price_credits}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
