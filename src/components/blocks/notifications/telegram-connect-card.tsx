"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	createTelegramLinkToken,
	disconnectTelegram,
} from "./telegram-actions";

export type TelegramConnectCardProps = {
	initiallyLinked: boolean;
};

export function TelegramConnectCard({
	initiallyLinked,
}: TelegramConnectCardProps) {
	const t = useTranslations("notifications");
	const [linked, setLinked] = useState(initiallyLinked);
	const [isConnecting, setIsConnecting] = useState(false);
	const [isDisconnecting, setIsDisconnecting] = useState(false);

	async function handleConnect() {
		setIsConnecting(true);
		const result = await createTelegramLinkToken();
		setIsConnecting(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		window.location.href = result.data.deepLink;
	}

	async function handleDisconnect() {
		setIsDisconnecting(true);
		const result = await disconnectTelegram();
		setIsDisconnecting(false);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		setLinked(false);
		toast.success(t("telegramDisconnected"));
	}

	return (
		<div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-4">
			<div className="flex items-center gap-3">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Send className="size-4" />
				</div>
				<div>
					<p className="text-sm font-medium">{t("telegramTitle")}</p>
					<p className="text-xs text-muted-foreground">
						{linked
							? t("telegramConnectedDescription")
							: t("telegramDescription")}
					</p>
				</div>
			</div>
			{linked ? (
				<Button
					variant="outline"
					size="sm"
					disabled={isDisconnecting}
					onClick={handleDisconnect}
				>
					{t("telegramDisconnect")}
				</Button>
			) : (
				<Button size="sm" disabled={isConnecting} onClick={handleConnect}>
					{t("telegramConnect")}
				</Button>
			)}
		</div>
	);
}
