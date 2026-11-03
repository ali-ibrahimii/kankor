import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { KankorExamPageContent } from "./page-content";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "kankorExam" });

	return {
		title: t("title"),
		description: t("introDescription"),
	};
}

export default function KankorExamPage() {
	return <KankorExamPageContent />;
}
