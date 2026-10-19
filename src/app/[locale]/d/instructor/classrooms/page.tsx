"use client";

import { CirclePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import type { ClassroomMeta } from "@/components/blocks/classroom-builder";
import {
	ClassroomCard,
	ClassroomGrid,
	ClassroomGridEmpty,
	ClassroomGridSkeleton,
	NewClassroomDialog,
} from "@/components/blocks/classroom-builder";
import { Button } from "@/components/ui/button";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { scopedQueryFn } from "@/hooks/filter/query-state-mapping";
import { routes } from "@/lib/routes";
import { useAuthProfile } from "@/providers/auth.provider";

// ─── Select columns ───────────────────────────────────────────────────────────

const SELECT =
	"id, name, description, cover_image, join_code, is_archived, user_id, created_at, updated_at, classroom_members(count)";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstructorClassroomsPage() {
	const t = useTranslations("classroomBuilder");
	const profile = useAuthProfile();
	const userId = profile?.id;
	const [dialogOpen, setDialogOpen] = React.useState(false);

	// Owner scope is enforced here, not via a URL-synced filter, so it can't
	// be widened by editing the URL's `filters` param.
	const scopedFn = React.useMemo(
		() =>
			scopedQueryFn<"classrooms", ClassroomMeta[]>(
				SELECT,
				["name"],
				userId ? [{ field: "user_id", operator: "eq", value: userId }] : []
			),
		[userId]
	);

	const classroomsQuery = useQueryFilters<"classrooms", ClassroomMeta[]>({
		table: "classrooms",
		queryFn: scopedFn,
		initialState: {
			name: "instructor-classrooms",
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
		enabled: !!userId,
	});

	const classrooms = (classroomsQuery.data as any)?.data ?? [];
	const total = (classroomsQuery.data as any)?.count ?? null;

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold">{t("list.myClassrooms")}</h1>
					{total != null && (
						<p className="mt-0.5 text-sm text-muted-foreground">
							{t("list.subtitle", { count: total })}
						</p>
					)}
				</div>
				<Button size="sm" onClick={() => setDialogOpen(true)}>
					<CirclePlus className="size-4" />
					{t("list.newClassroom")}
				</Button>
			</div>

			{/* Grid */}
			{classroomsQuery.isFetching && classrooms.length === 0 ? (
				<ClassroomGridSkeleton count={6} />
			) : classrooms.length === 0 ? (
				<ClassroomGridEmpty
					action={
						<Button size="sm" onClick={() => setDialogOpen(true)}>
							<CirclePlus className="size-4" />
							{t("list.emptyAction")}
						</Button>
					}
				/>
			) : (
				<ClassroomGrid>
					{classrooms.map((classroom: ClassroomMeta) => (
						<ClassroomCard
							key={classroom.id}
							classroom={classroom}
							editHref={routes.d.instructor.classrooms.edit.page({
								classroom_id: classroom.id,
							})}
						/>
					))}
				</ClassroomGrid>
			)}

			{/* New classroom dialog */}
			<NewClassroomDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				basePath="/d/instructor"
			/>
		</div>
	);
}
