"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	listMyPendingClassroomRequests,
	respondToMyClassroomRequest,
} from "./actions";
import type { MyClassroomRequest } from "./types";

function RequestRow({ request }: { request: MyClassroomRequest }) {
	const t = useTranslations("classrooms");
	const queryClient = useQueryClient();
	const [isResponding, setIsResponding] = useState(false);

	const isInstructorInvite = request.initiated_by === "instructor";

	async function handleRespond(approve: boolean) {
		setIsResponding(true);
		const result = await respondToMyClassroomRequest(request.id, approve);
		setIsResponding(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(approve ? t("requestApproved") : t("requestDeclined"));
		queryClient.invalidateQueries({ queryKey: ["my_classroom_requests"] });
		queryClient.invalidateQueries({ queryKey: ["my_classrooms"] });
	}

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
			<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
				{isInstructorInvite ? (
					<UserPlus className="size-4" />
				) : (
					<Clock className="size-4" />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">{request.classroom_name}</p>
				<p className="text-xs text-muted-foreground">
					{isInstructorInvite ? t("invitedDescription") : t("awaitingApproval")}
				</p>
			</div>
			{isInstructorInvite ? (
				<div className="flex shrink-0 gap-2">
					<Button
						size="sm"
						disabled={isResponding}
						onClick={() => handleRespond(true)}
					>
						{t("accept")}
					</Button>
					<Button
						size="sm"
						variant="outline"
						disabled={isResponding}
						onClick={() => handleRespond(false)}
					>
						{t("decline")}
					</Button>
				</div>
			) : (
				<Badge variant="secondary" className="shrink-0">
					{t("pendingBadge")}
				</Badge>
			)}
		</div>
	);
}

export function PendingRequestsSection() {
	const t = useTranslations("classrooms");

	const requestsQuery = useQuery({
		queryKey: ["my_classroom_requests"],
		queryFn: () => listMyPendingClassroomRequests(),
	});

	const requests =
		(requestsQuery.data?.success ? requestsQuery.data.data : []) ?? [];

	if (!requestsQuery.isLoading && requests.length === 0) return null;

	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm font-medium">{t("pendingTitle")}</p>
			{requestsQuery.isLoading ? (
				<div className="flex flex-col gap-2">
					<Skeleton className="h-16 w-full rounded-lg" />
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{requests.map((request) => (
						<RequestRow key={request.id} request={request} />
					))}
				</div>
			)}
		</div>
	);
}
