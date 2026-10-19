"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Shared "why are you suspending this?" dialog for agency moderation.
 * The reason is stored on the target and in the audit log.
 */
export function ModerationReasonDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	onConfirm: (reason: string) => void | Promise<void>;
}) {
	const t = useTranslations("dashboard.agency.moderation");
	const [reason, setReason] = React.useState("");

	React.useEffect(() => {
		if (open) setReason("");
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">{description}</p>
				<div className="space-y-2">
					<Label htmlFor="moderation-reason">{t("reason")}</Label>
					<Textarea
						id="moderation-reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t("reasonPlaceholder")}
					/>
				</div>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("cancel")}
					</Button>
					<Button
						variant="destructive"
						disabled={reason.trim().length === 0}
						onClick={() => onConfirm(reason.trim())}
					>
						{t("confirmSuspend")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
