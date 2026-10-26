import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { defaultLocale, type Locale, locales } from "@/i18n";

import { getSchoolHubData } from "./_components/course-hub-data";
import { SchoolHubView } from "./_components/course-hub-view";

function resolveLocale(value: string): Locale {
	return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const validLocale = resolveLocale(locale);
	const t = await getTranslations({
		locale: validLocale,
		namespace: "schoolHub",
	});

	return {
		title: t("metaTitle"),
		description: t("metaDescription"),
	};
}

export default async function PublicCoursesPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { locale } = await params;
	const validLocale = resolveLocale(locale);
	const sp = await searchParams;
	const rawSearch = Array.isArray(sp.search) ? sp.search[0] : sp.search;

	const data = await getSchoolHubData(validLocale);

	return <SchoolHubView data={data} initialQuery={rawSearch ?? ""} />;
}
