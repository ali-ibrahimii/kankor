import { setRequestLocale } from "next-intl/server";

import { listManagedRoadmaps } from "@/components/blocks/roadmap/actions";
import { RoadmapManager } from "@/components/blocks/roadmap/roadmap-manager";
import type { BaseParams } from "@/types/common.types";

/**
 * Admin roadmap manager — platform admins can create and manage roadmaps
 * (RLS: creator or admin). The instructor-facing twin lives at
 * /d/instructor/roadmaps.
 */
export default async function AdminRoadmapsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const result = await listManagedRoadmaps();
	return <RoadmapManager roadmaps={result.success ? result.data : []} />;
}
