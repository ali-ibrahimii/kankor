import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
	AccountType,
	SignupForm,
} from "@/app/[locale]/auth/signup/signup-form";
import { BasePageProps } from "@/types/common.types";

export async function generateMetadata({
	searchParams,
}: BasePageProps): Promise<Metadata> {
	const { type } = await searchParams;
	const t = await getTranslations("auth");

	const title =
		type === "school"
			? t("registerSchoolPage.title")
			: type === "instructor"
				? t("registerInstructorPage.title")
				: t("registerStudentPage.title");

	return { title };
}

export default async function SignupPage({ searchParams }: BasePageProps) {
	const search = await searchParams;
	return <SignupForm type={search.type as AccountType} />;
}
