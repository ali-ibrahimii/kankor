import { clientEnv } from "@/lib/env/client-env";
import { getFirebaseMessaging, getToken } from "@/lib/firebase";

async function getServiceWorkerRegistration() {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
		return null;
	}
	return navigator.serviceWorker.register("/firebase-messaging-sw.js");
}

/**
 * Resolves to the current device's FCM registration token, registering the
 * service worker along the way. Returns null (never throws) whenever push
 * isn't usable right now — unsupported browser, no VAPID key configured, no
 * service worker, or Firebase rejects the request — so callers can treat
 * "no token" as the only failure case they need to handle.
 */
export async function requestPushToken(): Promise<string | null> {
	if (typeof window === "undefined" || !clientEnv.firebaseVapidKey) {
		return null;
	}

	const messaging = await getFirebaseMessaging();
	if (!messaging) return null;

	const registration = await getServiceWorkerRegistration();
	if (!registration) return null;

	return getToken(messaging, {
		vapidKey: clientEnv.firebaseVapidKey,
		serviceWorkerRegistration: registration,
	}).catch(() => null);
}
