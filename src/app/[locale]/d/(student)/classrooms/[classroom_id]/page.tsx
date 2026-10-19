import { setRequestLocale } from "next-intl/server";
import { ClassroomDetailView } from "@/components/blocks/classrooms";
import { BaseParams } from "@/types/common.types";

export default async function ClassroomDetailPage({
	params,
}: {
	params: Promise<BaseParams & { classroom_id: string }>;
}) {
	const { locale, classroom_id } = await params;
	setRequestLocale(locale);

	return (
		<div className="flex flex-col gap-6 p-6">
			<ClassroomDetailView classroomId={classroom_id} />
		</div>
	);
}
