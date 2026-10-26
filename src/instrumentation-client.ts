// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { resetDevCache } from "@/lib/pwa/reset-dev-cache";

/**
 * Turbopack keeps unhashed dev chunks in the browser, so a long-lived tab can
 * end up running a module graph whose dependencies no longer exist and every
 * navigation throws "module factory is not available". Reload once (bounded, so
 * a persistent failure cannot loop) instead of asking the user to do it.
 */
function reloadOnceOnStaleChunk() {
	if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
		return;
	}

	const KEY = "dev-stale-chunk-reloads";
	const MAX = 3;

	window.addEventListener("error", (event) => {
		const message =
			(event.error instanceof Error ? event.error.message : "") ||
			event.message ||
			"";
		if (!message.includes("module factory is not available")) return;

		const attempts = Number(sessionStorage.getItem(KEY) ?? "0");
		if (attempts >= MAX) return;

		sessionStorage.setItem(KEY, String(attempts + 1));
		window.setTimeout(() => window.location.reload(), 300);
	});
}

const isProd = process.env.NODE_ENV === "production";

// Development only: front-run the app bundle so a stale service-worker cache
// from an earlier production run can never serve outdated dev chunks.
if (!isProd) {
	resetDevCache().catch(() => {});
	reloadOnceOnStaleChunk();
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
