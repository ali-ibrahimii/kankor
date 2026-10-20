import { clientEnv } from "./client-env";
import { type ServerEnv, serverSchema } from "./schema";

function parseServerEnv(): ServerEnv {
	const env = {
		...clientEnv,
		supabase: {
			...clientEnv.supabase,
			secretKey:
				process.env.SUPABASE_SERVICE_ROLE_KEY || "not-supported-in-client-env",
		},
		omr: {
			serviceUrl: process.env.OMR_SERVICE_URL || undefined,
			internalSecret: process.env.OMR_INTERNAL_SECRET || undefined,
		},
		r2: {
			accountId: process.env.R2_ACCOUNT_ID || undefined,
			accessKeyId: process.env.R2_ACCESS_KEY_ID || undefined,
			secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || undefined,
			bucketName: process.env.R2_BUCKET_NAME || undefined,
			endpoint: process.env.R2_ENDPOINT || undefined,
			publicHostname: process.env.R2_PUBLIC_HOSTNAME || undefined,
		},
		telegram: {
			botToken: process.env.TELEGRAM_BOT_TOKEN || undefined,
			botUsername: process.env.TELEGRAM_BOT || undefined,
			webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
		},
		cron: {
			secret: process.env.CRON_SECRET || undefined,
		},
		slack: {
			channelId: process.env.SLACK_CHANNEL_ID || undefined,
			webhookUrl: process.env.SLACK_WEBHOOK_URL || undefined,
			signingSecret: process.env.SLACK_SIGNING_SECRET || undefined,
			dbWebhookSecret: process.env.SLACK_DB_WEBHOOK_SECRET || undefined,
		},
		firebaseAdmin: {
			projectId: process.env.FIREBASE_PROJECT_ID || undefined,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL || undefined,
			// Service-account keys come JSON-escaped (literal "\n"); env files
			// can't hold real newlines in a single value.
			privateKey:
				process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || undefined,
		},
	};

	return serverSchema.parse(env);
}

export const serverEnv = parseServerEnv();
