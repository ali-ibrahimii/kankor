import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	getCreditLedger,
	getPurchaseHistory,
	getSellerEarnings,
	WalletView,
} from "@/components/blocks/credits";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { BaseParams } from "@/types/common.types";

export default async function WalletPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const user = await getCurrentUser();
	if (!user) redirect(routes.auth.login.page(undefined, { locale }));

	const [ledgerResult, purchasesResult, earningsResult] = await Promise.all([
		getCreditLedger(user.id),
		getPurchaseHistory(user.id),
		getSellerEarnings({ profileId: user.id }),
	]);

	const t = await getTranslations("credits.wallet");

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold">{t("title")}</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("subtitle")}
					</p>
				</div>
				<div className="text-end">
					<p className="text-xs text-muted-foreground">{t("balanceLabel")}</p>
					<p className="text-2xl font-bold tabular-nums text-[#1461B8]">
						{t("balanceCredits", { count: user.credit_balance })}
					</p>
				</div>
			</div>

			<WalletView
				userId={user.id}
				ledger={ledgerResult.success ? ledgerResult.data : []}
				purchases={purchasesResult.success ? purchasesResult.data : []}
				sales={earningsResult.success ? earningsResult.data.sales : []}
				totalEarned={
					earningsResult.success ? earningsResult.data.totalCredits : 0
				}
			/>
		</div>
	);
}
