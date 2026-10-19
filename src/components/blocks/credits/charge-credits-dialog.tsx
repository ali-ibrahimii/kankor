"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { chargeStudentCredits } from "./actions";

export interface ChargeCreditsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string;
	userName: string | null;
	onCharged?: (balanceAfter: number) => void;
}

export function ChargeCreditsDialog({
	open,
	onOpenChange,
	userId,
	userName,
	onCharged,
}: ChargeCreditsDialogProps) {
	const t = useTranslations("credits.chargeDialog");
	const [amount, setAmount] = React.useState("");
	const [note, setNote] = React.useState("");
	const [isPending, setIsPending] = React.useState(false);

	React.useEffect(() => {
		if (open) {
			setAmount("");
			setNote("");
		}
	}, [open]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsed = Number(amount);
		if (!amount || !Number.isFinite(parsed) || parsed <= 0) {
			toast.error(t("invalidAmount"));
			return;
		}
		setIsPending(true);
		try {
			const result = await chargeStudentCredits(userId, parsed, note);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(t("success", { amount: parsed }));
			onCharged?.(result.data.balanceAfter);
			onOpenChange(false);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{t("title")}</DialogTitle>
						<DialogDescription>
							{userName
								? t("descriptionNamed", { name: userName })
								: t("description")}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="charge-amount">{t("amountLabel")}</Label>
							<Input
								id="charge-amount"
								type="number"
								min="1"
								step="1"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0"
								autoFocus
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="charge-note">{t("noteLabel")}</Label>
							<Textarea
								id="charge-note"
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder={t("notePlaceholder")}
								rows={2}
							/>
						</div>
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							{t("cancel")}
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && <Spinner className="size-4" />}
							{isPending ? t("charging") : t("charge")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
