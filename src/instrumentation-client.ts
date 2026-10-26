// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { resetDevCache } from "@/lib/pwa/reset-dev-cache";

const isProd = process.env.NODE_ENV === "production";

// Development only: front-run the app bundle so a stale service-worker cache
// from an earlier production run can never serve outdated dev chunks.
if (!isProd) {
	resetDevCache().catch(() => {});
}

if (isProd) {
	Sentry.init({
		dsn: "https://d60819c71a1ff051ebf365118b31fb08@o4511645238820864.ingest.de.sentry.io/4511645250093136",
		tracesSampleRate: 0.1,
		enableLogs: false,
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 1.0,
		sendDefaultPii: true,
	});
}

export const onRouterTransitionStart = isProd
	? Sentry.captureRouterTransitionStart
	: undefined;
