import { getTranslations, setRequestLocale } from "next-intl/server";
import { serverEnv } from "@/lib/env/server-env";
import { BaseParams } from "@/types/common.types";
import HomeContent from "./page-content";

export const revalidate = 518400;

export default async function Home({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const [tApp, tMeta] = await Promise.all([
		getTranslations({ locale, namespace: "app" }),
		getTranslations({ locale, namespace: "metadata" }),
	]);

	const appName = tApp("name");
	const description = tMeta("description");
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: appName,
		description,
		operatingSystem: "Android, Web",
		applicationCategory: "EducationalApplication",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		publisher: {
			"@type": "Organization",
			name: appName,
			url: `${baseUrl}/${locale}`,
			logo: `${baseUrl}/apple-touch-icon.png`,
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<HomeContent locale={locale} />
		</>
	);
}
