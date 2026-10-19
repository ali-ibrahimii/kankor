"use client";

import { useQueryClient } from "@tanstack/react-query";
import { UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteStudentToClassroom } from "./invite-actions";

export function InviteStudentDialog({ classroomId }: { classroomId: string }) {
	const t = useTranslations("classroomBuilder");
	const queryClient = useQueryClient();
	const [open, setOpen] = React.useState(false);
	const [email, setEmail] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setIsSubmitting(true);
		const result = await inviteStudentToClassroom(classroomId, email);
		setIsSubmitting(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(t("members.invite.sent"));
		queryClient.invalidateQueries({
			queryKey: ["classroom_membership_requests", classroomId],
		});
		setEmail("");
		setOpen(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<UserPlusIcon />
					{t("members.invite.button")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{t("members.invite.title")}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-2 py-4">
						<Label htmlFor="invite-student-email">
							{t("members.invite.emailLabel")}
						</Label>
						<Input
							id="invite-student-email"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t("members.invite.emailPlaceholder")}
						/>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								{t("common.cancel")}
							</Button>
						</DialogClose>
						<Button type="submit" disabled={isSubmitting}>
							{t("members.invite.submit")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
