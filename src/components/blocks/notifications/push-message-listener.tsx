"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { getFirebaseMessaging, onMessage } from "@/lib/firebase";

/**
 * FCM only auto-shows an OS notification for background/closed-tab
 * messages (handled by public/firebase-messaging-sw.js) — a message that
 * arrives while the tab is focused has to be surfaced manually, so we show
 * it as a toast instead. Mounted once, app-wide, in Providers.
 */
export function PushMessageListener() {
	useEffect(() => {
		let unsubscribe: (() => void) | undefined;
		let cancelled = false;

		getFirebaseMessaging().then((messaging) => {
			if (cancelled || !messaging) return;
			unsubscribe = onMessage(messaging, (payload) => {
				const title = payload.notification?.title ?? payload.data?.title;
				const body = payload.notification?.body ?? payload.data?.body;
				if (title) toast(title, { description: body });
			});
		});

		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	}, []);

	return null;
}
