-- Classroom invite (instructor -> student) and join-by-code (student ->
-- instructor) both need the *other* party to approve, so they share one
-- table distinguished by `initiated_by`. School staff invites are
-- single-direction (owner/manager invites, invitee accepts) so they get
-- their own simpler table.

create type "public"."classroom_request_initiator" as enum ('instructor', 'student');
create type "public"."classroom_request_status" as enum ('pending', 'approved', 'declined');
create type "public"."school_invite_status" as enum ('pending', 'accepted', 'declined');

create table "public"."classroom_membership_requests" (
  "id" uuid not null default gen_random_uuid(),
  "classroom_id" uuid not null references public.classrooms(id) on delete cascade,
  "user_id" uuid not null references public.profiles(id) on delete cascade,
  "initiated_by" public.classroom_request_initiator not null,
  "status" public.classroom_request_status not null default 'pending',
  "invited_by" uuid references public.profiles(id) on delete set null,
  "responded_by" uuid references public.profiles(id) on delete set null,
  "responded_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

CREATE UNIQUE INDEX classroom_membership_requests_pkey ON public.classroom_membership_requests USING btree (id);
CREATE UNIQUE INDEX classroom_membership_requests_pending_key ON public.classroom_membership_requests USING btree (classroom_id, user_id) WHERE (status = 'pending');
CREATE INDEX classroom_membership_requests_user_id_idx ON public.classroom_membership_requests USING btree (user_id);
CREATE INDEX classroom_membership_requests_classroom_id_idx ON public.classroom_membership_requests USING btree (classroom_id);

alter table "public"."classroom_membership_requests" add constraint "classroom_membership_requests_pkey" PRIMARY KEY using index "classroom_membership_requests_pkey";

alter table "public"."classroom_membership_requests" enable row level security;

create trigger "set_classroom_membership_requests_updated_at"
  before update on "public"."classroom_membership_requests"
  for each row execute function public.handle_updated_at();

create policy "Involved parties can view a classroom request"
  on "public"."classroom_membership_requests"
  as permissive
  for select
  to authenticated
  using (public.is_owner(user_id) OR public.can_manage_classroom(classroom_id));

grant delete on table "public"."classroom_membership_requests" to "authenticated";
grant insert on table "public"."classroom_membership_requests" to "authenticated";
grant references on table "public"."classroom_membership_requests" to "authenticated";
grant select on table "public"."classroom_membership_requests" to "authenticated";
grant trigger on table "public"."classroom_membership_requests" to "authenticated";
grant truncate on table "public"."classroom_membership_requests" to "authenticated";
grant update on table "public"."classroom_membership_requests" to "authenticated";

grant delete on table "public"."classroom_membership_requests" to "service_role";
grant insert on table "public"."classroom_membership_requests" to "service_role";
grant references on table "public"."classroom_membership_requests" to "service_role";
grant select on table "public"."classroom_membership_requests" to "service_role";
grant trigger on table "public"."classroom_membership_requests" to "service_role";
grant truncate on table "public"."classroom_membership_requests" to "service_role";
grant update on table "public"."classroom_membership_requests" to "service_role";

create table "public"."school_member_invites" (
  "id" uuid not null default gen_random_uuid(),
  "school_id" uuid not null references public.schools(id) on delete cascade,
  "user_id" uuid not null references public.profiles(id) on delete cascade,
  "role" public.school_member_role not null default 'staff',
  "invited_by" uuid references public.profiles(id) on delete set null,
  "status" public.school_invite_status not null default 'pending',
  "responded_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

CREATE UNIQUE INDEX school_member_invites_pkey ON public.school_member_invites USING btree (id);
CREATE UNIQUE INDEX school_member_invites_pending_key ON public.school_member_invites USING btree (school_id, user_id) WHERE (status = 'pending');
CREATE INDEX school_member_invites_user_id_idx ON public.school_member_invites USING btree (user_id);
CREATE INDEX school_member_invites_school_id_idx ON public.school_member_invites USING btree (school_id);

alter table "public"."school_member_invites" add constraint "school_member_invites_pkey" PRIMARY KEY using index "school_member_invites_pkey";

alter table "public"."school_member_invites" enable row level security;

create trigger "set_school_member_invites_updated_at"
  before update on "public"."school_member_invites"
  for each row execute function public.handle_updated_at();

create policy "Involved parties can view a school invite"
  on "public"."school_member_invites"
  as permissive
  for select
  to authenticated
  using (public.is_owner(user_id) OR public.is_school_editor(school_id));

grant delete on table "public"."school_member_invites" to "authenticated";
grant insert on table "public"."school_member_invites" to "authenticated";
grant references on table "public"."school_member_invites" to "authenticated";
grant select on table "public"."school_member_invites" to "authenticated";
grant trigger on table "public"."school_member_invites" to "authenticated";
grant truncate on table "public"."school_member_invites" to "authenticated";
grant update on table "public"."school_member_invites" to "authenticated";

grant delete on table "public"."school_member_invites" to "service_role";
grant insert on table "public"."school_member_invites" to "service_role";
grant references on table "public"."school_member_invites" to "service_role";
grant select on table "public"."school_member_invites" to "service_role";
grant trigger on table "public"."school_member_invites" to "service_role";
grant truncate on table "public"."school_member_invites" to "service_role";
grant update on table "public"."school_member_invites" to "service_role";

-- ─── Classroom invite (instructor -> student) ──────────────────────────────

create or replace function public.create_classroom_invite(
  p_classroom_id uuid,
  p_student_email text
)
returns public.classroom_membership_requests
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_student_id uuid;
  v_classroom_name text;
  v_request public.classroom_membership_requests;
begin
  if not public.can_manage_classroom(p_classroom_id) then
    raise exception 'Not authorized to invite students to this classroom.';
  end if;

  select id into v_student_id from public.profiles where lower(email) = lower(p_student_email);
  if v_student_id is null then
    raise exception 'No account found with that email.';
  end if;

  if exists (
    select 1 from public.classroom_members
    where classroom_id = p_classroom_id and user_id = v_student_id
  ) then
    raise exception 'That student is already a member of this classroom.';
  end if;

  if exists (
    select 1 from public.classroom_membership_requests
    where classroom_id = p_classroom_id and user_id = v_student_id and status = 'pending'
  ) then
    raise exception 'There is already a pending request for that student.';
  end if;

  select name into v_classroom_name from public.classrooms where id = p_classroom_id;

  insert into public.classroom_membership_requests (classroom_id, user_id, initiated_by, invited_by)
  values (p_classroom_id, v_student_id, 'instructor', auth.uid())
  returning * into v_request;

  perform public.create_app_notification(
    p_user_id := v_student_id,
    p_type := 'classroom_invite',
    p_title := 'Classroom invite: ' || coalesce(v_classroom_name, 'a classroom'),
    p_message := 'You''ve been invited to join a classroom. Accept to get access to its materials.',
    p_related_entity_type := 'classroom_membership_request',
    p_related_entity_id := v_request.id,
    p_actor_id := auth.uid()
  );

  return v_request;
end;
$function$;

revoke execute on function public.create_classroom_invite(uuid, text) from public, anon;
grant execute on function public.create_classroom_invite(uuid, text) to authenticated;

-- ─── Join by code (student -> instructor) ──────────────────────────────────

create or replace function public.request_join_classroom(
  p_join_code text
)
returns public.classroom_membership_requests
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_classroom_id uuid;
  v_classroom_name text;
  v_instructor record;
  v_request public.classroom_membership_requests;
begin
  select id, name into v_classroom_id, v_classroom_name
  from public.classrooms
  where join_code = p_join_code and is_archived = false;

  if v_classroom_id is null then
    raise exception 'Invalid join code.';
  end if;

  if exists (
    select 1 from public.classroom_members
    where classroom_id = v_classroom_id and user_id = auth.uid()
  ) then
    raise exception 'You are already a member of this classroom.';
  end if;

  if exists (
    select 1 from public.classroom_membership_requests
    where classroom_id = v_classroom_id and user_id = auth.uid() and status = 'pending'
  ) then
    raise exception 'You already have a pending request for this classroom.';
  end if;

  insert into public.classroom_membership_requests (classroom_id, user_id, initiated_by)
  values (v_classroom_id, auth.uid(), 'student')
  returning * into v_request;

  for v_instructor in
    select user_id from public.classroom_members
    where classroom_id = v_classroom_id and role in ('owner', 'instructor')
  loop
    perform public.create_app_notification(
      p_user_id := v_instructor.user_id,
      p_type := 'classroom_join_request',
      p_title := 'New join request: ' || coalesce(v_classroom_name, 'your classroom'),
      p_message := 'A student wants to join using your classroom code. Review and approve or decline.',
      p_related_entity_type := 'classroom_membership_request',
      p_related_entity_id := v_request.id,
      p_actor_id := auth.uid()
    );
  end loop;

  return v_request;
end;
$function$;

revoke execute on function public.request_join_classroom(text) from public, anon;
grant execute on function public.request_join_classroom(text) to authenticated;

-- ─── Respond to either direction ────────────────────────────────────────────

create or replace function public.respond_to_classroom_request(
  p_request_id uuid,
  p_approve boolean
)
returns public.classroom_membership_requests
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_request public.classroom_membership_requests;
  v_classroom_name text;
  v_notify_user_id uuid;
begin
  select * into v_request from public.classroom_membership_requests where id = p_request_id;
  if v_request.id is null then
    raise exception 'Request not found.';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'This request has already been responded to.';
  end if;

  if v_request.initiated_by = 'instructor' then
    if not public.is_owner(v_request.user_id) then
      raise exception 'Not authorized to respond to this invite.';
    end if;
    v_notify_user_id := v_request.invited_by;
  else
    if not public.can_manage_classroom(v_request.classroom_id) then
      raise exception 'Not authorized to respond to this request.';
    end if;
    v_notify_user_id := v_request.user_id;
  end if;

  update public.classroom_membership_requests
    set status = case when p_approve then 'approved'::public.classroom_request_status else 'declined'::public.classroom_request_status end,
        responded_by = auth.uid(),
        responded_at = now()
    where id = p_request_id
    returning * into v_request;

  if p_approve then
    insert into public.classroom_members (classroom_id, user_id, role)
    values (v_request.classroom_id, v_request.user_id, 'student')
    on conflict (classroom_id, user_id) do nothing;
  end if;

  select name into v_classroom_name from public.classrooms where id = v_request.classroom_id;

  if v_notify_user_id is not null then
    perform public.create_app_notification(
      p_user_id := v_notify_user_id,
      p_type := 'classroom_invite_response',
      p_title := case when p_approve then 'Approved: ' else 'Declined: ' end || coalesce(v_classroom_name, 'classroom request'),
      p_message := case
        when p_approve then 'Your classroom request was approved.'
        else 'Your classroom request was declined.'
      end,
      p_related_entity_type := 'classroom_membership_request',
      p_related_entity_id := v_request.id,
      p_actor_id := auth.uid()
    );
  end if;

  return v_request;
end;
$function$;

revoke execute on function public.respond_to_classroom_request(uuid, boolean) from public, anon;
grant execute on function public.respond_to_classroom_request(uuid, boolean) to authenticated;

-- ─── School staff invite ────────────────────────────────────────────────────

create or replace function public.invite_school_member(
  p_school_id uuid,
  p_email text,
  p_role public.school_member_role
)
returns public.school_member_invites
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_school_name text;
  v_invite public.school_member_invites;
begin
  if not public.is_school_editor(p_school_id) then
    raise exception 'Not authorized to invite members to this school.';
  end if;

  select id into v_user_id from public.profiles where lower(email) = lower(p_email);
  if v_user_id is null then
    raise exception 'No account found with that email.';
  end if;

  if exists (
    select 1 from public.school_members
    where school_id = p_school_id and user_id = v_user_id
  ) then
    raise exception 'That person is already a member of this school.';
  end if;

  if exists (
    select 1 from public.school_member_invites
    where school_id = p_school_id and user_id = v_user_id and status = 'pending'
  ) then
    raise exception 'There is already a pending invite for that person.';
  end if;

  select name into v_school_name from public.schools where id = p_school_id;

  insert into public.school_member_invites (school_id, user_id, role, invited_by)
  values (p_school_id, v_user_id, p_role, auth.uid())
  returning * into v_invite;

  perform public.create_app_notification(
    p_user_id := v_user_id,
    p_type := 'school_invite',
    p_title := 'School invite: ' || coalesce(v_school_name, 'a school'),
    p_message := 'You''ve been invited to join a school as ' || p_role::text || '.',
    p_related_entity_type := 'school_member_invite',
    p_related_entity_id := v_invite.id,
    p_actor_id := auth.uid()
  );

  return v_invite;
end;
$function$;

revoke execute on function public.invite_school_member(uuid, text, public.school_member_role) from public, anon;
grant execute on function public.invite_school_member(uuid, text, public.school_member_role) to authenticated;

create or replace function public.respond_to_school_invite(
  p_invite_id uuid,
  p_accept boolean
)
returns public.school_member_invites
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_invite public.school_member_invites;
  v_school_name text;
begin
  select * into v_invite from public.school_member_invites where id = p_invite_id;
  if v_invite.id is null then
    raise exception 'Invite not found.';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'This invite has already been responded to.';
  end if;
  if not public.is_owner(v_invite.user_id) then
    raise exception 'Not authorized to respond to this invite.';
  end if;

  update public.school_member_invites
    set status = case when p_accept then 'accepted'::public.school_invite_status else 'declined'::public.school_invite_status end,
        responded_at = now()
    where id = p_invite_id
    returning * into v_invite;

  if p_accept and not exists (
    select 1 from public.school_members
    where school_id = v_invite.school_id and user_id = v_invite.user_id
  ) then
    insert into public.school_members (school_id, user_id, role)
    values (v_invite.school_id, v_invite.user_id, v_invite.role);
  end if;

  select name into v_school_name from public.schools where id = v_invite.school_id;

  if v_invite.invited_by is not null then
    perform public.create_app_notification(
      p_user_id := v_invite.invited_by,
      p_type := 'school_invite_response',
      p_title := case when p_accept then 'Accepted: ' else 'Declined: ' end || coalesce(v_school_name, 'school invite'),
      p_message := case
        when p_accept then 'Your invited member accepted and joined the school.'
        else 'Your invited member declined the invite.'
      end,
      p_related_entity_type := 'school_member_invite',
      p_related_entity_id := v_invite.id,
      p_actor_id := auth.uid()
    );
  end if;

  return v_invite;
end;
$function$;

revoke execute on function public.respond_to_school_invite(uuid, boolean) from public, anon;
grant execute on function public.respond_to_school_invite(uuid, boolean) to authenticated;

-- ─── OMR grading was never wired into the notification system: a scan being
-- scored/needing review is the OMR equivalent of "quiz_graded" for regular
-- quizzes, which already notifies. Redefine to add that call. ─────────────

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
  v_student_id uuid;
  v_quiz_title text;
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

  select qv.student_id, q.title
    into v_student_id, v_quiz_title
    from public.quiz_variants qv
    join public.quizzes q on q.id = qv.quiz_id
    where qv.id = v_scan.variant_id;

  if v_student_id is not null then
    perform public.create_app_notification(
      p_user_id := v_student_id,
      p_type := 'quiz_graded',
      p_title := 'Quiz graded: ' || coalesce(v_quiz_title, 'your quiz'),
      p_message := case
        when v_scan.score_pct is not null then 'Your score: ' || v_scan.score_pct || '%'
        else 'Your answer sheet has been scored.'
      end,
      p_related_entity_type := 'quiz_variant',
      p_related_entity_id := v_scan.variant_id,
      p_actor_id := null
    );
  end if;

  return v_scan;
end;
$function$;
