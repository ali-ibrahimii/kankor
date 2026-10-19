"use client";

import { useQuery } from "@tanstack/react-query";
import { School } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { listMyClassrooms, listMyPendingClassroomRequests } from "./actions";
import { JoinClassroomDialog } from "./join-classroom-dialog";
import { PendingRequestsSection } from "./pending-requests-section";
import type { MyClassroom } from "./types";

function ClassroomCard({ classroom }: { classroom: MyClassroom }) {
	const t = useTranslations("classrooms");

	return (
		<Link
			href={routes.d.classrooms.classroom_id.page({
				classroom_id: classroom.classroom_id,
			})}
			className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60"
		>
			<div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<School className="size-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold">{classroom.name}</p>
				{classroom.description && (
					<p className="truncate text-xs text-muted-foreground">
						{classroom.description}
					</p>
				)}
			</div>
			<Badge variant="outline" className="shrink-0">
				{t(`role.${classroom.role}` as "role.student")}
			</Badge>
		</Link>
	);
}

export function MyClassroomsList({ inviteCode }: { inviteCode?: string }) {
	const t = useTranslations("classrooms");

	const classroomsQuery = useQuery({
		queryKey: ["my_classrooms"],
		queryFn: () => listMyClassrooms(),
	});
	const requestsQuery = useQuery({
		queryKey: ["my_classroom_requests"],
		queryFn: () => listMyPendingClassroomRequests(),
	});

	const classrooms =
		(classroomsQuery.data?.success ? classroomsQuery.data.data : []) ?? [];
	const hasPendingRequests =
		(requestsQuery.data?.success ? requestsQuery.data.data.length : 0) > 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-end">
				<JoinClassroomDialog inviteCode={inviteCode} />
			</div>

			<PendingRequestsSection />

			{classroomsQuery.isLoading ? (
				<div className="flex flex-col gap-2">
					<Skeleton className="h-16 w-full rounded-xl" />
					<Skeleton className="h-16 w-full rounded-xl" />
				</div>
			) : classrooms.length === 0 && !hasPendingRequests ? (
				<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 py-20 text-center">
					<p className="text-sm font-medium">{t("emptyTitle")}</p>
					<p className="text-xs text-muted-foreground">
						{t("emptyDescription")}
					</p>
				</div>
			) : classrooms.length === 0 ? null : (
				<div className="flex flex-col gap-2">
					{classrooms.map((classroom) => (
						<ClassroomCard
							key={classroom.membership_id}
							classroom={classroom}
						/>
					))}
				</div>
			)}
		</div>
	);
}
