"use client";

import { useTranslations } from "next-intl";
import { DiscountsManager } from "@/components/blocks/discounts";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CreditTransactionItem, PurchaseItem } from "./actions";

export interface WalletViewProps {
	userId: string;
	ledger: CreditTransactionItem[];
	purchases: PurchaseItem[];
	sales: PurchaseItem[];
	totalEarned: number;
}

export function WalletView({
	userId,
	ledger,
	purchases,
	sales,
	totalEarned,
}: WalletViewProps) {
	const t = useTranslations("credits.wallet");

	return (
		<Tabs defaultValue="ledger">
			<TabsList>
				<TabsTrigger value="ledger">{t("tabs.ledger")}</TabsTrigger>
				<TabsTrigger value="purchases">{t("tabs.purchases")}</TabsTrigger>
				<TabsTrigger value="sales">{t("tabs.sales")}</TabsTrigger>
				<TabsTrigger value="discounts">{t("tabs.discounts")}</TabsTrigger>
			</TabsList>

			<TabsContent value="ledger">
				<div className="rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("ledgerTable.date")}</TableHead>
								<TableHead>{t("ledgerTable.type")}</TableHead>
								<TableHead>{t("ledgerTable.amount")}</TableHead>
								<TableHead>{t("ledgerTable.balanceAfter")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{ledger.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="py-10 text-center text-sm text-muted-foreground"
									>
										{t("ledgerTable.empty")}
									</TableCell>
								</TableRow>
							) : (
								ledger.map((tx) => (
									<TableRow key={tx.id}>
										<TableCell className="text-sm text-muted-foreground">
											{new Date(tx.created_at).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{t(`type.${tx.type}` as any)}
											</Badge>
										</TableCell>
										<TableCell
											className={
												tx.amount >= 0
													? "font-semibold tabular-nums text-emerald-600"
													: "font-semibold tabular-nums text-destructive"
											}
										>
											{tx.amount >= 0 ? "+" : ""}
											{tx.amount}
										</TableCell>
										<TableCell className="tabular-nums">
											{tx.balance_after}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</TabsContent>

			<TabsContent value="purchases">
				<div className="rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("purchasesTable.date")}</TableHead>
								<TableHead>{t("purchasesTable.item")}</TableHead>
								<TableHead>{t("purchasesTable.type")}</TableHead>
								<TableHead>{t("purchasesTable.price")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{purchases.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="py-10 text-center text-sm text-muted-foreground"
									>
										{t("purchasesTable.empty")}
									</TableCell>
								</TableRow>
							) : (
								purchases.map((p) => (
									<TableRow key={p.id}>
										<TableCell className="text-sm text-muted-foreground">
											{new Date(p.created_at).toLocaleDateString()}
										</TableCell>
										<TableCell className="font-medium">
											{p.itemTitle ?? "—"}
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{t(`itemType.${p.item_type}` as any)}
											</Badge>
										</TableCell>
										<TableCell className="tabular-nums">
											{p.price_credits}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</TabsContent>

			<TabsContent value="sales" className="space-y-3">
				<p className="text-sm text-muted-foreground">{t("salesDescription")}</p>
				<div className="rounded-xl border p-4">
					<p className="text-xs text-muted-foreground">{t("totalEarned")}</p>
					<p className="text-xl font-bold tabular-nums">
						{t("balanceCredits", { count: totalEarned })}
					</p>
				</div>
				<div className="rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("salesTable.date")}</TableHead>
								<TableHead>{t("salesTable.item")}</TableHead>
								<TableHead>{t("salesTable.price")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sales.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="py-10 text-center text-sm text-muted-foreground"
									>
										{t("salesTable.empty")}
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
										<TableCell className="tabular-nums">
											{s.price_credits}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</TabsContent>

			<TabsContent value="discounts">
				<DiscountsManager owner={{ profileId: userId }} />
			</TabsContent>
		</Tabs>
	);
}
