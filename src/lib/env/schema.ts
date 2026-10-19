import { z } from "zod";

// Base schema for common environment variables
const baseSchema = z.object({
	app: z.object({
		name: z.string().optional().default("Abzar Kankor"),
		email: z.email().default("info@abzarkankor.com"),
		address: z.url().default("https://www.abzarkankor.com"),
		playStoreUrl: z
			.url()
			.default(
				"https://play.google.com/store/apps/details?id=com.abzarkankor.abzarkankor2"
			),
		androidAppSchema: z.string().default("com.abzarkankor.abzarkankor2"),
	}),

	supabase: z.object({
		url: z.string().min(1).default("https://xjzmpanstxgwwjupujwr.supabase.co"),
		publishableKey: z.string().min(1),
		secretKey: z.string().min(1),
	}),
});

// Server-only schema
export const serverSchema = baseSchema.extend({
	omr: z.object({
		serviceUrl: z.url().optional(),
	}),

	// Cloudflare R2 (S3-compatible) object storage for course assets — videos,
	// documents/slides, audio, and answer sheet scans. Optional so local/dev
	// environments without R2 credentials still boot; upload/sign actions
	// check `isR2Configured()` and fail gracefully when unset.
	r2: z.object({
		accountId: z.string().min(1).optional(),
		accessKeyId: z.string().min(1).optional(),
		secretAccessKey: z.string().min(1).optional(),
		bucketName: z.string().min(1).optional(),
		/** Defaults to `https://{accountId}.r2.cloudflarestorage.com` when unset. */
		endpoint: z.url().optional(),
		/**
		 * R2 "custom domain" (e.g. storage.abzarkankor.com) — serves objects
		 * publicly with NO signature check. Only ever use this for a future
		 * public-asset kind (thumbnails, avatars, marketing images). Never
		 * build a URL from this for video/audio/document/answer_sheet keys —
		 * those must always go through getAssetSignedUrl.
		 */
		publicHostname: z.string().optional(),
	}),

	// Telegram delivery for the notifications system — optional so
	// local/dev environments without a bot configured still boot; the
	// webhook and delivery-cron routes check these and respond 503 when unset.
	telegram: z.object({
		botToken: z.string().min(1).optional(),
		botUsername: z.string().min(1).optional(),
		webhookSecret: z.string().min(1).optional(),
	}),

	cron: z.object({
		secret: z.string().min(1).optional(),
	}),

	// Slack notifications for manual account approval. `webhookUrl` is an
	// Incoming Webhook that posts the "new signup" message (with an Approve
	// button) into the abzarkankor channel; `channelId` identifies that
	// channel; `signingSecret` verifies the interactivity payload Slack sends
	// back when someone clicks Approve. All optional so local/dev environments
	// without Slack configured still boot — the routes check these and no-op
	// (webhooks) or 503 (interactions) when unset. `dbWebhookSecret` optionally
	// guards the Supabase database webhooks that trigger the notifications.
	slack: z.object({
		channelId: z.string().min(1).optional(),
		webhookUrl: z.url().optional(),
		signingSecret: z.string().min(1).optional(),
		dbWebhookSecret: z.string().min(1).optional(),
	}),

	// Firebase Admin SDK — sends the actual web push notifications. Optional
	// so local/dev environments without it still boot; the push-delivery
	// cron route checks this and responds 503 when unset. Uses discrete env
	// vars rather than a checked-in service-account JSON file.
	firebaseAdmin: z.object({
		projectId: z.string().min(1).optional(),
		clientEmail: z.string().min(1).optional(),
		privateKey: z.string().min(1).optional(),
	}),
});

// Client-only schema (subset of base schema)
export const clientSchema = baseSchema
	.pick({
		app: true,
		supabase: true,
	})
	.extend({
		// Web Push "public key" — not a secret, used client-side to request an
		// FCM registration token. Optional so the app still boots without it;
		// the push opt-in card checks this and stays disabled when unset.
		firebaseVapidKey: z.string().min(1).optional(),
		// Microsoft Clarity Project ID for session recording and heatmaps.
		clarityProjectId: z.string().min(1).optional(),
	});

// Type inference
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
