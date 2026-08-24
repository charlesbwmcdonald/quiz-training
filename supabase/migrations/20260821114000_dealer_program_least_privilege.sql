create policy "Participants record dealer program events"
on public.dealer_program_events for insert to authenticated
with check (
  user_id=(select auth.uid())
  and event_type in ('view','download','interest')
  and private.can_access_dealer_program(program_id)
  and exists (
    select 1
    from public.dealer_programs p
    join public.company_members cm on cm.company_id=dealer_program_events.company_id and cm.user_id=(select auth.uid()) and cm.status='active'
    join public.manufacturer_companies mc on mc.company_id=cm.company_id and mc.manufacturer_id=p.manufacturer_id and mc.status='active'
    where p.id=dealer_program_events.program_id
      and (p.audience_mode='all' or exists(select 1 from public.dealer_program_targets t where t.program_id=p.id and t.company_id=cm.company_id))
  )
);

grant insert on public.dealer_program_events to authenticated;
alter function public.record_dealer_program_event(uuid,text) security invoker;
alter function public.save_dealer_program(uuid,text,text,text,text,text,text,text,text,text,text,timestamptz,timestamptz,text,text,uuid[],uuid[]) security invoker;
