-- New notification_type values for the classroom invite/join-request and
-- school staff invite flows. Split into its own migration/transaction —
-- Postgres won't let a newly added enum value be referenced by name until
-- the ADD VALUE has committed.
alter type "public"."notification_type" add value if not exists 'classroom_invite';
alter type "public"."notification_type" add value if not exists 'classroom_join_request';
alter type "public"."notification_type" add value if not exists 'classroom_invite_response';
alter type "public"."notification_type" add value if not exists 'school_invite';
alter type "public"."notification_type" add value if not exists 'school_invite_response';
