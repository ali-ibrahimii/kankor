"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
	CheckIcon,
	CopyIcon,
	LinkIcon,
	RefreshCwIcon,
	TrashIcon,
	UsersIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { routes } from "@/lib/routes";
import {
	regenerateJoinCode,
	removeClassroomMember,
	updateMemberRole,
} from "./actions";
import { InviteStudentDialog } from "./invite-student-dialog";
import { JoinRequestsSection } from "./join-requests-section";
import {
	classroomAtom,
	membersAtom,
	patchClassroomAtom,
	removeMemberAtom,
	updateMemberRoleAtom,
} from "./store";
import type { ClassroomMember, ClassroomRole } from "./types";

// ─── Role badge colors ────────────────────────────────────────────────────────

const ROLE_VARIANTS: Record<
	ClassroomRole,
	"default" | "secondary" | "outline" | "destructive"
> = {
	owner: "default",
	instructor: "secondary",
	assistant: "outline",
	student: "outline",
};

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({ member }: { member: ClassroomMember }) {
	const t = useTranslations("classroomBuilder");
	const removeMember = useSetAtom(removeMemberAtom);
	const updateRole = useSetAtom(updateMemberRoleAtom);
	const [removing, setRemoving] = React.useState(false);
	const [updatingRole, setUpdatingRole] = React.useState(false);

	const initials =
		member.profile?.full_name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) ?? "?";

	async function handleRemove() {
		setRemoving(true);
		const result = await removeClassroomMember(member.id);
		if (!result.success) {
			toast.error(result.error);
			setRemoving(false);
			return;
		}
		removeMember(member.id);
	}

	async function handleRoleChange(role: string) {
		setUpdatingRole(true);
		const result = await updateMemberRole(member.id, role as ClassroomRole);
		if (!result.success) {
			toast.error(result.error);
			setUpdatingRole(false);
			return;
		}
		updateRole({ id: member.id, role: role as ClassroomRole });
		setUpdatingRole(false);
	}

	const isOwner = member.role === "owner";

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
			<Avatar className="size-8 shrink-0">
				{member.profile?.avatar_url && (
					<AvatarImage src={member.profile.avatar_url} />
				)}
				<AvatarFallback className="text-xs">{initials}</AvatarFallback>
			</Avatar>

			<div className="flex-1 min-w-0">
				<p className="truncate text-sm font-medium">
					{member.profile?.full_name ?? t("members.unknownUser")}
				</p>
			</div>

			{isOwner ? (
				<Badge variant={ROLE_VARIANTS.owner} className="shrink-0 text-xs">
					{t("members.role.owner")}
				</Badge>
			) : (
				<Select
					value={member.role}
					onValueChange={handleRoleChange}
					disabled={updatingRole}
				>
					<SelectTrigger className="h-7 w-[120px] text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="instructor">
							{t("members.role.instructor")}
						</SelectItem>
						<SelectItem value="assistant">
							{t("members.role.assistant")}
						</SelectItem>
						<SelectItem value="student">{t("members.role.student")}</SelectItem>
					</SelectContent>
				</Select>
			)}

			{!isOwner && (
				<Button
					variant="ghost"
					size="icon"
					className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
					onClick={handleRemove}
					disabled={removing}
					aria-label={t("common.remove")}
				>
					<TrashIcon className="size-4" />
				</Button>
			)}
		</div>
	);
}

// ─── Join code panel ──────────────────────────────────────────────────────────

function JoinCodePanel() {
	const t = useTranslations("classroomBuilder");
	const locale = useLocale();
	const classroom = useAtomValue(classroomAtom);
	const patchClassroom = useSetAtom(patchClassroomAtom);
	const [copied, setCopied] = React.useState<"code" | "link" | null>(null);
	const [regenerating, setRegenerating] = React.useState(false);

	async function handleCopy(value: string, kind: "code" | "link") {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(kind);
			toast.success(
				t(kind === "code" ? "members.codeCopied" : "members.linkCopied")
			);
			setTimeout(() => setCopied(null), 1500);
		} catch {
			toast.error(t("members.copyFailed"));
		}
	}

	async function handleRegenerate() {
		setRegenerating(true);
		const result = await regenerateJoinCode(classroom.id);
		if (!result.success) {
			toast.error(result.error);
			setRegenerating(false);
			return;
		}
		patchClassroom({ join_code: result.data.join_code });
		toast.success(t("members.joinCodeRegenerated"));
		setRegenerating(false);
	}

	return (
		<div className="rounded-xl border bg-card p-4">
			<p className="text-sm font-medium mb-2">{t("members.joinCodeLabel")}</p>
			<p className="text-xs text-muted-foreground mb-3">
				{t("members.joinCodeDescription")}
			</p>
			<div className="flex items-center gap-2">
				<code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-lg font-bold tracking-widest text-center">
					{classroom.join_code}
				</code>
				<Button
					variant="outline"
					size="icon"
					onClick={() => handleCopy(classroom.join_code, "code")}
					aria-label={t("members.copyCode")}
				>
					{copied === "code" ? (
						<CheckIcon className="size-4 text-green-600" />
					) : (
						<CopyIcon className="size-4" />
					)}
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={handleRegenerate}
					disabled={regenerating}
					aria-label={t("members.regenerateCode")}
				>
					<RefreshCwIcon
						className={`size-4 ${regenerating ? "animate-spin" : ""}`}
					/>
				</Button>
			</div>
			<div className="mt-3 flex flex-wrap items-center gap-3">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => {
						const path = routes.d.classrooms.page(
							{ join: classroom.join_code },
							{ locale }
						);
						void handleCopy(
							new URL(path, window.location.origin).toString(),
							"link"
						);
					}}
				>
					{copied === "link" ? (
						<CheckIcon className="size-4" />
					) : (
						<LinkIcon className="size-4" />
					)}
					{t("members.copyInviteLink")}
				</Button>
				<p className="text-xs text-muted-foreground">
					{t("members.inviteLinkHint")}
				</p>
			</div>
		</div>
	);
}

// ─── Members tab ──────────────────────────────────────────────────────────────

export function MembersTab() {
	const t = useTranslations("classroomBuilder");
	const classroom = useAtomValue(classroomAtom);
	const members = useAtomValue(membersAtom);

	return (
		<div className="space-y-6">
			<JoinCodePanel />

			<JoinRequestsSection classroomId={classroom.id} />

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{t("members.subtitle", { count: members.length })}
					</p>
					<InviteStudentDialog classroomId={classroom.id} />
				</div>

				{members.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 text-center">
						<UsersIcon className="size-10 text-muted-foreground/40" />
						<div>
							<p className="font-medium text-sm">{t("members.emptyTitle")}</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								{t("members.emptyDescription")}
							</p>
						</div>
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
