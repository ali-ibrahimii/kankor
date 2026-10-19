import type { FirebaseApp } from "firebase/app";
import type {
	GetTokenOptions,
	MessagePayload,
	Messaging,
	NextFn,
	Observer,
	Unsubscribe,
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

let appPromise: Promise<FirebaseApp> | undefined;
let messagingPromise: Promise<Messaging | null> | undefined;

function getFirebaseApp(): Promise<FirebaseApp> {
	if (!appPromise) {
		appPromise = import("firebase/app").then(({ initializeApp }) =>
			initializeApp(firebaseConfig)
		);
	}
	return appPromise;
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
		messagingPromise = import("firebase/messaging")
			.then(async ({ getMessaging, isSupported }) => {
				const supported = await isSupported();
				if (!supported) return null;
				const app = await getFirebaseApp();
				return getMessaging(app);
			})
			.catch(() => null);
	}
	return messagingPromise;
}

export async function getToken(
	messaging: Messaging,
	options?: GetTokenOptions
): Promise<string> {
	const { getToken: fbGetToken } = await import("firebase/messaging");
	return fbGetToken(messaging, options);
}

export async function onMessage(
	messaging: Messaging,
	nextOrObserver: NextFn<MessagePayload> | Observer<MessagePayload>
): Promise<Unsubscribe> {
	const { onMessage: fbOnMessage } = await import("firebase/messaging");
	return fbOnMessage(messaging, nextOrObserver);
}
