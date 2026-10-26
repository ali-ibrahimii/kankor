import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n";
import { isRtl } from "@/i18n/routing";
import { serverEnv } from "@/lib/env/server-env";
import type { BaseParams } from "@/types/common.types";
import { AboutAudienceSection } from "./_components/about-audience-section";
import { AboutContactSection } from "./_components/about-contact-section";
import { AboutDownloadSection } from "./_components/about-download-section";
import { AboutFaqSection } from "./_components/about-faq-section";
import { AboutFeaturesSection } from "./_components/about-features-section";
import { AboutHeroSection } from "./_components/about-hero-section";
import { AboutMissionSection } from "./_components/about-mission-section";
import { AboutNav } from "./_components/about-nav";
import { AboutStatsSection } from "./_components/about-stats-section";
import { AboutStorySection } from "./_components/about-story-section";
import { AboutTeamSection } from "./_components/about-team-section";
import { AboutValuesSection } from "./_components/about-values-section";
import { AboutVideoSection } from "./_components/about-videoDemo-section";

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "aboutUs" });
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");
	const path = `${baseUrl}/${locale}/about`;

	return {
		title: t("title"),
		description: t("description"),
		alternates: {
			canonical: path,
			languages: {
				fa: `${baseUrl}/fa/about`,
				ps: `${baseUrl}/ps/about`,
				en: `${baseUrl}/en/about`,
			},
		},
		openGraph: {
			title: t("title"),
			description: t("description"),
			url: path,
			siteName: t("title"),
			locale,
			type: "website" as const,
			images: [{ url: `${baseUrl}/og-image.png` }],
		},
		twitter: {
			card: "summary_large_image" as const,
			title: t("title"),
			description: t("description"),
			images: [`${baseUrl}/og-image.png`],
		},
	};
}

export default async function AboutUsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const rtl = isRtl(locale as Locale);

	const [t, tApp] = await Promise.all([
		getTranslations({ locale, namespace: "aboutUs" }),
		getTranslations({ locale, namespace: "app" }),
	]);

	const baseUrl = serverEnv.app.address.replace(/\/$/, "");
	const faqRaw = t.raw("faq.items");
	const faqItems = Array.isArray(faqRaw)
		? (faqRaw as { question: string; answer: string }[])
		: [];

	const organizationLd = {
		"@context": "https://schema.org",
		"@type": "EducationalOrganization",
		name: tApp("name"),
		description: t("description"),
		url: `${baseUrl}/${locale}/about`,
		logo: `${baseUrl}/apple-touch-icon.png`,
		sameAs: [`${baseUrl}/${locale}`],
	};

	const faqLd =
		faqItems.length > 0
			? {
					"@context": "https://schema.org",
					"@type": "FAQPage",
					mainEntity: faqItems.map((item) => ({
						"@type": "Question",
						name: item.question,
						acceptedAnswer: {
							"@type": "Answer",
							text: item.answer,
						},
					})),
				}
			: null;

	return (
		<div dir={rtl ? "rtl" : "ltr"} className="min-h-screen">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
			/>
			{faqLd && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
				/>
			)}

			<AboutHeroSection isRtl={rtl} />
			<AboutStatsSection />
			<AboutNav />
			<AboutStorySection />
			<AboutMissionSection />
			<AboutFeaturesSection />
			<AboutAudienceSection />
			<AboutValuesSection />
			<AboutFaqSection />
			<AboutVideoSection videoId="2REnqD3JLtQ" thumbnailUrl="/og-image.png" />
			<AboutTeamSection />
			<AboutContactSection />
			<AboutDownloadSection />
		</div>
	);
}
