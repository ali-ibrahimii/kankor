-- Certificate PDF generation & public verification support.
--
-- Context: `complete_lesson_for_user` already inserts a `certificates` row
-- (with a random `verification_code`) the moment an enrollment reaches 100%
-- progress — i.e. every mandatory lesson is complete, and lessons gated by a
-- quiz only complete when the quiz is passed (see
-- `complete_and_grade_quiz_attempt`). So a `certificates` row existing IS the
-- eligibility proof. This migration adds the two missing server-side pieces:
--
-- 1. `attach_certificate_pdf` — lets the owner persist the generated PDF's
--    R2 storage key onto their own certificate without opening a broad
--    UPDATE RLS policy on the table (course_title / user_full_name / codes
--    stay immutable to users).
-- 2. `verify_certificate` — anon-callable lookup by verification code that
--    exposes only the fields a third party (e.g. an employer) needs.

-- ─── 1. Attach the generated PDF to the owner's certificate ────────────────

create or replace function public.attach_certificate_pdf(
	p_certificate_id uuid,
	p_pdf_storage_key text
)
returns public.certificates
language plpgsql
security definer
set search_path to 'public'
as $$
declare
	cert public.certificates;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated.';
	end if;

	select * into cert from public.certificates where id = p_certificate_id;

	if cert is null or cert.user_id <> auth.uid() then
		raise exception 'Certificate not found.';
	end if;

	-- Idempotent: once a PDF is attached it never changes (re-claims reuse it).
	if cert.certificate_pdf_url is not null then
		return cert;
	end if;

	update public.certificates
	set
		certificate_pdf_url = p_pdf_storage_key,
		issued_at = coalesce(issued_at, now()),
		updated_at = now()
	where id = p_certificate_id
	returning * into cert;

	return cert;
end;
$$;

revoke all on function public.attach_certificate_pdf(uuid, text) from public;
grant execute on function public.attach_certificate_pdf(uuid, text) to authenticated;

-- ─── 2. Public verification by code ────────────────────────────────────────
--
-- Security definer so anonymous visitors can verify a certificate that RLS
-- would otherwise hide. Returns only the minimum needed to confirm
-- authenticity — never ids, user ids, or storage keys.

create or replace function public.verify_certificate(p_verification_code text)
returns table (
	user_full_name text,
	course_title text,
	issued_at timestamptz,
	created_at timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
	select
		c.user_full_name,
		c.course_title,
		c.issued_at,
		c.created_at
	from public.certificates c
	where c.verification_code = upper(trim(p_verification_code));
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
