"use client";

import { AlertTriangleIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { deleteAccountAction } from "./actions";

export function AccountDangerZone() {
	const t = useTranslations("account.dangerZone");
	const router = useRouter();

	const [isOpen, setIsOpen] = React.useState(false);
	const [confirmText, setConfirmText] = React.useState("");
	const [isDeleting, setIsDeleting] = React.useState(false);

	async function handleDelete() {
		if (confirmText.trim() !== "DELETE") return;

		try {
			setIsDeleting(true);
			const res = await deleteAccountAction();
			if (res.success) {
				toast.success(t("deleteSuccess"));
				setIsOpen(false);
				router.replace(routes.auth.login.page());
			} else {
				toast.error(res.error || t("deleteError"));
				setIsDeleting(false);
			}
		} catch {
			toast.error(t("deleteError"));
			setIsDeleting(false);
		}
	}

	return (
		<Card className="border-destructive/40 bg-destructive/5 shadow-xs">
			<CardHeader>
				<CardTitle className="text-xl font-semibold flex items-center gap-2 text-destructive">
					<AlertTriangleIcon className="size-5 text-destructive" />
					{t("title")}
				</CardTitle>
				<CardDescription>{t("subtitle")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-destructive/20 bg-background/50 p-4">
					<div className="space-y-1 max-w-xl">
						<h4 className="text-sm font-semibold text-foreground">
							{t("deleteAccount")}
						</h4>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{t("deleteWarning")}
						</p>
					</div>

					<Dialog open={isOpen} onOpenChange={setIsOpen}>
						<DialogTrigger asChild>
							<Button variant="destructive" className="gap-2 shrink-0">
								<Trash2Icon className="size-4" />
								{t("deleteAccount")}
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle className="text-destructive flex items-center gap-2">
									<AlertTriangleIcon className="size-5 text-destructive" />
									{t("confirmTitle")}
								</DialogTitle>
								<DialogDescription className="pt-2 text-sm leading-relaxed">
									{t("deleteWarning")}
									<br />
									<strong className="mt-2 block text-foreground">
										{t("confirmDescription")}
									</strong>
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-2 py-2">
								<Label htmlFor="delete-confirm-input" className="sr-only">
									{t("typeDeleteToConfirm")}
								</Label>
								<Input
									id="delete-confirm-input"
									value={confirmText}
									onChange={(e) => setConfirmText(e.target.value)}
									placeholder={t("typeDeleteToConfirm")}
									className="border-destructive/40 focus-visible:ring-destructive"
								/>
							</div>
							<DialogFooter className="gap-2 sm:gap-0">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsOpen(false)}
									disabled={isDeleting}
								>
									{t("cancelButton")}
								</Button>
								<Button
									type="button"
									variant="destructive"
									onClick={handleDelete}
									disabled={confirmText.trim() !== "DELETE" || isDeleting}
								>
									{t("confirmButton")}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</CardContent>
		</Card>
	);
}
