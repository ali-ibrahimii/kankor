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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { inviteSchoolMember } from "./members-actions";
import type { SchoolMemberRole } from "./members-types";

const INVITABLE_ROLES: SchoolMemberRole[] = [
	"admin",
	"manager",
	"instructor",
	"staff",
	"viewer",
];

export function InviteMemberDialog({ schoolId }: { schoolId: string }) {
	const t = useTranslations("schoolMembers");
	const queryClient = useQueryClient();
	const [open, setOpen] = React.useState(false);
	const [email, setEmail] = React.useState("");
	const [role, setRole] = React.useState<SchoolMemberRole>("staff");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setIsSubmitting(true);
		const result = await inviteSchoolMember(schoolId, email, role);
		setIsSubmitting(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(t("inviteDialog.sent"));
		setEmail("");
		setOpen(false);
		queryClient.invalidateQueries({
			queryKey: ["school_member_invites", schoolId],
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<UserPlusIcon />
					{t("inviteButton")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{t("inviteDialog.title")}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="invite-member-email">
								{t("inviteDialog.emailLabel")}
							</Label>
							<Input
								id="invite-member-email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={t("inviteDialog.emailPlaceholder")}
							/>
						</div>
						<div className="grid gap-2">
							<Label>{t("inviteDialog.roleLabel")}</Label>
							<Select
								value={role}
								onValueChange={(value) => setRole(value as SchoolMemberRole)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{INVITABLE_ROLES.map((r) => (
										<SelectItem key={r} value={r}>
											{t(`role.${r}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								{t("inviteDialog.cancel")}
							</Button>
						</DialogClose>
						<Button type="submit" disabled={isSubmitting}>
							{t("inviteDialog.submit")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
