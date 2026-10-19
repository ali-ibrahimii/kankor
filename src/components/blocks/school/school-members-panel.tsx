"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteMemberDialog } from "./invite-member-dialog";
import { listPendingSchoolInvites, listSchoolMembers } from "./members-actions";
import type { SchoolInviteRow, SchoolMemberRow } from "./members-types";

function initialsOf(name: string | null | undefined) {
	return (
		name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) ?? "?"
	);
}

function MemberRow({ member }: { member: SchoolMemberRow }) {
	const t = useTranslations("schoolMembers");

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
			<Avatar className="size-8 shrink-0">
				{member.profile?.avatar_url && (
					<AvatarImage src={member.profile.avatar_url} />
				)}
				<AvatarFallback className="text-xs">
					{initialsOf(member.profile?.full_name)}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">
					{member.profile?.full_name ?? member.profile?.email}
				</p>
				{member.profile?.email && (
					<p className="truncate text-xs text-muted-foreground">
						{member.profile.email}
					</p>
				)}
			</div>
			<Badge variant="outline" className="shrink-0">
				{t(`role.${member.role}`)}
			</Badge>
		</div>
	);
}

function InviteRow({ invite }: { invite: SchoolInviteRow }) {
	const t = useTranslations("schoolMembers");

	return (
		<div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3">
			<Avatar className="size-8 shrink-0">
				{invite.profile?.avatar_url && (
					<AvatarImage src={invite.profile.avatar_url} />
				)}
				<AvatarFallback className="text-xs">
					{initialsOf(invite.profile?.full_name)}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">
					{invite.profile?.full_name ?? invite.profile?.email}
				</p>
				{invite.profile?.email && (
					<p className="truncate text-xs text-muted-foreground">
						{invite.profile.email}
					</p>
				)}
			</div>
			<Badge variant="secondary" className="shrink-0">
				{t(`role.${invite.role}`)}
			</Badge>
		</div>
	);
}

export function SchoolMembersPanel({ schoolId }: { schoolId: string }) {
	const t = useTranslations("schoolMembers");

	const membersQuery = useQuery({
		queryKey: ["school_members", schoolId],
		queryFn: () => listSchoolMembers(schoolId),
	});
	const invitesQuery = useQuery({
		queryKey: ["school_member_invites", schoolId],
		queryFn: () => listPendingSchoolInvites(schoolId),
	});

	const members = membersQuery.data?.success ? membersQuery.data.data : [];
	const invites = invitesQuery.data?.success ? invitesQuery.data.data : [];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-end">
				<InviteMemberDialog schoolId={schoolId} />
			</div>

			{invites.length > 0 && (
				<div className="space-y-3">
					<p className="text-sm font-medium">{t("pendingTitle")}</p>
					<div className="space-y-2">
						{invites.map((invite) => (
							<InviteRow key={invite.id} invite={invite} />
						))}
					</div>
				</div>
			)}

			<div className="space-y-3">
				<p className="text-sm font-medium">{t("currentTitle")}</p>
				{membersQuery.isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-14 w-full rounded-lg" />
						<Skeleton className="h-14 w-full rounded-lg" />
					</div>
				) : (
					<div className="space-y-2">
						{members.map((member) => (
							<MemberRow key={member.id} member={member} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
