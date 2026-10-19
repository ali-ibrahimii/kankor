import { getTranslations, setRequestLocale } from "next-intl/server";
import { MyClassroomsList } from "@/components/blocks/classrooms";
import { BaseParams } from "@/types/common.types";

export default async function ClassroomsPage({
	params,
	searchParams,
}: {
	params: Promise<BaseParams>;
	searchParams: Promise<{ join?: string | string[] }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const { join } = await searchParams;
	// The invite is only a prefilled code. Students still submit a request
	// themselves; the teacher must approve it before membership is granted.
	const inviteCode =
		typeof join === "string" && join.trim().length > 0 && join.length <= 80
			? join.trim()
			: undefined;

	const t = await getTranslations("classrooms");

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			<MyClassroomsList inviteCode={inviteCode} />
		</div>
	);
}
