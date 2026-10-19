-- OMR (bubble-sheet) module: quiz registrations, printed variants, and scan intake.
--
-- Builds entirely on top of the existing quizzes/questions/question_options
-- tables (no changes to their shape). See docs/omr-module.md for the full
-- design rationale, RLS summary, and the function contracts consumed by the
-- Next.js dashboard and the external Python OMR service.

-- =============================================================================
-- 1. New columns on quizzes: registration deadline + print lock state
-- =============================================================================

alter table "public"."quizzes"
  add column "registration_deadline" timestamptz,
  add column "locked_at" timestamptz,
  add column "print_version" integer not null default 0;

comment on column "public"."quizzes"."registration_deadline" is 'After this timestamp, students can no longer self-register via quiz_registrations. Null = registration always open.';
comment on column "public"."quizzes"."locked_at" is 'Set the first time answer sheets are printed (generate_quiz_variants). While set, questions/question_options for this quiz cannot be edited. Cleared via unlock_quiz_for_editing().';
comment on column "public"."quizzes"."print_version" is 'Incremented each time the quiz transitions from unlocked to locked (i.e. each distinct print run after an edit). Stamped onto quiz_variants.template_version.';

-- =============================================================================
-- 2. quiz_registrations: which students are booked/registered for a quiz
-- =============================================================================

create type "public"."quiz_registration_source" as enum ('self', 'owner');

create table "public"."quiz_registrations" (
  "id" uuid not null default gen_random_uuid(),
  "quiz_id" uuid not null references public.quizzes(id) on delete cascade,
  "student_id" uuid not null references public.profiles(id) on delete cascade,
  "source" public.quiz_registration_source not null default 'self',
  "registered_by" uuid references public.profiles(id) on delete set null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "quiz_registrations_pkey" primary key ("id"),
  constraint "quiz_registrations_quiz_student_key" unique ("quiz_id", "student_id")
);

create index "quiz_registrations_quiz_id_idx" on "public"."quiz_registrations" ("quiz_id");
create index "quiz_registrations_student_id_idx" on "public"."quiz_registrations" ("student_id");

alter table "public"."quiz_registrations" enable row level security;

create trigger "set_quiz_registrations_updated_at"
  before update on "public"."quiz_registrations"
  for each row execute function public.handle_updated_at();

-- Helper: is registration still open for this quiz (deadline not yet passed)?
create or replace function public.quiz_registration_open(p_quiz_id uuid)
 returns boolean
 language sql
 stable
 set search_path to 'public'
as $function$
  select coalesce(
    (select registration_deadline is null or registration_deadline > now()
     from public.quizzes
     where id = p_quiz_id),
    false
  );
$function$;

create policy "Student and owner can view quiz registrations"
  on "public"."quiz_registrations" for select to authenticated
  using (is_owner(student_id) or public.can_manage_quiz(quiz_id));

create policy "Students can self-register before the deadline"
  on "public"."quiz_registrations" for insert to authenticated
  with check (
    is_owner(student_id)
    and source = 'self'
    and is_owner(registered_by)
    and public.quiz_registration_open(quiz_id)
  );

create policy "Owner can register any student anytime"
  on "public"."quiz_registrations" for insert to authenticated
  with check (
    source = 'owner'
    and is_owner(registered_by)
    and public.can_manage_quiz(quiz_id)
  );

create policy "Student can withdraw their own registration"
  on "public"."quiz_registrations" for delete to authenticated
  using (is_owner(student_id));

create policy "Owner can remove any registration"
  on "public"."quiz_registrations" for delete to authenticated
  using (public.can_manage_quiz(quiz_id));

grant all on table "public"."quiz_registrations" to "anon";
grant all on table "public"."quiz_registrations" to "authenticated";
grant all on table "public"."quiz_registrations" to "service_role";

-- =============================================================================
-- 3. quiz_variants: one printed/shuffled sheet per registered student
-- =============================================================================

create table "public"."quiz_variants" (
  "id" uuid not null default gen_random_uuid(),
  "quiz_id" uuid not null references public.quizzes(id) on delete cascade,
  "student_id" uuid not null references public.profiles(id) on delete cascade,
  "question_order" uuid[] not null,
  "shuffled" boolean not null default false,
  "template_version" integer not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "quiz_variants_pkey" primary key ("id"),
  constraint "quiz_variants_quiz_student_version_key" unique ("quiz_id", "student_id", "template_version")
);

create index "quiz_variants_quiz_id_idx" on "public"."quiz_variants" ("quiz_id");
create index "quiz_variants_student_id_idx" on "public"."quiz_variants" ("student_id");

alter table "public"."quiz_variants" enable row level security;

create trigger "set_quiz_variants_updated_at"
  before update on "public"."quiz_variants"
  for each row execute function public.handle_updated_at();

create policy "Student and owner can view a quiz variant"
  on "public"."quiz_variants" for select to authenticated
  using (is_owner(student_id) or public.can_manage_quiz(quiz_id));

create policy "Owner can manage quiz variants"
  on "public"."quiz_variants" for all to authenticated
  using (public.can_manage_quiz(quiz_id))
  with check (public.can_manage_quiz(quiz_id));

grant all on table "public"."quiz_variants" to "anon";
grant all on table "public"."quiz_variants" to "authenticated";
grant all on table "public"."quiz_variants" to "service_role";

-- =============================================================================
-- 4. Lock enforcement: once a quiz is locked (printed), its questions and
--    question_options cannot be edited until explicitly unlocked.
-- =============================================================================

create or replace function public.prevent_locked_quiz_question_edit()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_quiz_id uuid;
  v_locked_at timestamptz;
begin
  v_quiz_id := coalesce(new.quiz_id, old.quiz_id);

  if v_quiz_id is null and tg_table_name = 'question_options' then
    select quiz_id into v_quiz_id
    from public.questions
    where id = coalesce(new.question_id, old.question_id);
  end if;

  if v_quiz_id is null then
    return coalesce(new, old);
  end if;

  select locked_at into v_locked_at from public.quizzes where id = v_quiz_id;

  if v_locked_at is not null then
    raise exception 'Quiz % is locked because answer sheets have already been printed. Call unlock_quiz_for_editing() first — this requires reprinting for all registered students.', v_quiz_id;
  end if;

  return coalesce(new, old);
end;
$function$;

create trigger "prevent_edit_when_quiz_locked"
  before insert or update or delete on "public"."questions"
  for each row execute function public.prevent_locked_quiz_question_edit();

create trigger "prevent_edit_when_quiz_locked"
  before insert or update or delete on "public"."question_options"
  for each row execute function public.prevent_locked_quiz_question_edit();

-- =============================================================================
-- 5. omr_scans / omr_scan_responses: uploaded sheet images + graded responses
--    (named to avoid colliding with the pre-existing, unrelated
--    public.answer_sheets lesson answer-key table)
-- =============================================================================

create type "public"."omr_scan_status" as enum ('pending', 'processing', 'scored', 'needs_review', 'error');

create table "public"."omr_scans" (
  "id" uuid not null default gen_random_uuid(),
  "variant_id" uuid not null references public.quiz_variants(id) on delete cascade,
  "image_storage_path" text not null,
  "status" public.omr_scan_status not null default 'pending',
  "raw_omr_result" jsonb,
  "error_message" text,
  "total_questions" integer,
  "total_correct" integer,
  "score_pct" numeric(5,2),
  "scored_at" timestamptz,
  "uploaded_by" uuid not null references public.profiles(id) on delete cascade,
  "uploaded_at" timestamptz not null default now(),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "omr_scans_pkey" primary key ("id")
);

create index "omr_scans_variant_id_idx" on "public"."omr_scans" ("variant_id");
create index "omr_scans_status_idx" on "public"."omr_scans" ("status");

alter table "public"."omr_scans" enable row level security;

create trigger "set_omr_scans_updated_at"
  before update on "public"."omr_scans"
  for each row execute function public.handle_updated_at();

create table "public"."omr_scan_responses" (
  "id" uuid not null default gen_random_uuid(),
  "scan_id" uuid not null references public.omr_scans(id) on delete cascade,
  "question_id" uuid not null references public.questions(id) on delete cascade,
  "detected_option_index" smallint,
  "confidence" real,
  "is_correct" boolean,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "omr_scan_responses_pkey" primary key ("id"),
  constraint "omr_scan_responses_scan_question_key" unique ("scan_id", "question_id")
);

create index "omr_scan_responses_scan_id_idx" on "public"."omr_scan_responses" ("scan_id");

alter table "public"."omr_scan_responses" enable row level security;

create trigger "set_omr_scan_responses_updated_at"
  before update on "public"."omr_scan_responses"
  for each row execute function public.handle_updated_at();

-- Helper: does the calling user manage the quiz that owns this scan?
create or replace function public.can_manage_omr_scan(p_scan_id uuid, p_user_id uuid default auth.uid())
 returns boolean
 language sql
 stable
 set search_path to 'public'
as $function$
  select public.can_manage_quiz(qv.quiz_id, p_user_id)
  from public.omr_scans os
  join public.quiz_variants qv on qv.id = os.variant_id
  where os.id = p_scan_id;
$function$;

create policy "Owner can view omr scans"
  on "public"."omr_scans" for select to authenticated
  using (exists (
    select 1 from public.quiz_variants qv
    where qv.id = omr_scans.variant_id and public.can_manage_quiz(qv.quiz_id)
  ));

create policy "Owner can upload omr scans"
  on "public"."omr_scans" for insert to authenticated
  with check (
    is_owner(uploaded_by)
    and exists (
      select 1 from public.quiz_variants qv
      where qv.id = variant_id and public.can_manage_quiz(qv.quiz_id)
    )
  );

create policy "Owner can update omr scans"
  on "public"."omr_scans" for update to authenticated
  using (exists (
    select 1 from public.quiz_variants qv
    where qv.id = omr_scans.variant_id and public.can_manage_quiz(qv.quiz_id)
  ));

grant all on table "public"."omr_scans" to "anon";
grant all on table "public"."omr_scans" to "authenticated";
grant all on table "public"."omr_scans" to "service_role";

create policy "Owner can view omr scan responses"
  on "public"."omr_scan_responses" for select to authenticated
  using (public.can_manage_omr_scan(scan_id));

create policy "Owner can insert omr scan responses"
  on "public"."omr_scan_responses" for insert to authenticated
  with check (public.can_manage_omr_scan(scan_id));

create policy "Owner can update omr scan responses"
  on "public"."omr_scan_responses" for update to authenticated
  using (public.can_manage_omr_scan(scan_id));

grant all on table "public"."omr_scan_responses" to "anon";
grant all on table "public"."omr_scan_responses" to "authenticated";
grant all on table "public"."omr_scan_responses" to "service_role";

-- =============================================================================
-- 6. Functions: print/variant generation, unlock, and scan intake contract
-- =============================================================================

-- Generates one quiz_variant per currently registered student who doesn't
-- already have one for the quiz's current print_version. Locks the quiz on
-- first call. Idempotent and safe to call repeatedly as more students
-- register (existing variants for the current version are left untouched).
create or replace function public.generate_quiz_variants(
  p_quiz_id uuid,
  p_shuffle boolean default false,
  p_user_id uuid default auth.uid()
)
 returns setof public.quiz_variants
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_quiz public.quizzes;
  v_question_ids uuid[];
  v_new_version integer;
  v_reg record;
  v_order uuid[];
begin
  if not public.can_manage_quiz(p_quiz_id, p_user_id) then
    raise exception 'Not authorized to print answer sheets for this quiz.';
  end if;

  select * into v_quiz from public.quizzes where id = p_quiz_id;
  if v_quiz.id is null then
    raise exception 'Quiz % not found.', p_quiz_id;
  end if;

  select array_agg(id order by order_index, created_at) into v_question_ids
  from public.questions
  where quiz_id = p_quiz_id;

  if v_question_ids is null or array_length(v_question_ids, 1) is null then
    raise exception 'Quiz % has no questions to print.', p_quiz_id;
  end if;

  if not exists (select 1 from public.quiz_registrations where quiz_id = p_quiz_id) then
    raise exception 'Quiz % has no registered students to print for.', p_quiz_id;
  end if;

  if v_quiz.locked_at is null then
    v_new_version := v_quiz.print_version + 1;
    update public.quizzes
      set locked_at = now(), print_version = v_new_version
      where id = p_quiz_id;
  else
    v_new_version := v_quiz.print_version;
  end if;

  for v_reg in
    select student_id from public.quiz_registrations where quiz_id = p_quiz_id
  loop
    if not exists (
      select 1 from public.quiz_variants
      where quiz_id = p_quiz_id
        and student_id = v_reg.student_id
        and template_version = v_new_version
    ) then
      if p_shuffle then
        select array_agg(q order by random())
          into v_order
          from unnest(v_question_ids) as q;
      else
        v_order := v_question_ids;
      end if;

      insert into public.quiz_variants (quiz_id, student_id, question_order, shuffled, template_version)
      values (p_quiz_id, v_reg.student_id, v_order, p_shuffle, v_new_version);
    end if;
  end loop;

  return query
    select * from public.quiz_variants
    where quiz_id = p_quiz_id and template_version = v_new_version;
end;
$function$;

-- Explicit, deliberate unlock so an owner can edit a printed quiz's
-- questions/options. Does not delete existing variants/scans (those remain
-- the historical record of what was actually printed and scored) — the next
-- generate_quiz_variants() call will bump print_version and create a fresh
-- set of variants for every currently registered student.
create or replace function public.unlock_quiz_for_editing(
  p_quiz_id uuid,
  p_user_id uuid default auth.uid()
)
 returns public.quizzes
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_quiz public.quizzes;
begin
  if not public.can_manage_quiz(p_quiz_id, p_user_id) then
    raise exception 'Not authorized to unlock this quiz.';
  end if;

  update public.quizzes
    set locked_at = null
    where id = p_quiz_id
    returning * into v_quiz;

  if v_quiz.id is null then
    raise exception 'Quiz % not found.', p_quiz_id;
  end if;

  return v_quiz;
end;
$function$;

-- Called right after the dashboard uploads a scan image to the
-- `omr-scans` storage bucket, to create the pending intake row.
create or replace function public.create_omr_scan(
  p_variant_id uuid,
  p_image_storage_path text,
  p_user_id uuid default auth.uid()
)
 returns public.omr_scans
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_quiz_id uuid;
  v_scan public.omr_scans;
begin
  select quiz_id into v_quiz_id from public.quiz_variants where id = p_variant_id;
  if v_quiz_id is null then
    raise exception 'Quiz variant % not found.', p_variant_id;
  end if;

  if not public.can_manage_quiz(v_quiz_id, p_user_id) then
    raise exception 'Not authorized to upload a scan for this quiz.';
  end if;

  insert into public.omr_scans (variant_id, image_storage_path, status, uploaded_by)
  values (p_variant_id, p_image_storage_path, 'pending', p_user_id)
  returning * into v_scan;

  return v_scan;
end;
$function$;

-- Called by the Next.js server route (service role) after the external
-- Python OMR service returns a successful result. Writes per-question
-- responses, computes the score once (frozen from then on, immune to any
-- later edits to questions/question_options), and sets status to
-- 'scored' or 'needs_review' based on per-response confidence.
create or replace function public.record_omr_scan_result(
  p_scan_id uuid,
  p_responses jsonb,
  p_raw_result jsonb default null,
  p_confidence_threshold real default 0.75
)
 returns public.omr_scans
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_resp jsonb;
  v_question_id uuid;
  v_detected smallint;
  v_confidence real;
  v_is_correct boolean;
  v_total_questions integer := 0;
  v_total_correct integer := 0;
  v_needs_review boolean := false;
  v_scan public.omr_scans;
begin
  select * into v_scan from public.omr_scans where id = p_scan_id;
  if v_scan.id is null then
    raise exception 'OMR scan % not found.', p_scan_id;
  end if;

  delete from public.omr_scan_responses where scan_id = p_scan_id;

  for v_resp in select * from jsonb_array_elements(p_responses)
  loop
    v_question_id := (v_resp ->> 'question_id')::uuid;
    v_detected := nullif(v_resp ->> 'detected_option_index', '')::smallint;
    v_confidence := nullif(v_resp ->> 'confidence', '')::real;

    v_is_correct := v_detected is not null and exists (
      select 1 from public.question_options qo
      where qo.question_id = v_question_id
        and qo.order_index = v_detected
        and qo.is_correct = true
    );

    if v_confidence is null or v_confidence < p_confidence_threshold then
      v_needs_review := true;
    end if;

    insert into public.omr_scan_responses (
      scan_id, question_id, detected_option_index, confidence, is_correct
    ) values (
      p_scan_id, v_question_id, v_detected, v_confidence, v_is_correct
    );

    v_total_questions := v_total_questions + 1;
    if v_is_correct then
      v_total_correct := v_total_correct + 1;
    end if;
  end loop;

  update public.omr_scans
    set raw_omr_result = coalesce(p_raw_result, raw_omr_result),
        total_questions = v_total_questions,
        total_correct = v_total_correct,
        score_pct = case when v_total_questions > 0
                      then round((v_total_correct::numeric / v_total_questions) * 100, 2)
                      else null end,
        scored_at = now(),
        status = case when v_needs_review then 'needs_review'::public.omr_scan_status else 'scored'::public.omr_scan_status end,
        error_message = null
    where id = p_scan_id
    returning * into v_scan;

  return v_scan;
end;
$function$;

-- Called by the Next.js server route when the external OMR service call
-- fails or errors, so the upload is never lost and the UI can offer a retry
-- without re-uploading the image.
create or replace function public.mark_omr_scan_error(
  p_scan_id uuid,
  p_error_message text
)
 returns public.omr_scans
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_scan public.omr_scans;
begin
  update public.omr_scans
    set status = 'error', error_message = p_error_message
    where id = p_scan_id
    returning * into v_scan;

  if v_scan.id is null then
    raise exception 'OMR scan % not found.', p_scan_id;
  end if;

  return v_scan;
end;
$function$;

-- record_omr_scan_result / mark_omr_scan_error write results computed by a
-- trusted server-to-server call (Next.js API route using the service-role
-- client, after calling the external OMR service) and do not re-check quiz
-- ownership. They must never be callable directly by end users.
revoke execute on function public.record_omr_scan_result(uuid, jsonb, jsonb, real) from public, anon, authenticated;
grant execute on function public.record_omr_scan_result(uuid, jsonb, jsonb, real) to service_role;

revoke execute on function public.mark_omr_scan_error(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_omr_scan_error(uuid, text) to service_role;

-- =============================================================================
-- 7. Storage bucket for uploaded answer-sheet scan images
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('omr-scans', 'omr-scans', false)
on conflict (id) do nothing;

-- Path convention: omr-scans/{quiz_id}/{variant_id}/{filename}
create policy "Owner can read omr scan objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'omr-scans'
    and public.can_manage_quiz(((storage.foldername(name))[1])::uuid)
  );

create policy "Owner can upload omr scan objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'omr-scans'
    and public.can_manage_quiz(((storage.foldername(name))[1])::uuid)
  );

create policy "Owner can delete omr scan objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'omr-scans'
    and public.can_manage_quiz(((storage.foldername(name))[1])::uuid)
  );
