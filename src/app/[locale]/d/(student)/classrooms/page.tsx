import { getTranslations, setRequestLocale } from "next-intl/server";
import { MyClassroomsList } from "@/components/blocks/classrooms";
import { BaseParams } from "@/types/common.types";

export default async function ClassroomsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("classrooms");

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			<MyClassroomsList />
		</div>
	);
}
