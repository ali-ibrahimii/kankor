import { type FirebaseApp, initializeApp } from "firebase/app";
import {
	getMessaging,
	getToken,
	isSupported,
	type Messaging,
	onMessage,
} from "firebase/messaging";

// Public web app config — safe to expose client-side (this is not a secret,
// same values Firebase's own docs embed directly in client code). Kept in
// sync with public/firebase-messaging-sw.js, which can't read this module
// (service workers load as a separate, unbundled script).
const firebaseConfig = {
	apiKey: "AIzaSyDFUmr3z1NlWpSefoRPX6mHvFV7tCW6y34",
	authDomain: "abzarkankorv2.firebaseapp.com",
	projectId: "abzarkankorv2",
	storageBucket: "abzarkankorv2.firebasestorage.app",
	messagingSenderId: "676025916887",
	appId: "1:676025916887:web:d943e22586271e1f4dff92",
	measurementId: "G-B1EKB5QXDW",
};

let app: FirebaseApp | undefined;
let messagingPromise: Promise<Messaging | null> | undefined;

function getFirebaseApp(): FirebaseApp {
	if (!app) app = initializeApp(firebaseConfig);
	return app;
}

/**
 * `firebase/messaging` touches browser-only APIs (indexedDB, Notification,
 * ServiceWorkerRegistration) and throws if evaluated during SSR or in an
 * unsupported browser — so this is lazy and resolves to `null` in both of
 * those cases instead of the module blowing up on import.
 */
export function getFirebaseMessaging(): Promise<Messaging | null> {
	if (typeof window === "undefined") return Promise.resolve(null);

	if (!messagingPromise) {
		messagingPromise = isSupported().then((supported) =>
			supported ? getMessaging(getFirebaseApp()) : null
		);
	}
	return messagingPromise;
}

export { getToken, onMessage };
