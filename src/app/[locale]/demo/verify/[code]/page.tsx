import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoCertificateView } from "@/components/blocks/demo/certificate-view";
import type { BaseParams } from "@/types/common.types";

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams & { code: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "demo.verify" });
	return { title: t("heading"), robots: { index: false, follow: false } };
}

export default async function DemoVerifyPage({
	params,
}: {
	params: Promise<BaseParams & { code: string }>;
}) {
	const { code, locale } = await params;
	setRequestLocale(locale);
	return <DemoCertificateView code={code} />;
}
