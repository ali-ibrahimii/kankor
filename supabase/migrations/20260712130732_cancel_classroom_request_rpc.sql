-- Lets the inviting instructor/owner withdraw a pending invite they sent
-- (initiated_by = 'instructor'). Not for student-initiated join requests —
-- those are the instructor's to approve/decline, not cancel.

create or replace function public.cancel_classroom_request(
  p_request_id uuid
)
returns public.classroom_membership_requests
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_request public.classroom_membership_requests;
begin
  select * into v_request from public.classroom_membership_requests where id = p_request_id;
  if v_request.id is null then
    raise exception 'Request not found.';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'This request has already been responded to.';
  end if;
  if v_request.initiated_by <> 'instructor' then
    raise exception 'Only invites you sent can be canceled.';
  end if;
  if not public.can_manage_classroom(v_request.classroom_id) then
    raise exception 'Not authorized to cancel this invite.';
  end if;

  update public.classroom_membership_requests
    set status = 'canceled'::public.classroom_request_status,
        responded_by = auth.uid(),
        responded_at = now()
    where id = p_request_id
    returning * into v_request;

  return v_request;
end;
$function$;

revoke execute on function public.cancel_classroom_request(uuid) from public, anon;
grant execute on function public.cancel_classroom_request(uuid) to authenticated;
