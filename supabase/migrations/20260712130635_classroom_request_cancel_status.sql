-- New status for an instructor withdrawing their own pending invite before
-- the student responds. Split into its own migration/transaction — Postgres
-- won't let a newly added enum value be referenced by name until the ADD
-- VALUE has committed.
alter type "public"."classroom_request_status" add value if not exists 'canceled';
