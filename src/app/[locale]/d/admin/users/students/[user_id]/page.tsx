import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	getCreditLedger,
	getPurchaseHistory,
	StudentLedgerView,
} from "@/components/blocks/credits";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { BaseParams } from "@/types/common.types";

export default async function AdminStudentLedgerPage({
	params,
}: {
	params: Promise<BaseParams & { user_id: string }>;
}) {
	const { user_id, locale } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const { data: student, error } = await supabase
		.from("profiles")
		.select("id, full_name, email, phone, credit_balance")
		.eq("id", user_id)
		.eq("role", "student")
		.single();

	if (error || !student) notFound();

	const [ledgerResult, purchasesResult] = await Promise.all([
		getCreditLedger(user_id),
		getPurchaseHistory(user_id),
	]);

	const t = await getTranslations("credits.admin");

	return (
		<div className="space-y-6 p-6">
			<Button asChild variant="ghost" size="sm" className="-ms-2">
				<Link href={routes.d.admin.users.students.page()}>
					<ArrowLeft className="size-4 rtl:rotate-180" />
					{t("backToStudents")}
				</Link>
			</Button>

			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold">
						{student.full_name ?? t("unnamedStudent")}
					</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{student.email}
						{student.phone ? ` · ${student.phone}` : ""}
					</p>
				</div>
				<div className="text-end">
					<p className="text-xs text-muted-foreground">{t("table.balance")}</p>
					<p className="text-2xl font-bold tabular-nums">
						{t("balanceCredits", { count: student.credit_balance })}
					</p>
				</div>
			</div>

			<StudentLedgerView
				userId={student.id}
				userName={student.full_name}
				ledger={ledgerResult.success ? ledgerResult.data : []}
				purchases={purchasesResult.success ? purchasesResult.data : []}
			/>
		</div>
	);
}
