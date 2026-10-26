import { getTranslations, setRequestLocale } from "next-intl/server";
import { BaseParams } from "@/types/common.types";
import { VerifyForm } from "./verify-form";

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "certificates.verify" });
	return { title: t("metaTitle"), description: t("description") };
}

export default async function VerifyPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "certificates.verify" });

	return (
		<div className="container mx-auto flex max-w-xl flex-col gap-6 px-4 pt-8 pb-16">
			<div className="text-center">
				<h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
				<p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
			</div>

			<VerifyForm />
		</div>
	);
}
