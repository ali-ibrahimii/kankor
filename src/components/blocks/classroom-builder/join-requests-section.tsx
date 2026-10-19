"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	cancelClassroomRequest,
	listClassroomRequests,
	respondToClassroomRequest,
} from "./invite-actions";
import type { ClassroomMembershipRequest } from "./types";

function RequestRow({
	request,
	onResponded,
}: {
	request: ClassroomMembershipRequest;
	onResponded: (requestId: string) => void;
}) {
	const t = useTranslations("classroomBuilder");
	const [isResponding, setIsResponding] = React.useState(false);
	const isOwnInvite = request.initiated_by === "instructor";

	const initials =
		request.profile?.full_name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) ?? "?";

	async function handleRespond(approve: boolean) {
		setIsResponding(true);
		const result = await respondToClassroomRequest(request.id, approve);
		setIsResponding(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(
			approve ? t("members.requests.approved") : t("members.requests.declined")
		);
		onResponded(request.id);
	}

	async function handleCancel() {
		setIsResponding(true);
		const result = await cancelClassroomRequest(request.id);
		setIsResponding(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(t("members.requests.canceled"));
		onResponded(request.id);
	}

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
			<Avatar className="size-8 shrink-0">
				{request.profile?.avatar_url && (
					<AvatarImage src={request.profile.avatar_url} />
				)}
				<AvatarFallback className="text-xs">{initials}</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">
					{request.profile?.full_name ?? t("members.unknownUser")}
				</p>
				<p className="truncate text-xs text-muted-foreground">
					{isOwnInvite
						? t("members.requests.invitedAwaiting")
						: (request.profile?.email ?? t("members.requests.wantsToJoin"))}
				</p>
			</div>
			{isOwnInvite ? (
				<Button
					size="sm"
					variant="outline"
					disabled={isResponding}
					onClick={handleCancel}
				>
					{t("members.requests.cancel")}
				</Button>
			) : (
				<>
					<Button
						size="sm"
						disabled={isResponding}
						onClick={() => handleRespond(true)}
					>
						{t("members.requests.approve")}
					</Button>
					<Button
						size="sm"
						variant="outline"
						disabled={isResponding}
						onClick={() => handleRespond(false)}
					>
						{t("members.requests.decline")}
					</Button>
				</>
			)}
		</div>
	);
}

export function JoinRequestsSection({ classroomId }: { classroomId: string }) {
	const t = useTranslations("classroomBuilder");
	const queryClient = useQueryClient();

	const requestsQuery = useQuery({
		queryKey: ["classroom_membership_requests", classroomId],
		queryFn: () => listClassroomRequests(classroomId),
	});

	function handleResponded() {
		queryClient.invalidateQueries({
			queryKey: ["classroom_membership_requests", classroomId],
		});
	}

	const requests =
		(requestsQuery.data?.success ? requestsQuery.data.data : []) ?? [];

	if (!requestsQuery.isLoading && requests.length === 0) return null;

	return (
		<div className="space-y-3">
			<p className="text-sm font-medium">
				{t("members.requests.title")}
				{requests.length > 0 &&
					` — ${t("members.requests.subtitle", { count: requests.length })}`}
			</p>

			{requestsQuery.isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-14 w-full rounded-lg" />
					<Skeleton className="h-14 w-full rounded-lg" />
				</div>
			) : (
				<div className="space-y-2">
					{requests.map((request) => (
						<RequestRow
							key={request.id}
							request={request}
							onResponded={handleResponded}
						/>
					))}
				</div>
			)}
		</div>
	);
}
