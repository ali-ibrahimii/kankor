import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoDashboard } from "@/components/blocks/demo/demo-dashboard";
import type { BaseParams } from "@/types/common.types";

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "demo" });
	return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

export default async function DemoPage({
	params,
	searchParams,
}: {
	params: Promise<BaseParams>;
	searchParams: Promise<{ invite?: string | string[] }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const { invite } = await searchParams;
	const invitation =
		typeof invite === "string" && invite.length < 1000 ? invite : undefined;
	return <DemoDashboard invitation={invitation} />;
}
