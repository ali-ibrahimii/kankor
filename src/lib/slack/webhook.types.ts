/**
 * Shape of the payload a Supabase Database Webhook POSTs to our route handlers.
 * @see https://supabase.com/docs/guides/database/webhooks
 */
export type SupabaseWebhookPayload<Row> =
	| {
			type: "INSERT";
			table: string;
			schema: string;
			record: Row;
			old_record: null;
	  }
	| {
			type: "UPDATE";
			table: string;
			schema: string;
			record: Row;
			old_record: Row;
	  }
	| {
			type: "DELETE";
			table: string;
			schema: string;
			record: null;
			old_record: Row;
	  };
