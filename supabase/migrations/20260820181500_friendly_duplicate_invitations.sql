create or replace function public.create_manufacturer_invitation(
  invite_email text,
  invite_kind text,
  target_company_id uuid default null,
  invite_role text default 'learner'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
  invite_id uuid;
begin
  select p.active_manufacturer_id into mid from public.profiles p where p.id = (select auth.uid());
  if mid is null or not private.has_manufacturer_role(mid,array['owner','admin']::public.manufacturer_role[]) then raise exception 'Manufacturer admin access required'; end if;
  invite_email := lower(trim(invite_email));
  if invite_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'Enter a valid email address'; end if;

  if invite_kind = 'manufacturer_member' then
    if invite_role not in ('admin','content_manager','viewer') then raise exception 'Invalid manufacturer role'; end if;
    target_company_id := null;
  elsif invite_kind in ('retailer_manager','retailer_learner') then
    if target_company_id is null or not exists (
      select 1 from public.manufacturer_companies mc
      where mc.manufacturer_id = mid and mc.company_id = target_company_id and mc.status = 'active'
    ) then raise exception 'Select a connected retailer'; end if;
    invite_role := case when invite_kind = 'retailer_manager' then 'manager' else 'learner' end;
  else
    raise exception 'Invalid invitation type';
  end if;

  update public.platform_invitations
  set status = 'expired'
  where status in ('pending','sent') and expires_at <= now()
    and (
      (invite_kind = 'manufacturer_member' and manufacturer_id = mid)
      or (invite_kind like 'retailer_%' and company_id = target_company_id)
    );

  if exists (
    select 1 from public.platform_invitations i
    where lower(i.email) = invite_email
      and i.status in ('pending','sent')
      and i.expires_at > now()
      and (
        (invite_kind = 'manufacturer_member' and i.manufacturer_id = mid)
        or (invite_kind like 'retailer_%' and i.company_id = target_company_id)
      )
  ) then
    raise exception 'An active invitation already exists for this email. Use Send email in Open invitations to resend it.';
  end if;

  insert into public.platform_invitations(email,invitation_type,manufacturer_id,company_id,role,invited_by)
  values(invite_email,invite_kind,case when invite_kind = 'manufacturer_member' then mid else null end,target_company_id,invite_role,(select auth.uid()))
  returning id into invite_id;
  return invite_id;
end;
$$;

create or replace function public.create_platform_invitation(
  invite_email text,
  invite_type text,
  target_manufacturer_id uuid default null,
  target_company_id uuid default null,
  invite_role text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid;
begin
  if not private.is_platform_owner() then raise exception 'Platform owner access required' using errcode = '42501'; end if;
  invite_email := lower(trim(invite_email));
  if invite_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'Enter a valid email address'; end if;
  if invite_type not in ('platform_owner','manufacturer_owner','manufacturer_member','retailer_manager','retailer_learner') then raise exception 'Invalid invitation type'; end if;
  if invite_type like 'manufacturer_%' and target_manufacturer_id is null then raise exception 'Select a manufacturer'; end if;
  if invite_type like 'retailer_%' and target_company_id is null then raise exception 'Select a retailer company'; end if;
  if invite_type = 'platform_owner' then target_manufacturer_id := null; target_company_id := null; invite_role := 'owner'; end if;

  update public.platform_invitations
  set status = 'expired'
  where status in ('pending','sent') and expires_at <= now();

  if exists (
    select 1 from public.platform_invitations i
    where lower(i.email) = invite_email
      and i.status in ('pending','sent')
      and i.expires_at > now()
      and i.invitation_type = invite_type
      and i.manufacturer_id is not distinct from target_manufacturer_id
      and i.company_id is not distinct from target_company_id
  ) then
    raise exception 'An active invitation already exists for this email. Use Send email in Invitations to resend it.';
  end if;

  insert into public.platform_invitations(email,invitation_type,manufacturer_id,company_id,role,invited_by)
  values(invite_email,invite_type,target_manufacturer_id,target_company_id,invite_role,(select auth.uid()))
  returning id into new_id;
  insert into public.platform_audit_log(actor_user_id,action,entity_type,entity_id,details)
  values((select auth.uid()),'invitation_created','platform_invitation',new_id::text,jsonb_build_object('email',invite_email,'type',invite_type,'role',invite_role));
  return new_id;
end;
$$;

revoke all on function public.create_manufacturer_invitation(text,text,uuid,text) from public, anon;
revoke all on function public.create_platform_invitation(text,text,uuid,uuid,text) from public, anon;
grant execute on function public.create_manufacturer_invitation(text,text,uuid,text) to authenticated;
grant execute on function public.create_platform_invitation(text,text,uuid,uuid,text) to authenticated;
