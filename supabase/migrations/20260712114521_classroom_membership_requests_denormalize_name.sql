-- classrooms' SELECT RLS only allows classroom members (or the owner) to
-- read a classroom's name — a student with a pending request isn't a member
-- yet, so a `classroom:classrooms(name)` join from their own request row
-- silently returns null. Denormalize the name onto the request row at
-- creation time instead (same pattern as certificates.course_title).

alter table "public"."classroom_membership_requests"
  add column "classroom_name" text;

update public.classroom_membership_requests r
set classroom_name = c.name
from public.classrooms c
where c.id = r.classroom_id and r.classroom_name is null;

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

  insert into public.classroom_membership_requests (classroom_id, user_id, initiated_by, invited_by, classroom_name)
  values (p_classroom_id, v_student_id, 'instructor', auth.uid(), v_classroom_name)
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

  insert into public.classroom_membership_requests (classroom_id, user_id, initiated_by, classroom_name)
  values (v_classroom_id, auth.uid(), 'student', v_classroom_name)
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
