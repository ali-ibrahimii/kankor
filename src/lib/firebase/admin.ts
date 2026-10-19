import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { serverEnv } from "@/lib/env/server-env";

/**
 * Server-only — never import this from a client component. Returns null
 * when the FIREBASE_* service-account env vars aren't set, so callers can
 * no-op gracefully instead of crashing (same pattern as the Telegram bot
 * token and R2 credentials).
 */
export function getFirebaseAdminMessaging() {
	const { projectId, clientEmail, privateKey } = serverEnv.firebaseAdmin;
	if (!projectId || !clientEmail || !privateKey) return null;

	const app =
		getApps()[0] ??
		initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

	return getMessaging(app);
}
