import { getTranslations, setRequestLocale } from "next-intl/server";
import { SchoolMembersPanel } from "@/components/blocks/school/school-members-panel";
import { BaseParams } from "@/types/common.types";

export default async function SchoolMembersPage({
	params,
}: {
	params: Promise<BaseParams & { school_id: string }>;
}) {
	const { locale, school_id } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("schoolMembers");

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			<SchoolMembersPanel schoolId={school_id} />
		</div>
	);
}
