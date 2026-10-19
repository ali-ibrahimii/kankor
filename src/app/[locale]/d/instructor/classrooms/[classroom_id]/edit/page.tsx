import { notFound } from "next/navigation";
import { ClassroomBuilder } from "@/components/blocks/classroom-builder";
import { loadClassroomBuilder } from "@/components/blocks/classroom-builder/actions";
import { routes } from "@/lib/routes";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstructorClassroomEditPage({
	params,
}: {
	params: Promise<{ classroom_id: string }>;
}) {
	const { classroom_id } = await params;

	const result = await loadClassroomBuilder(classroom_id);

	if (!result.success) notFound();

	const { classroom, members, resources, materials, folders, announcements } =
		result.data;

	return (
		<ClassroomBuilder
			classroomId={classroom_id}
			initialClassroom={classroom}
			initialMembers={members}
			initialResources={resources}
			initialMaterials={materials}
			initialFolders={folders}
			initialAnnouncements={announcements}
			basePath={routes.d.instructor.page()}
		/>
	);
}
