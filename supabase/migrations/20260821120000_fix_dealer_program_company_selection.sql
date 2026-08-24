create or replace function public.record_dealer_program_event(target_program_id uuid, target_event_type text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  participant_company_id uuid;
begin
  if (select auth.uid()) is null or target_event_type not in ('view','download','interest') then raise exception 'Invalid program event'; end if;
  if not private.can_access_dealer_program(target_program_id) then raise exception 'Program access required'; end if;

  select cm.company_id into participant_company_id
  from public.dealer_programs p
  join public.company_members cm on cm.user_id=(select auth.uid()) and cm.status='active'
  join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=p.manufacturer_id and mc.status='active'
  where p.id=target_program_id
    and (p.audience_mode='all' or exists(select 1 from public.dealer_program_targets t where t.program_id=p.id and t.company_id=cm.company_id))
  order by cm.company_id
  limit 1;

  if participant_company_id is null then return; end if;
  insert into public.dealer_program_events(program_id,company_id,user_id,event_type)
  values(target_program_id,participant_company_id,(select auth.uid()),target_event_type)
  on conflict (program_id,company_id) where event_type='interest' do nothing;
end;
$$;

revoke all on function public.record_dealer_program_event(uuid,text) from public,anon;
grant execute on function public.record_dealer_program_event(uuid,text) to authenticated;
