alter table public.platform_invitations
  add column if not exists email_status text not null default 'not_sent',
  add column if not exists email_attempts integer not null default 0,
  add column if not exists last_email_at timestamptz,
  add column if not exists email_provider_id text,
  add column if not exists email_error text;

alter table public.platform_invitations
  drop constraint if exists platform_invitations_email_status_check;

alter table public.platform_invitations
  add constraint platform_invitations_email_status_check
  check (email_status in ('not_sent','not_configured','sent','failed'));

create or replace function public.get_invitation_email_payload(target_invitation_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  invitation public.platform_invitations%rowtype;
  active_manufacturer uuid;
  allowed boolean := false;
begin
  select * into invitation from public.platform_invitations where id = target_invitation_id;
  if invitation.id is null then raise exception 'Invitation not found'; end if;

  if private.is_platform_owner() then
    allowed := true;
  else
    select p.active_manufacturer_id into active_manufacturer from public.profiles p where p.id = (select auth.uid());
    allowed := active_manufacturer is not null
      and private.has_manufacturer_role(active_manufacturer, array['owner','admin']::public.manufacturer_role[])
      and (
        invitation.manufacturer_id = active_manufacturer
        or exists (
          select 1 from public.manufacturer_companies mc
          where mc.manufacturer_id = active_manufacturer and mc.company_id = invitation.company_id and mc.status = 'active'
        )
      );
  end if;
  if not allowed then raise exception 'Invitation management access required' using errcode = '42501'; end if;

  return (
    select jsonb_build_object(
      'id', i.id, 'email', i.email, 'invitation_type', i.invitation_type, 'role', i.role,
      'status', case when i.expires_at <= now() and i.status in ('pending','sent') then 'expired' else i.status end,
      'expires_at', i.expires_at, 'email_attempts', i.email_attempts,
      'manufacturer_name', case when i.invitation_type = 'platform_owner' then 'JobberTrain' else coalesce(m.name, 'JobberTrain') end,
      'company_name', c.name, 'logo_url', m.logo_url,
      'primary_color', case when i.invitation_type = 'platform_owner' then '#ff4f1f' else coalesce(m.primary_color, '#ff4f1f') end
    )
    from public.platform_invitations i
    left join public.manufacturers m on m.id = coalesce(i.manufacturer_id, (
      select mc.manufacturer_id from public.manufacturer_companies mc
      where mc.company_id = i.company_id and mc.status = 'active' limit 1
    ))
    left join public.companies c on c.id = i.company_id
    where i.id = invitation.id
  );
end;
$$;

create or replace function public.record_invitation_email_delivery(
  target_invitation_id uuid,
  delivery_status text,
  provider_message_id text default null,
  delivery_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  payload jsonb;
begin
  payload := public.get_invitation_email_payload(target_invitation_id);
  if delivery_status not in ('not_configured','sent','failed') then raise exception 'Invalid delivery status'; end if;
  update public.platform_invitations
  set email_status = delivery_status,
      email_attempts = email_attempts + 1,
      last_email_at = now(),
      email_provider_id = case when delivery_status = 'sent' then provider_message_id else null end,
      email_error = case when delivery_status = 'sent' then null else left(delivery_error, 500) end
  where id = target_invitation_id;
end;
$$;

create or replace function public.invitation_delivery_directory()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare active_manufacturer uuid;
begin
  if private.is_platform_owner() then
    return coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'email_status',i.email_status,'email_attempts',i.email_attempts,'last_email_at',i.last_email_at,'email_error',i.email_error)) from public.platform_invitations i),'[]'::jsonb);
  end if;
  select p.active_manufacturer_id into active_manufacturer from public.profiles p where p.id = (select auth.uid());
  if active_manufacturer is null or not private.has_manufacturer_role(active_manufacturer, array['owner','admin']::public.manufacturer_role[]) then raise exception 'Manufacturer admin access required' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id',i.id,'email_status',i.email_status,'email_attempts',i.email_attempts,'last_email_at',i.last_email_at,'email_error',i.email_error))
    from public.platform_invitations i
    where i.manufacturer_id = active_manufacturer or exists (
      select 1 from public.manufacturer_companies mc where mc.manufacturer_id = active_manufacturer and mc.company_id = i.company_id and mc.status = 'active'
    )
  ),'[]'::jsonb);
end;
$$;

revoke all on function public.get_invitation_email_payload(uuid) from public, anon;
revoke all on function public.record_invitation_email_delivery(uuid,text,text,text) from public, anon;
revoke all on function public.invitation_delivery_directory() from public, anon;
grant execute on function public.get_invitation_email_payload(uuid) to authenticated;
grant execute on function public.record_invitation_email_delivery(uuid,text,text,text) to authenticated;
grant execute on function public.invitation_delivery_directory() to authenticated;
