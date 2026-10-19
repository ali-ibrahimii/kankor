import { CheckCircle2, ShieldX } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { serverEnv } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";
import { BaseParams } from "@/types/common.types";

// Verification results are immutable once issued — cache aggressively.
export const revalidate = 3600;

interface VerifiedCertificate {
	user_full_name: string;
	course_title: string;
	issued_at: string | null;
	created_at: string;
}

async function verifyCertificate(
	code: string
): Promise<VerifiedCertificate | null> {
	const client = await createClient();
	// Anon-callable security-definer RPC: exposes only name/course/dates —
	// never ids or storage keys. See migration
	// 20260713000000_certificate_pdf_and_verification.sql.
	//
	// The `as never` casts bridge the gap until that migration is pushed and
	// `pnpm gen:types` regenerates database.types.ts — they can be removed
	// afterwards.
	const { data, error } = await client
		.rpc("verify_certificate" as never, { p_verification_code: code } as never)
		.maybeSingle();
	if (error || !data) return null;
	return data as unknown as VerifiedCertificate;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams & { code: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "certificates.verify" });
	return { title: t("metaTitle"), description: t("description") };
}

export default async function VerifyCertificatePage({
	params,
}: {
	params: Promise<BaseParams & { code: string }>;
}) {
	const { code: rawCode, locale } = await params;
	setRequestLocale(locale);

	const code = decodeURIComponent(rawCode);
	const t = await getTranslations({ locale, namespace: "certificates.verify" });
	const certificate = await verifyCertificate(code);

	const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

	return (
		<div className="container mx-auto flex max-w-xl flex-col gap-4 px-4 py-12">
			<div className="text-center">
				<h1 className="text-2xl font-bold">{t("title")}</h1>
				<p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
			</div>

			{certificate ? (
				<Card className="border-emerald-200 dark:border-emerald-900">
					<CardHeader>
						<div className="flex items-center gap-2">
							<CheckCircle2 className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
							<CardTitle className="text-emerald-700 dark:text-emerald-400">
								{t("validTitle")}
							</CardTitle>
						</div>
						<CardDescription>
							{t("validDescription", { platform: serverEnv.app.name })}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
							<div>
								<dt className="text-muted-foreground">{t("student")}</dt>
								<dd className="font-medium">{certificate.user_full_name}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">{t("course")}</dt>
								<dd className="font-medium">{certificate.course_title}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">{t("completedAt")}</dt>
								<dd className="font-medium">
									{dateFormatter.format(new Date(certificate.created_at))}
								</dd>
							</div>
							{certificate.issued_at && (
								<div>
									<dt className="text-muted-foreground">{t("issuedAt")}</dt>
									<dd className="font-medium">
										{dateFormatter.format(new Date(certificate.issued_at))}
									</dd>
								</div>
							)}
							<div className="sm:col-span-2">
								<dt className="text-muted-foreground">{t("code")}</dt>
								<dd className="font-mono font-medium tracking-wider">
									{code.toUpperCase()}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
			) : (
				<Card className="border-destructive/30">
					<CardHeader>
						<div className="flex items-center gap-2">
							<ShieldX className="size-6 shrink-0 text-destructive" />
							<CardTitle className="text-destructive">
								{t("invalidTitle")}
							</CardTitle>
						</div>
						<CardDescription>
							{t("invalidDescription", { code: code.toUpperCase() })}
						</CardDescription>
					</CardHeader>
				</Card>
			)}
		</div>
	);
}
