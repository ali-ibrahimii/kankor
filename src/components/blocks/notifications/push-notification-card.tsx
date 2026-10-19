"use client";

import { BellRing } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { registerFcmToken, unregisterFcmToken } from "./fcm-actions";
import { requestPushToken } from "./push-registration";

type PushState = "checking" | "unsupported" | "denied" | "enabled" | "disabled";

export function PushNotificationCard() {
	const t = useTranslations("notifications");
	const [state, setState] = useState<PushState>("checking");
	const [isBusy, setIsBusy] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function checkExistingPermission() {
			if (typeof Notification === "undefined") {
				setState("unsupported");
				return;
			}
			if (Notification.permission === "denied") {
				setState("denied");
				return;
			}
			if (Notification.permission !== "granted") {
				setState("disabled");
				return;
			}

			const token = await requestPushToken();
			if (cancelled) return;
			if (!token) {
				setState("unsupported");
				return;
			}
			await registerFcmToken(token, navigator.userAgent);
			if (!cancelled) setState("enabled");
		}

		checkExistingPermission();
		return () => {
			cancelled = true;
		};
	}, []);

	async function handleEnable() {
		if (typeof Notification === "undefined") return;
		setIsBusy(true);
		const permission = await Notification.requestPermission();
		if (permission !== "granted") {
			setIsBusy(false);
			setState(permission === "denied" ? "denied" : "disabled");
			return;
		}

		const token = await requestPushToken();
		if (!token) {
			setIsBusy(false);
			toast.error(t("pushEnableError"));
			return;
		}
		const result = await registerFcmToken(token, navigator.userAgent);
		setIsBusy(false);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		setState("enabled");
	}

	async function handleDisable() {
		setIsBusy(true);
		const token = await requestPushToken();
		if (token) await unregisterFcmToken(token);
		setIsBusy(false);
		setState("disabled");
		toast.success(t("pushDisabled"));
	}

	if (state === "checking" || state === "unsupported") return null;

	return (
		<div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-4">
			<div className="flex items-center gap-3">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
					<BellRing className="size-4" />
				</div>
				<div>
					<p className="text-sm font-medium">{t("pushTitle")}</p>
					<p className="text-xs text-muted-foreground">
						{state === "denied"
							? t("pushDeniedDescription")
							: state === "enabled"
								? t("pushEnabledDescription")
								: t("pushDescription")}
					</p>
				</div>
			</div>
			{state === "enabled" ? (
				<Button
					variant="outline"
					size="sm"
					disabled={isBusy}
					onClick={handleDisable}
				>
					{t("pushDisable")}
				</Button>
			) : (
				<Button
					size="sm"
					disabled={isBusy || state === "denied"}
					onClick={handleEnable}
				>
					{t("pushEnable")}
				</Button>
			)}
		</div>
	);
}
