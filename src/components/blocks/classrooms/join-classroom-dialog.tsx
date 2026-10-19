"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogInIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestJoinClassroom } from "./actions";

export function JoinClassroomDialog() {
	const t = useTranslations("classrooms");
	const queryClient = useQueryClient();
	const [open, setOpen] = React.useState(false);
	const [code, setCode] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setIsSubmitting(true);
		const result = await requestJoinClassroom(code);
		setIsSubmitting(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(t("joinDialog.requested"));
		setCode("");
		setOpen(false);
		queryClient.invalidateQueries({ queryKey: ["my_classrooms"] });
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<LogInIcon />
					{t("join")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{t("joinDialog.title")}</DialogTitle>
						<DialogDescription>{t("joinDialog.description")}</DialogDescription>
					</DialogHeader>
					<div className="grid gap-2 py-4">
						<Label htmlFor="join-classroom-code">
							{t("joinDialog.codeLabel")}
						</Label>
						<Input
							id="join-classroom-code"
							required
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder={t("joinDialog.codePlaceholder")}
						/>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								{t("joinDialog.cancel")}
							</Button>
						</DialogClose>
						<Button type="submit" disabled={isSubmitting}>
							{t("joinDialog.submit")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
