// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
const isProd = process.env.NODE_ENV !== 'development';

if (isProd)
	Sentry.init({
		dsn: "https://d60819c71a1ff051ebf365118b31fb08@o4511645238820864.ingest.de.sentry.io/4511645250093136",

		// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
		tracesSampleRate: 1,

		// Enable logs to be sent to Sentry
		enableLogs: true,

		// Enable sending user PII (Personally Identifiable Information)
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
		sendDefaultPii: true,
	});
