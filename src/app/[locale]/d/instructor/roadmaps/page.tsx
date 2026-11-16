import { setRequestLocale } from "next-intl/server";

import { listManagedRoadmaps } from "@/components/blocks/roadmap/actions";
import { RoadmapManager } from "@/components/blocks/roadmap/roadmap-manager";
import type { BaseParams } from "@/types/common.types";

/**
 * Instructor roadmap manager — create roadmaps, publish them, and build
 * each roadmap's ordered course list. The same manager is available to
 * platform admins at /d/admin/roadmaps.
 */
export default async function InstructorRoadmapsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const result = await listManagedRoadmaps();
	return <RoadmapManager roadmaps={result.success ? result.data : []} />;
}
