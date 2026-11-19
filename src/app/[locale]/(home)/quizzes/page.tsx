import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { QuizCatalog } from "@/components/blocks/quizzes";
import { publicQuizzesQueryFn } from "@/components/blocks/quizzes/public-quiz-query";
import type { PublicQuiz } from "@/components/blocks/quizzes/types";
import { getQueryFilterData } from "@/hooks/filter/filter.server";
import { defaultLocale, type Locale, locales } from "@/i18n";
import { isSupabaseServerConfigured, serverEnv } from "@/lib/env/server-env";
import { safeJsonLd } from "@/lib/seo/json-ld";
import type { BaseParams } from "@/types/common.types";
import { getFallbackQuizzes } from "./_components/quizzes-fallback-data";
import { QuizzesGuideSection } from "./_components/quizzes-guide-section";

export const revalidate = 86400;

function resolveLocale(value: string): Locale {
	return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}): Promise<Metadata> {
	const { locale } = await params;
	const validLocale = resolveLocale(locale);
	const t = await getTranslations({
		locale: validLocale,
		namespace: "quizzes",
	});
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");
	const path = `${baseUrl}/${validLocale}/quizzes`;

	return {
		title: t("title"),
		description: t("description"),
		alternates: {
			canonical: path,
			languages: {
				fa: `${baseUrl}/fa/quizzes`,
				ps: `${baseUrl}/ps/quizzes`,
				en: `${baseUrl}/en/quizzes`,
			},
		},
		openGraph: {
			title: t("title"),
			description: t("description"),
			url: path,
			locale: validLocale,
			type: "website",
			images: [{ url: `${baseUrl}/og-image.png` }],
		},
		twitter: {
			card: "summary_large_image",
			title: t("title"),
			description: t("description"),
			images: [`${baseUrl}/og-image.png`],
		},
	};
}

export default async function QuizzesPage({
	params,
	searchParams,
}: {
	params: Promise<BaseParams>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { locale } = await params;
	const validLocale = resolveLocale(locale);
	setRequestLocale(validLocale);

	const [t, s, initialData] = await Promise.all([
		getTranslations({ locale: validLocale, namespace: "quizzes" }),
		getTranslations({ locale: validLocale, namespace: "seo" }),
		getQueryFilterData<"quizzes", PublicQuiz[]>(searchParams, "quizzes", {
			name: "public-quizzes",
			queryFn: publicQuizzesQueryFn,
			defaultSort: [{ field: "created_at", direction: "desc" }],
			defaultPagination: { page: 1, pageSize: 12 },
		}),
	]);

	const fallbackItems = isSupabaseServerConfigured
		? []
		: getFallbackQuizzes(validLocale);

	const baseUrl = serverEnv.app.address.replace(/\/$/, "");
	const collectionLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: t("title"),
		description: t("description"),
		url: `${baseUrl}/${validLocale}/quizzes`,
	};

	const breadcrumbLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: s("home"),
				item: `${baseUrl}/${validLocale}`,
			},
			{
				"@type": "ListItem",
				position: 2,
				name: s("quizzes"),
				item: `${baseUrl}/${validLocale}/quizzes`,
			},
		],
	};

	return (
		<div className="min-h-screen bg-[#f9faff] text-[#19243b] dark:bg-[#141b2c] dark:text-slate-100">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
			/>

			<QuizCatalog
				showHero
				initialData={initialData}
				fallbackItems={fallbackItems}
				useLiveBackend={isSupabaseServerConfigured}
			/>

			<QuizzesGuideSection locale={validLocale} />
		</div>
	);
}
