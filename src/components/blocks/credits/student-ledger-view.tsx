"use client";

import { CoinsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";
import type { CreditTransactionItem, PurchaseItem } from "./actions";
import { ChargeCreditsDialog } from "./charge-credits-dialog";

export interface StudentLedgerViewProps {
	userId: string;
	userName: string | null;
	ledger: CreditTransactionItem[];
	purchases: PurchaseItem[];
}

export function StudentLedgerView({
	userId,
	userName,
	ledger,
	purchases,
}: StudentLedgerViewProps) {
	const t = useTranslations("credits.admin");
	const router = useRouter();
	const [chargeOpen, setChargeOpen] = React.useState(false);

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button size="sm" onClick={() => setChargeOpen(true)}>
					<CoinsIcon className="size-3.5" />
					{t("charge")}
				</Button>
			</div>

			<Tabs defaultValue="ledger">
				<TabsList>
					<TabsTrigger value="ledger">{t("tabs.ledger")}</TabsTrigger>
					<TabsTrigger value="purchases">{t("tabs.purchases")}</TabsTrigger>
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
									<TableHead>{t("ledgerTable.note")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{ledger.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
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
											<TableCell className="text-sm text-muted-foreground">
												{tx.note ?? "—"}
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
			</Tabs>

			<ChargeCreditsDialog
				open={chargeOpen}
				onOpenChange={setChargeOpen}
				userId={userId}
				userName={userName}
				onCharged={() => router.refresh()}
			/>
		</div>
	);
}
