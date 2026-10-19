import { useLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isRtl } from "@/i18n/routing";
import { BaseParams } from "@/types/common.types";
import { AboutContactSection } from "./_components/about-contact-section";
import { AboutDownloadSection } from "./_components/about-download-section";
import { AboutFeaturesSection } from "./_components/about-features-section";
import { AboutHeroSection } from "./_components/about-hero-section";
import { AboutMissionSection } from "./_components/about-mission-section";
import { AboutStatsSection } from "./_components/about-stats-section";
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

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default function AboutUsPage() {
	const locale = useLocale();
	const rtl = isRtl(locale);

	return (
		<div dir={rtl ? "rtl" : "ltr"} className="min-h-screen">
			<AboutHeroSection isRtl={rtl} />
			<AboutStatsSection />
			<AboutMissionSection />
			<AboutFeaturesSection />
			<AboutValuesSection />
			<AboutVideoSection videoId="2REnqD3JLtQ" thumbnailUrl="/og-image.png" />
			<AboutTeamSection />
			<AboutContactSection />
			<AboutDownloadSection />
		</div>
	);
}
