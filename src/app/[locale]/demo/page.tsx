import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { normalizeDemoRole } from "@/lib/demo/mock-dashboard";
import type { BasePageProps } from "@/types/common.types";
import { DemoShell } from "./_components/demo-shell";

/**
 * Public design preview of the dashboards, driven entirely by mock data.
 *
 * `?role=student|instructor|school|admin` selects which overview is shown.
 * The route deliberately lives outside `/d` so it never touches auth,
 * middleware redirects, or Supabase.
 */

export async function generateMetadata({
	params,
}: BasePageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "demo" });
	return {
		title: t("pageTitle"),
		description: t("previewNotice"),
		robots: { index: false, follow: false },
	};
}

export default async function DemoPage({
	params,
	searchParams,
}: BasePageProps & {
	searchParams: Promise<{ role?: string | string[] }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const { role } = await searchParams;

	return <DemoShell role={normalizeDemoRole(role)} />;
}
