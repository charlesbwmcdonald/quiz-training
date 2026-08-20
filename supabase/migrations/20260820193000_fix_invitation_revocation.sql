create or replace function public.manage_manufacturer_invitation(target_invitation_id uuid, next_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare mid uuid;
begin
  select p.active_manufacturer_id into mid from public.profiles p where p.id = (select auth.uid());
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin']::public.manufacturer_role[]) then raise exception 'Manufacturer admin access required'; end if;
  if not exists(select 1 from public.platform_invitations i where i.id=target_invitation_id and (i.manufacturer_id=mid or exists(select 1 from public.manufacturer_companies mc where mc.manufacturer_id=mid and mc.company_id=i.company_id))) then raise exception 'Invitation not found'; end if;

  if next_action in ('cancel','revoke') then
    update public.platform_invitations set status='revoked' where id=target_invitation_id and status in ('pending','sent');
  elsif next_action='renew' then
    update public.platform_invitations set status='pending',expires_at=now()+interval '7 days' where id=target_invitation_id and status<>'accepted';
  else
    raise exception 'Invalid action';
  end if;

  if not found then raise exception 'Invitation could not be updated'; end if;
end
$$;

revoke all on function public.manage_manufacturer_invitation(uuid,text) from public, anon;
grant execute on function public.manage_manufacturer_invitation(uuid,text) to authenticated;
