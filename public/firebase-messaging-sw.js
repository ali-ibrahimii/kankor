// Handles push notifications while the app isn't in the foreground. Uses the
// classic importScripts/compat build (not the ESM firebase/messaging/sw
// build) because module service workers still aren't supported everywhere —
// this runs in every browser Web Push itself supports.
importScripts(
	"https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"
);
importScripts(
	"https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js"
);

// Keep in sync with src/lib/firebase/index.ts — this config is not a secret.
firebase.initializeApp({
	apiKey: "AIzaSyDFUmr3z1NlWpSefoRPX6mHvFV7tCW6y34",
	authDomain: "abzarkankorv2.firebaseapp.com",
	projectId: "abzarkankorv2",
	storageBucket: "abzarkankorv2.firebasestorage.app",
	messagingSenderId: "676025916887",
	appId: "1:676025916887:web:d943e22586271e1f4dff92",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
	const title =
		payload.notification?.title ?? payload.data?.title ?? "Abzar Kankor";
	const body = payload.notification?.body ?? payload.data?.body ?? "";

	self.registration.showNotification(title, {
		body,
		icon: "/favicon-96x96.png",
	});
});
