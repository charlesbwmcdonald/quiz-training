create or replace function public.assignment_email_recipients(
  target_content_type text,
  target_content_id uuid,
  target_company_ids uuid[] default '{}'::uuid[],
  include_manufacturer_team boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare mid uuid; payload jsonb;
begin
  select p.active_manufacturer_id into mid from public.profiles p where p.id=(select auth.uid());
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin','content_manager']::public.manufacturer_role[]) then
    raise exception 'Training management access required';
  end if;
  if target_content_type not in ('quiz','course') then raise exception 'Invalid training type'; end if;

  with content as (
    select q.title from public.quizzes q where target_content_type='quiz' and q.id=target_content_id and q.manufacturer_id=mid
    union all
    select c.title from public.courses c where target_content_type='course' and c.id=target_content_id and c.manufacturer_id=mid
  ), recipients as (
    select u.email from public.manufacturer_members mm join auth.users u on u.id=mm.user_id
    where include_manufacturer_team and mm.manufacturer_id=mid and mm.status='active'
    union
    select u.email from public.company_members cm join auth.users u on u.id=cm.user_id
    join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=mid and mc.status='active'
    where cm.status='active' and cm.company_id=any(target_company_ids)
  )
  select jsonb_build_object(
    'manufacturer_name',m.name,'manufacturer_slug',m.slug,'logo_url',m.logo_url,
    'primary_color',m.primary_color,'content_type',target_content_type,
    'content_title',(select title from content limit 1),
    'recipients',coalesce((select jsonb_agg(email order by email) from recipients where email is not null),'[]'::jsonb)
  ) into payload from public.manufacturers m where m.id=mid;
  if payload->>'content_title' is null then raise exception 'Training content not found'; end if;
  return payload;
end
$$;

revoke all on function public.assignment_email_recipients(text,uuid,uuid[],boolean) from public,anon;
grant execute on function public.assignment_email_recipients(text,uuid,uuid[],boolean) to authenticated;
