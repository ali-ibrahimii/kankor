"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { BellIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/hooks/use-form";
import { deleteAnnouncement, postAnnouncement } from "./actions";
import {
	addAnnouncementAtom,
	announcementsAtom,
	classroomAtom,
	removeAnnouncementAtom,
} from "./store";
import type { ClassroomAnnouncement, NewAnnouncementFormValues } from "./types";

// ─── Relative time ────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

// ─── Announcement item ────────────────────────────────────────────────────────

function AnnouncementItem({
	announcement,
}: {
	announcement: ClassroomAnnouncement;
}) {
	const t = useTranslations("classroomBuilder");
	const removeAnnouncement = useSetAtom(removeAnnouncementAtom);
	const [removing, setRemoving] = React.useState(false);

	const initials =
		announcement.author?.full_name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) ?? "?";

	async function handleDelete() {
		setRemoving(true);
		const result = await deleteAnnouncement(announcement.id);
		if (!result.success) {
			toast.error(result.error);
			setRemoving(false);
			return;
		}
		removeAnnouncement(announcement.id);
	}

	return (
		<div className="flex gap-3">
			<Avatar className="size-8 shrink-0">
				{announcement.author?.avatar_url && (
					<AvatarImage src={announcement.author.avatar_url} />
				)}
				<AvatarFallback className="text-xs">{initials}</AvatarFallback>
			</Avatar>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">
							{announcement.author?.full_name ??
								t("announcements.unknownAuthor")}
						</span>
						<span className="text-xs text-muted-foreground">
							{timeAgo(announcement.created_at)}
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="size-6 text-muted-foreground hover:text-destructive"
						onClick={handleDelete}
						disabled={removing}
						aria-label={t("common.delete")}
					>
						<TrashIcon className="size-3.5" />
					</Button>
				</div>
				<p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
					{announcement.message}
				</p>
			</div>
		</div>
	);
}

// ─── Post form ────────────────────────────────────────────────────────────────

function PostAnnouncementForm({ classroomId }: { classroomId: string }) {
	const t = useTranslations("classroomBuilder");
	const addAnnouncement = useSetAtom(addAnnouncementAtom);

	const form = useAppForm({
		defaultValues: {
			message: "",
		} satisfies NewAnnouncementFormValues,
		onSubmit: async ({ value }) => {
			const result = await postAnnouncement(classroomId, value);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			addAnnouncement(result.data);
			form.reset();
		},
	});

	return (
		<form.AppForm>
			<form
				className="space-y-3 rounded-xl border bg-card p-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.AppField
					name="message"
					validators={{
						onBlur: z
							.string()
							.min(1, t("validation.messageRequired"))
							.max(2000),
					}}
				>
					{(field) => (
						<field.TextareaField
							label={t("announcements.newLabel")}
							placeholder={t("announcements.placeholder")}
							rows={3}
							maxLength={2000}
						/>
					)}
				</form.AppField>

				<div className="flex justify-end">
					<form.SubmitButton size="sm">
						{t("announcements.post")}
					</form.SubmitButton>
				</div>
			</form>
		</form.AppForm>
	);
}

// ─── Announcements tab ────────────────────────────────────────────────────────

export function AnnouncementsTab() {
	const t = useTranslations("classroomBuilder");
	const classroom = useAtomValue(classroomAtom);
	const announcements = useAtomValue(announcementsAtom);

	return (
		<div className="space-y-6">
			<PostAnnouncementForm classroomId={classroom.id} />

			{announcements.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 text-center">
					<BellIcon className="size-10 text-muted-foreground/40" />
					<div>
						<p className="font-medium text-sm">
							{t("announcements.emptyTitle")}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{t("announcements.emptyDescription")}
						</p>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					{announcements.map((a, i) => (
						<React.Fragment key={a.id}>
							<AnnouncementItem announcement={a} />
							{i < announcements.length - 1 && <Separator />}
						</React.Fragment>
					))}
				</div>
			)}
		</div>
	);
}
