"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { clientEnv } from "@/lib/env/client-env";
import { getFirebaseMessaging, onMessage } from "@/lib/firebase";
import { useIsAuthenticated } from "@/providers/auth.provider";

/**
 * FCM only auto-shows an OS notification for background/closed-tab
 * messages (handled by public/firebase-messaging-sw.js) — a message that
 * arrives while the tab is focused has to be surfaced manually, so we show
 * it as a toast instead. Mounted once, app-wide, in Providers.
 */
export function PushMessageListener() {
	const isAuthenticated = useIsAuthenticated();

	useEffect(() => {
		if (!isAuthenticated || !clientEnv.firebaseVapidKey) return;

		let unsubscribe: (() => void) | undefined;
		let cancelled = false;

		getFirebaseMessaging().then(async (messaging) => {
			if (cancelled || !messaging) return;
			const unsub = await onMessage(messaging, (payload) => {
				const title = payload.notification?.title ?? payload.data?.title;
				const body = payload.notification?.body ?? payload.data?.body;
				if (title) toast(title, { description: body });
			});
			if (cancelled) {
				unsub();
			} else {
				unsubscribe = unsub;
			}
		});

		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	}, [isAuthenticated]);

	return null;
}
